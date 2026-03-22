-- ============================================================
-- 014_usuarios_conectados.sql
-- Tablas y vistas para dashboard de usuarios en tiempo real
-- ============================================================

-- ── 1. Tabla de presencia: registra heartbeat de usuarios conectados ──
CREATE TABLE IF NOT EXISTS usuarios_conectados (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_seen     TIMESTAMPTZ NOT NULL DEFAULT now(),
  pagina        TEXT,                -- ruta actual ej: /buscar, /usuario, /nexo/123
  dispositivo   TEXT,                -- mobile | desktop | tablet
  ip            INET,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(usuario_id)
);

CREATE INDEX IF NOT EXISTS idx_usuarios_conectados_last_seen
  ON usuarios_conectados(last_seen DESC);

CREATE INDEX IF NOT EXISTS idx_usuarios_conectados_usuario
  ON usuarios_conectados(usuario_id);

-- ── 2. Historial de sesiones (log permanente) ──
CREATE TABLE IF NOT EXISTS sesiones_log (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  inicio        TIMESTAMPTZ NOT NULL DEFAULT now(),
  fin           TIMESTAMPTZ,
  duracion_seg  INT GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (COALESCE(fin, now()) - inicio))::INT
  ) STORED,
  paginas       JSONB DEFAULT '[]',  -- array de rutas visitadas
  dispositivo   TEXT,
  ip            INET,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sesiones_log_usuario
  ON sesiones_log(usuario_id, inicio DESC);

CREATE INDEX IF NOT EXISTS idx_sesiones_log_inicio
  ON sesiones_log(inicio DESC);

-- ── 3. Vista: usuarios online (activos en últimos 5 minutos) ──
CREATE OR REPLACE VIEW v_usuarios_online AS
SELECT
  uc.usuario_id,
  u.nombre_usuario,
  u.email,
  u.codigo,
  u.plan,
  uc.pagina,
  uc.dispositivo,
  uc.last_seen,
  EXTRACT(EPOCH FROM (now() - uc.last_seen))::INT AS segundos_inactivo
FROM usuarios_conectados uc
JOIN usuarios u ON u.id = uc.usuario_id
WHERE uc.last_seen > now() - INTERVAL '5 minutes'
ORDER BY uc.last_seen DESC;

-- ── 4. Vista: estadísticas en tiempo real para dashboard ──
CREATE OR REPLACE VIEW v_dashboard_realtime AS
SELECT
  (SELECT COUNT(*) FROM usuarios_conectados
    WHERE last_seen > now() - INTERVAL '5 minutes')   AS online_ahora,
  (SELECT COUNT(*) FROM usuarios_conectados
    WHERE last_seen > now() - INTERVAL '15 minutes')  AS online_15min,
  (SELECT COUNT(*) FROM usuarios_conectados
    WHERE last_seen > now() - INTERVAL '1 hour')      AS online_1h,
  (SELECT COUNT(DISTINCT usuario_id) FROM sesiones_log
    WHERE inicio >= CURRENT_DATE)                      AS usuarios_hoy,
  (SELECT COUNT(DISTINCT usuario_id) FROM sesiones_log
    WHERE inicio >= CURRENT_DATE - INTERVAL '7 days')  AS usuarios_7d,
  (SELECT AVG(duracion_seg) FROM sesiones_log
    WHERE inicio >= CURRENT_DATE
    AND fin IS NOT NULL)                               AS duracion_promedio_hoy,
  (SELECT COUNT(*) FROM usuarios)                      AS total_registrados;

-- ── 5. Vista: distribución por página (qué secciones se usan ahora) ──
CREATE OR REPLACE VIEW v_paginas_activas AS
SELECT
  COALESCE(pagina, '/desconocida') AS pagina,
  COUNT(*)                         AS usuarios,
  MIN(last_seen)                   AS primera_visita,
  MAX(last_seen)                   AS ultima_visita
FROM usuarios_conectados
WHERE last_seen > now() - INTERVAL '5 minutes'
GROUP BY pagina
ORDER BY usuarios DESC;

-- ── 6. Vista: picos por hora (últimas 24h) ──
CREATE OR REPLACE VIEW v_picos_por_hora AS
SELECT
  date_trunc('hour', inicio) AS hora,
  COUNT(DISTINCT usuario_id) AS usuarios_unicos,
  COUNT(*)                    AS sesiones
FROM sesiones_log
WHERE inicio >= now() - INTERVAL '24 hours'
GROUP BY date_trunc('hour', inicio)
ORDER BY hora DESC;

-- ── 7. Función upsert para heartbeat (llamar cada 30-60 seg desde el frontend) ──
CREATE OR REPLACE FUNCTION fn_heartbeat(
  p_usuario_id UUID,
  p_pagina     TEXT DEFAULT NULL,
  p_dispositivo TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO usuarios_conectados (usuario_id, last_seen, pagina, dispositivo)
  VALUES (p_usuario_id, now(), p_pagina, p_dispositivo)
  ON CONFLICT (usuario_id)
  DO UPDATE SET
    last_seen   = now(),
    pagina      = COALESCE(EXCLUDED.pagina, usuarios_conectados.pagina),
    dispositivo = COALESCE(EXCLUDED.dispositivo, usuarios_conectados.dispositivo);
END;
$$;

-- ── 8. Función para iniciar sesión en el log ──
CREATE OR REPLACE FUNCTION fn_iniciar_sesion(
  p_usuario_id  UUID,
  p_dispositivo TEXT DEFAULT NULL,
  p_ip          INET DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id BIGINT;
BEGIN
  INSERT INTO sesiones_log (usuario_id, dispositivo, ip)
  VALUES (p_usuario_id, p_dispositivo, p_ip)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- ── 9. Función para cerrar sesión en el log ──
CREATE OR REPLACE FUNCTION fn_cerrar_sesion(
  p_sesion_id   BIGINT,
  p_paginas     JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE sesiones_log
  SET fin = now(),
      paginas = COALESCE(p_paginas, paginas)
  WHERE id = p_sesion_id;
END;
$$;

-- ── 10. Limpieza automática: borrar presencias viejas (> 1 hora) ──
CREATE OR REPLACE FUNCTION fn_limpiar_presencias()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_borrados INT;
BEGIN
  DELETE FROM usuarios_conectados
  WHERE last_seen < now() - INTERVAL '1 hour';
  GET DIAGNOSTICS v_borrados = ROW_COUNT;
  RETURN v_borrados;
END;
$$;

-- ── 11. RLS ──
ALTER TABLE usuarios_conectados ENABLE ROW LEVEL SECURITY;
ALTER TABLE sesiones_log ENABLE ROW LEVEL SECURITY;

-- Admins pueden ver todo
CREATE POLICY "admin_ver_conectados" ON usuarios_conectados
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin')
  );

-- Cada usuario puede insertar/actualizar su propia presencia
CREATE POLICY "usuario_heartbeat" ON usuarios_conectados
  FOR ALL USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());

-- Admins pueden ver todo el log
CREATE POLICY "admin_ver_sesiones" ON sesiones_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin')
  );

-- Cada usuario puede insertar/actualizar sus propias sesiones
CREATE POLICY "usuario_sesiones" ON sesiones_log
  FOR ALL USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());
