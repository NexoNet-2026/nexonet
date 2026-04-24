-- Habilita RLS en las 6 tablas si no está habilitado
ALTER TABLE empresa_rubros     ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresa_subrubros  ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicio_rubros    ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicio_subrubros ENABLE ROW LEVEL SECURITY;
ALTER TABLE trabajo_rubros     ENABLE ROW LEVEL SECURITY;
ALTER TABLE trabajo_subrubros  ENABLE ROW LEVEL SECURITY;

-- Policies de lectura pública (por si no existen)
DROP POLICY IF EXISTS "read_empresa_rubros"     ON empresa_rubros;
DROP POLICY IF EXISTS "read_empresa_subrubros"  ON empresa_subrubros;
DROP POLICY IF EXISTS "read_servicio_rubros"    ON servicio_rubros;
DROP POLICY IF EXISTS "read_servicio_subrubros" ON servicio_subrubros;
DROP POLICY IF EXISTS "read_trabajo_rubros"     ON trabajo_rubros;
DROP POLICY IF EXISTS "read_trabajo_subrubros"  ON trabajo_subrubros;

CREATE POLICY "read_empresa_rubros"     ON empresa_rubros     FOR SELECT USING (true);
CREATE POLICY "read_empresa_subrubros"  ON empresa_subrubros  FOR SELECT USING (true);
CREATE POLICY "read_servicio_rubros"    ON servicio_rubros    FOR SELECT USING (true);
CREATE POLICY "read_servicio_subrubros" ON servicio_subrubros FOR SELECT USING (true);
CREATE POLICY "read_trabajo_rubros"     ON trabajo_rubros     FOR SELECT USING (true);
CREATE POLICY "read_trabajo_subrubros"  ON trabajo_subrubros  FOR SELECT USING (true);

-- Policies de escritura solo para admin
DROP POLICY IF EXISTS "admin_write_empresa_rubros"     ON empresa_rubros;
DROP POLICY IF EXISTS "admin_write_empresa_subrubros"  ON empresa_subrubros;
DROP POLICY IF EXISTS "admin_write_servicio_rubros"    ON servicio_rubros;
DROP POLICY IF EXISTS "admin_write_servicio_subrubros" ON servicio_subrubros;
DROP POLICY IF EXISTS "admin_write_trabajo_rubros"     ON trabajo_rubros;
DROP POLICY IF EXISTS "admin_write_trabajo_subrubros" ON trabajo_subrubros;

CREATE POLICY "admin_write_empresa_rubros" ON empresa_rubros
  FOR ALL TO authenticated
  USING     (EXISTS (SELECT 1 FROM usuarios WHERE usuarios.id = auth.uid() AND usuarios.es_admin_sistema = true))
  WITH CHECK (EXISTS (SELECT 1 FROM usuarios WHERE usuarios.id = auth.uid() AND usuarios.es_admin_sistema = true));

CREATE POLICY "admin_write_empresa_subrubros" ON empresa_subrubros
  FOR ALL TO authenticated
  USING     (EXISTS (SELECT 1 FROM usuarios WHERE usuarios.id = auth.uid() AND usuarios.es_admin_sistema = true))
  WITH CHECK (EXISTS (SELECT 1 FROM usuarios WHERE usuarios.id = auth.uid() AND usuarios.es_admin_sistema = true));

CREATE POLICY "admin_write_servicio_rubros" ON servicio_rubros
  FOR ALL TO authenticated
  USING     (EXISTS (SELECT 1 FROM usuarios WHERE usuarios.id = auth.uid() AND usuarios.es_admin_sistema = true))
  WITH CHECK (EXISTS (SELECT 1 FROM usuarios WHERE usuarios.id = auth.uid() AND usuarios.es_admin_sistema = true));

CREATE POLICY "admin_write_servicio_subrubros" ON servicio_subrubros
  FOR ALL TO authenticated
  USING     (EXISTS (SELECT 1 FROM usuarios WHERE usuarios.id = auth.uid() AND usuarios.es_admin_sistema = true))
  WITH CHECK (EXISTS (SELECT 1 FROM usuarios WHERE usuarios.id = auth.uid() AND usuarios.es_admin_sistema = true));

CREATE POLICY "admin_write_trabajo_rubros" ON trabajo_rubros
  FOR ALL TO authenticated
  USING     (EXISTS (SELECT 1 FROM usuarios WHERE usuarios.id = auth.uid() AND usuarios.es_admin_sistema = true))
  WITH CHECK (EXISTS (SELECT 1 FROM usuarios WHERE usuarios.id = auth.uid() AND usuarios.es_admin_sistema = true));

CREATE POLICY "admin_write_trabajo_subrubros" ON trabajo_subrubros
  FOR ALL TO authenticated
  USING     (EXISTS (SELECT 1 FROM usuarios WHERE usuarios.id = auth.uid() AND usuarios.es_admin_sistema = true))
  WITH CHECK (EXISTS (SELECT 1 FROM usuarios WHERE usuarios.id = auth.uid() AND usuarios.es_admin_sistema = true));
