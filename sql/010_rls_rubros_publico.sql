-- ═══════════════════════════════════════════════════
-- RLS: lectura pública para rubros/subrubros de entidades
-- Ejecutar en Supabase SQL Editor
-- ═══════════════════════════════════════════════════

ALTER TABLE servicio_rubros ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "servicio_rubros_select" ON servicio_rubros;
DROP POLICY IF EXISTS "servicio_rubros_public" ON servicio_rubros;
CREATE POLICY "pub_select" ON servicio_rubros FOR SELECT USING (true);

ALTER TABLE servicio_subrubros ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "servicio_subrubros_select" ON servicio_subrubros;
DROP POLICY IF EXISTS "servicio_subrubros_public" ON servicio_subrubros;
CREATE POLICY "pub_select" ON servicio_subrubros FOR SELECT USING (true);

ALTER TABLE trabajo_rubros ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "trabajo_rubros_select" ON trabajo_rubros;
DROP POLICY IF EXISTS "trabajo_rubros_public" ON trabajo_rubros;
CREATE POLICY "pub_select" ON trabajo_rubros FOR SELECT USING (true);

ALTER TABLE trabajo_subrubros ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "trabajo_subrubros_select" ON trabajo_subrubros;
DROP POLICY IF EXISTS "trabajo_subrubros_public" ON trabajo_subrubros;
CREATE POLICY "pub_select" ON trabajo_subrubros FOR SELECT USING (true);

ALTER TABLE empresa_rubros ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "empresa_rubros_select" ON empresa_rubros;
DROP POLICY IF EXISTS "empresa_rubros_public" ON empresa_rubros;
CREATE POLICY "pub_select" ON empresa_rubros FOR SELECT USING (true);

ALTER TABLE empresa_subrubros ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "empresa_subrubros_select" ON empresa_subrubros;
DROP POLICY IF EXISTS "empresa_subrubros_public" ON empresa_subrubros;
CREATE POLICY "pub_select" ON empresa_subrubros FOR SELECT USING (true);

ALTER TABLE servicio_filtros ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "servicio_filtros_select" ON servicio_filtros;
DROP POLICY IF EXISTS "servicio_filtros_public" ON servicio_filtros;
CREATE POLICY "pub_select" ON servicio_filtros FOR SELECT USING (true);

ALTER TABLE empresa_filtros ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "empresa_filtros_select" ON empresa_filtros;
DROP POLICY IF EXISTS "empresa_filtros_public" ON empresa_filtros;
CREATE POLICY "pub_select" ON empresa_filtros FOR SELECT USING (true);

ALTER TABLE trabajo_filtros ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "trabajo_filtros_select" ON trabajo_filtros;
DROP POLICY IF EXISTS "trabajo_filtros_public" ON trabajo_filtros;
CREATE POLICY "pub_select" ON trabajo_filtros FOR SELECT USING (true);

-- GRUPO CATEGORÍAS
ALTER TABLE grupo_categorias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "grupo_categorias_pub" ON grupo_categorias;
CREATE POLICY "pub_select" ON grupo_categorias FOR SELECT USING (true);

ALTER TABLE grupo_subcategorias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "grupo_subcategorias_pub" ON grupo_subcategorias;
CREATE POLICY "pub_select" ON grupo_subcategorias FOR SELECT USING (true);
