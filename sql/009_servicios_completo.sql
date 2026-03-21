-- ═══════════════════════════════════════════════════
-- CATÁLOGO COMPLETO DE SERVICIOS
-- ═══════════════════════════════════════════════════

-- Limpiar datos de ejemplo anteriores
DELETE FROM servicio_subrubros;
DELETE FROM servicio_rubros;

-- Insertar rubros
INSERT INTO servicio_rubros (nombre, orden) VALUES
('Hogar y Mantenimiento', 1),
('Mudanzas y Logística', 2),
('Automotor', 3),
('Tecnología', 4),
('Oficios y Servicios Personales', 5),
('Educación y Clases', 6),
('Eventos', 7),
('Mascotas', 8),
('Salud y Bienestar', 9),
('Servicios para Empresas', 10);

-- Hogar y Mantenimiento
INSERT INTO servicio_subrubros (rubro_id, nombre, orden) SELECT id, unnest(ARRAY[
'Plomería','Electricidad domiciliaria','Gasista matriculado','Albañilería',
'Pintura','Herrería','Soldadura a domicilio','Durlock / construcción en seco',
'Techistas e impermeabilización','Colocación de pisos y revestimientos',
'Carpintería','Cerrajería','Destapaciones','Jardinería y parquización',
'Pileteros / mantenimiento de piscinas','Limpieza de hogares',
'Limpieza de vidrios','Desinfección / control de plagas',
'Mantenimiento integral para consorcios'
]), generate_series(1,19) FROM servicio_rubros WHERE nombre='Hogar y Mantenimiento';

-- Mudanzas y Logística
INSERT INTO servicio_subrubros (rubro_id, nombre, orden) SELECT id, unnest(ARRAY[
'Fletes','Mini fletes','Mudanzas','Peones para carga y descarga',
'Mensajería','Cadetería','Traslado de muebles y electrodomésticos',
'Servicios de depósito o guardamuebles'
]), generate_series(1,8) FROM servicio_rubros WHERE nombre='Mudanzas y Logística';

-- Automotor
INSERT INTO servicio_subrubros (rubro_id, nombre, orden) SELECT id, unnest(ARRAY[
'Mecánica ligera','Electricidad del automotor','Auxilio / arranque de batería',
'Gomería móvil','Lavado de autos','Polarizado','Audio y alarmas',
'Escaneo electrónico','Chapa y pintura','Traslado de vehículos'
]), generate_series(1,10) FROM servicio_rubros WHERE nombre='Automotor';

-- Tecnología
INSERT INTO servicio_subrubros (rubro_id, nombre, orden) SELECT id, unnest(ARRAY[
'Reparación de PC y notebooks','Soporte técnico a domicilio',
'Instalación de cámaras','Redes y WiFi','Armado de páginas web',
'Diseño gráfico','Community manager','Edición de video',
'Reparación de celulares','Instalación de software'
]), generate_series(1,10) FROM servicio_rubros WHERE nombre='Tecnología';

-- Oficios y Servicios Personales
INSERT INTO servicio_subrubros (rubro_id, nombre, orden) SELECT id, unnest(ARRAY[
'Costurera / arreglos de ropa','Modista','Zapatero / reparación de calzado',
'Barbería a domicilio','Peluquería a domicilio','Maquillaje',
'Manicuría','Masajes','Personal trainer','Fotografía'
]), generate_series(1,10) FROM servicio_rubros WHERE nombre='Oficios y Servicios Personales';

-- Educación y Clases
INSERT INTO servicio_subrubros (rubro_id, nombre, orden) SELECT id, unnest(ARRAY[
'Apoyo escolar','Clases particulares','Inglés','Informática',
'Música','Dibujo / arte','Preparación para exámenes',
'Capacitaciones técnicas','Talleres online','Tutorías universitarias'
]), generate_series(1,10) FROM servicio_rubros WHERE nombre='Educación y Clases';

-- Eventos
INSERT INTO servicio_subrubros (rubro_id, nombre, orden) SELECT id, unnest(ARRAY[
'DJ','Sonido e iluminación','Catering','Mozos','Barman',
'Decoración','Animación infantil','Fotografía para eventos',
'Alquiler de inflables','Alquiler de mobiliario'
]), generate_series(1,10) FROM servicio_rubros WHERE nombre='Eventos';

-- Mascotas
INSERT INTO servicio_subrubros (rubro_id, nombre, orden) SELECT id, unnest(ARRAY[
'Paseador de perros','Guardería','Baño y peluquería canina',
'Adiestramiento','Traslado de mascotas','Cuidado a domicilio','Pet sitter'
]), generate_series(1,7) FROM servicio_rubros WHERE nombre='Mascotas';

-- Salud y Bienestar
INSERT INTO servicio_subrubros (rubro_id, nombre, orden) SELECT id, unnest(ARRAY[
'Enfermería domiciliaria','Acompañante terapéutico','Kinesiología',
'Cuidador de adultos mayores','Nutrición','Psicología online o presencial',
'Fonoaudiología'
]), generate_series(1,7) FROM servicio_rubros WHERE nombre='Salud y Bienestar';

-- Servicios para Empresas
INSERT INTO servicio_subrubros (rubro_id, nombre, orden) SELECT id, unnest(ARRAY[
'Mantenimiento edilicio','Limpieza de oficinas','Seguridad e higiene',
'Técnico electromecánico','Soldadura industrial','Refrigeración comercial',
'Servicios de RRHH','Contabilidad','Asesoría legal','Facility management'
]), generate_series(1,10) FROM servicio_rubros WHERE nombre='Servicios para Empresas';
