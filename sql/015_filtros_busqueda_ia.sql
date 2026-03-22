-- ============================================================
-- 015_filtros_busqueda_ia.sql
-- Filtros globales para búsquedas automáticas IA
-- ============================================================

CREATE TABLE IF NOT EXISTS filtros_busqueda_ia (
  id          BIGSERIAL PRIMARY KEY,
  nombre      TEXT NOT NULL,
  tipo        VARCHAR(20) NOT NULL DEFAULT 'texto',
  opciones    JSONB DEFAULT '[]',
  activo      BOOLEAN DEFAULT true,
  orden       INTEGER DEFAULT 0,
  categorias  JSONB DEFAULT '["todos"]',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE filtros_busqueda_ia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pub_select" ON filtros_busqueda_ia
  FOR SELECT USING (true);

CREATE POLICY "admin_all" ON filtros_busqueda_ia
  FOR ALL USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_admin = true)
  );

-- Insertar filtros base
INSERT INTO filtros_busqueda_ia (nombre, tipo, orden) VALUES
  ('Precio', 'rango', 1),
  ('Año de fabricación', 'rango', 2),
  ('Kilómetros', 'rango', 3),
  ('Marca', 'texto', 4),
  ('Permuta', 'boolean', 5),
  ('Moneda', 'moneda', 6);
