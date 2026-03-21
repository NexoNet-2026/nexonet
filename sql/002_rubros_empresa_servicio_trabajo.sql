-- ═══════════════════════════════════════════════════
-- RUBROS/SUBRUBROS/FILTROS para Empresas, Servicios, Trabajo
-- ═══════════════════════════════════════════════════

-- EMPRESAS
CREATE TABLE IF NOT EXISTS empresa_rubros (id SERIAL PRIMARY KEY, nombre VARCHAR(100) NOT NULL, orden INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS empresa_subrubros (id SERIAL PRIMARY KEY, rubro_id INTEGER REFERENCES empresa_rubros(id) ON DELETE CASCADE, nombre VARCHAR(100) NOT NULL, orden INTEGER DEFAULT 0, sliders_sugeridos JSONB);
CREATE TABLE IF NOT EXISTS empresa_filtros (id SERIAL PRIMARY KEY, subrubro_id INTEGER REFERENCES empresa_subrubros(id) ON DELETE CASCADE, nombre VARCHAR(50) NOT NULL, tipo VARCHAR(20) DEFAULT 'rango', opciones JSONB, orden INTEGER DEFAULT 0);

-- SERVICIOS
CREATE TABLE IF NOT EXISTS servicio_rubros (id SERIAL PRIMARY KEY, nombre VARCHAR(100) NOT NULL, orden INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS servicio_subrubros (id SERIAL PRIMARY KEY, rubro_id INTEGER REFERENCES servicio_rubros(id) ON DELETE CASCADE, nombre VARCHAR(100) NOT NULL, orden INTEGER DEFAULT 0, sliders_sugeridos JSONB);
CREATE TABLE IF NOT EXISTS servicio_filtros (id SERIAL PRIMARY KEY, subrubro_id INTEGER REFERENCES servicio_subrubros(id) ON DELETE CASCADE, nombre VARCHAR(50) NOT NULL, tipo VARCHAR(20) DEFAULT 'lista', opciones JSONB, orden INTEGER DEFAULT 0);

-- TRABAJO
CREATE TABLE IF NOT EXISTS trabajo_rubros (id SERIAL PRIMARY KEY, nombre VARCHAR(100) NOT NULL, orden INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS trabajo_subrubros (id SERIAL PRIMARY KEY, rubro_id INTEGER REFERENCES trabajo_rubros(id) ON DELETE CASCADE, nombre VARCHAR(100) NOT NULL, orden INTEGER DEFAULT 0, sliders_sugeridos JSONB);
CREATE TABLE IF NOT EXISTS trabajo_filtros (id SERIAL PRIMARY KEY, subrubro_id INTEGER REFERENCES trabajo_subrubros(id) ON DELETE CASCADE, nombre VARCHAR(50) NOT NULL, tipo VARCHAR(20) DEFAULT 'lista', opciones JSONB, orden INTEGER DEFAULT 0);

-- RLS
ALTER TABLE empresa_rubros ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresa_subrubros ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresa_filtros ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicio_rubros ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicio_subrubros ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicio_filtros ENABLE ROW LEVEL SECURITY;
ALTER TABLE trabajo_rubros ENABLE ROW LEVEL SECURITY;
ALTER TABLE trabajo_subrubros ENABLE ROW LEVEL SECURITY;
ALTER TABLE trabajo_filtros ENABLE ROW LEVEL SECURITY;

-- Lectura pública para todos
CREATE POLICY "empresa_rubros_select" ON empresa_rubros FOR SELECT USING (true);
CREATE POLICY "empresa_subrubros_select" ON empresa_subrubros FOR SELECT USING (true);
CREATE POLICY "empresa_filtros_select" ON empresa_filtros FOR SELECT USING (true);
CREATE POLICY "servicio_rubros_select" ON servicio_rubros FOR SELECT USING (true);
CREATE POLICY "servicio_subrubros_select" ON servicio_subrubros FOR SELECT USING (true);
CREATE POLICY "servicio_filtros_select" ON servicio_filtros FOR SELECT USING (true);
CREATE POLICY "trabajo_rubros_select" ON trabajo_rubros FOR SELECT USING (true);
CREATE POLICY "trabajo_subrubros_select" ON trabajo_subrubros FOR SELECT USING (true);
CREATE POLICY "trabajo_filtros_select" ON trabajo_filtros FOR SELECT USING (true);

-- Escritura solo admin (service_role bypasses RLS, así que no necesitamos policy de INSERT/UPDATE/DELETE)
