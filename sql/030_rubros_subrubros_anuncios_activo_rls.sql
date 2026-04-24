-- Columna activo + comentarios
ALTER TABLE rubros    ADD COLUMN activo boolean NOT NULL DEFAULT true;
ALTER TABLE subrubros ADD COLUMN activo boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN rubros.activo    IS 'Si false = oculto: no aparece en selects públicos de creación';
COMMENT ON COLUMN subrubros.activo IS 'Si false = oculto: no aparece en selects públicos de creación';

-- RLS
ALTER TABLE rubros    ENABLE ROW LEVEL SECURITY;
ALTER TABLE subrubros ENABLE ROW LEVEL SECURITY;

-- Policies de lectura pública
DROP POLICY IF EXISTS "read_rubros"    ON rubros;
DROP POLICY IF EXISTS "read_subrubros" ON subrubros;

CREATE POLICY "read_rubros"    ON rubros    FOR SELECT USING (true);
CREATE POLICY "read_subrubros" ON subrubros FOR SELECT USING (true);

-- Policies de escritura admin (es_admin_sistema, mismo patrón que 029)
DROP POLICY IF EXISTS "admin_write_rubros"    ON rubros;
DROP POLICY IF EXISTS "admin_write_subrubros" ON subrubros;

CREATE POLICY "admin_write_rubros" ON rubros
  FOR ALL TO authenticated
  USING     (EXISTS (SELECT 1 FROM usuarios WHERE usuarios.id = auth.uid() AND usuarios.es_admin_sistema = true))
  WITH CHECK (EXISTS (SELECT 1 FROM usuarios WHERE usuarios.id = auth.uid() AND usuarios.es_admin_sistema = true));

CREATE POLICY "admin_write_subrubros" ON subrubros
  FOR ALL TO authenticated
  USING     (EXISTS (SELECT 1 FROM usuarios WHERE usuarios.id = auth.uid() AND usuarios.es_admin_sistema = true))
  WITH CHECK (EXISTS (SELECT 1 FROM usuarios WHERE usuarios.id = auth.uid() AND usuarios.es_admin_sistema = true));
