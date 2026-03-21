-- ═══════════════════════════════════════════════════
-- CATÁLOGO COMPLETO DE EMPRESAS
-- ═══════════════════════════════════════════════════

DELETE FROM empresa_subrubros;
DELETE FROM empresa_rubros;

INSERT INTO empresa_rubros (nombre, orden) VALUES
('Hogar y Construcción', 1),('Automotor', 2),('Consumo Masivo', 3),
('Finanzas y Servicios', 4),('Industria', 5),('Comercios de Barrio', 6),
('Textil e Indumentaria', 7),('Gastronomía', 8),('Salud y Bienestar', 9),
('Tecnología y Comunicación', 10);

INSERT INTO empresa_subrubros (rubro_id, nombre, orden) SELECT id, unnest(ARRAY[
'Inmobiliarias','Corralones','Ferreterías','Pinturerías','Sanitarios',
'Electricidad','Aberturas','Constructoras','Arquitectura y diseño','Mantenimiento integral'
]), generate_series(1,10) FROM empresa_rubros WHERE nombre='Hogar y Construcción';

INSERT INTO empresa_subrubros (rubro_id, nombre, orden) SELECT id, unnest(ARRAY[
'Concesionarias','Agencias de usados','Talleres mecánicos','Gomerías','Lubricentros',
'Repuestos','Baterías','Chapa y pintura','Lavaderos','Auxilio y grúas'
]), generate_series(1,10) FROM empresa_rubros WHERE nombre='Automotor';

INSERT INTO empresa_subrubros (rubro_id, nombre, orden) SELECT id, unnest(ARRAY[
'Supermercados','Autoservicios','Mayoristas','Distribuidoras','Kioscos',
'Vinotecas','Dietéticas','Carnicerías','Verdulerías','Panaderías'
]), generate_series(1,10) FROM empresa_rubros WHERE nombre='Consumo Masivo';

INSERT INTO empresa_subrubros (rubro_id, nombre, orden) SELECT id, unnest(ARRAY[
'Aseguradoras','Estudios contables','Estudios jurídicos','Inmobiliarias financieras',
'Consultoras','RRHH','Seguridad e higiene','Servicios de cobranza'
]), generate_series(1,8) FROM empresa_rubros WHERE nombre='Finanzas y Servicios';

INSERT INTO empresa_subrubros (rubro_id, nombre, orden) SELECT id, unnest(ARRAY[
'Metalúrgicas','Industrias plásticas','Industrias alimenticias','Industrias químicas',
'Logística industrial','Mantenimiento industrial','Automatización','Electromecánica',
'Calderería','Herrería industrial'
]), generate_series(1,10) FROM empresa_rubros WHERE nombre='Industria';

INSERT INTO empresa_subrubros (rubro_id, nombre, orden) SELECT id, unnest(ARRAY[
'Librerías','Farmacias','Perfumerías','Veterinarias','Pet shops',
'Regalerías','Jugueterías','Casas de celulares','Casas de electrodomésticos','Bazares'
]), generate_series(1,10) FROM empresa_rubros WHERE nombre='Comercios de Barrio';

INSERT INTO empresa_subrubros (rubro_id, nombre, orden) SELECT id, unnest(ARRAY[
'Locales de ropa','Mayoristas de indumentaria','Uniformes','Ropa de trabajo',
'Talleres textiles','Mercerías','Calzado','Marroquinería','Accesorios','Bordado y estampado'
]), generate_series(1,10) FROM empresa_rubros WHERE nombre='Textil e Indumentaria';

INSERT INTO empresa_subrubros (rubro_id, nombre, orden) SELECT id, unnest(ARRAY[
'Restaurantes','Bares','Cafeterías','Rotiserías','Heladerías',
'Pastelerías','Catering','Casas de comida','Food trucks'
]), generate_series(1,9) FROM empresa_rubros WHERE nombre='Gastronomía';

INSERT INTO empresa_subrubros (rubro_id, nombre, orden) SELECT id, unnest(ARRAY[
'Clínicas','Consultorios','Odontología','Kinesiología','Psicología',
'Ópticas','Ortopedias','Gimnasios','Centros estéticos'
]), generate_series(1,9) FROM empresa_rubros WHERE nombre='Salud y Bienestar';

INSERT INTO empresa_subrubros (rubro_id, nombre, orden) SELECT id, unnest(ARRAY[
'Casas de computación','Reparación técnica','Cámaras y alarmas','Internet y redes',
'Diseño web','Marketing digital','Imprentas','Cartelería'
]), generate_series(1,8) FROM empresa_rubros WHERE nombre='Tecnología y Comunicación';
