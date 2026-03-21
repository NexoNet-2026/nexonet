-- ═══════════════════════════════════════════════════
-- FIX: RLS policies para rubros/subrubros de entidades
-- Sin policy de SELECT, Supabase devuelve array vacío con anon key
-- ═══════════════════════════════════════════════════

-- SERVICIO
ALTER TABLE servicio_rubros ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicio_subrubros ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "servicio_rubros_public" ON servicio_rubros FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "servicio_subrubros_public" ON servicio_subrubros FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- EMPRESA
ALTER TABLE empresa_rubros ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresa_subrubros ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "empresa_rubros_public" ON empresa_rubros FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "empresa_subrubros_public" ON empresa_subrubros FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- TRABAJO
ALTER TABLE trabajo_rubros ENABLE ROW LEVEL SECURITY;
ALTER TABLE trabajo_subrubros ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "trabajo_rubros_public" ON trabajo_rubros FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "trabajo_subrubros_public" ON trabajo_subrubros FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- FILTROS (por si se consultan desde el frontend)
ALTER TABLE servicio_filtros ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresa_filtros ENABLE ROW LEVEL SECURITY;
ALTER TABLE trabajo_filtros ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "servicio_filtros_public" ON servicio_filtros FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "empresa_filtros_public" ON empresa_filtros FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "trabajo_filtros_public" ON trabajo_filtros FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
