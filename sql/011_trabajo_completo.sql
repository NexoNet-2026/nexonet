-- ═══════════════════════════════════════════════════
-- CATÁLOGO COMPLETO DE TRABAJO
-- ═══════════════════════════════════════════════════

DELETE FROM trabajo_subrubros;
DELETE FROM trabajo_rubros;

INSERT INTO trabajo_rubros (nombre, orden) VALUES
('Oficios y Mantenimiento', 1),
('Administración y Comercios', 2),
('Industria y Producción', 3),
('Profesionales y Técnicos', 4),
('Salud y Cuidado', 5),
('Gastronomía y Eventos', 6),
('Servicios Personales', 7),
('Choferes y Transporte', 8);

INSERT INTO trabajo_subrubros (rubro_id, nombre, orden) SELECT id, unnest(ARRAY[
'Albañil','Pintor','Electricista','Plomero','Gasista','Herrero',
'Soldador','Carpintero','Techista','Jardinero','Personal de limpieza','Mantenimiento general'
]), generate_series(1,12) FROM trabajo_rubros WHERE nombre='Oficios y Mantenimiento';

INSERT INTO trabajo_subrubros (rubro_id, nombre, orden) SELECT id, unnest(ARRAY[
'Administrativo/a','Cajero/a','Repositor/a','Vendedor/a','Atención al cliente',
'Recepcionista','Compras','Facturación','Logística','Cadetería'
]), generate_series(1,10) FROM trabajo_rubros WHERE nombre='Administración y Comercios';

INSERT INTO trabajo_subrubros (rubro_id, nombre, orden) SELECT id, unnest(ARRAY[
'Operario/a de producción','Operario/a de depósito','Clarkista','Maquinista',
'Técnico de mantenimiento','Soldador industrial','Montador','Supervisor','Encargado de planta'
]), generate_series(1,9) FROM trabajo_rubros WHERE nombre='Industria y Producción';

INSERT INTO trabajo_subrubros (rubro_id, nombre, orden) SELECT id, unnest(ARRAY[
'Contador/a','Abogado/a','Arquitecto/a','Diseñador/a gráfico','Programador/a',
'Técnico electrónico','Técnico electromecánico','Técnico en refrigeración','Seguridad e higiene'
]), generate_series(1,9) FROM trabajo_rubros WHERE nombre='Profesionales y Técnicos';

INSERT INTO trabajo_subrubros (rubro_id, nombre, orden) SELECT id, unnest(ARRAY[
'Enfermero/a','Cuidador/a domiciliario','Acompañante terapéutico','Kinesiólogo/a',
'Psicólogo/a','Niñera','Cuidado de adultos mayores'
]), generate_series(1,7) FROM trabajo_rubros WHERE nombre='Salud y Cuidado';

INSERT INTO trabajo_subrubros (rubro_id, nombre, orden) SELECT id, unnest(ARRAY[
'Cocinero/a','Ayudante de cocina','Mozo/a','Bartender','Parrillero/a','Personal para eventos'
]), generate_series(1,6) FROM trabajo_rubros WHERE nombre='Gastronomía y Eventos';

INSERT INTO trabajo_subrubros (rubro_id, nombre, orden) SELECT id, unnest(ARRAY[
'Peluquero/a','Barbero/a','Manicura','Maquilladora','Masajista','Entrenador/a personal'
]), generate_series(1,6) FROM trabajo_rubros WHERE nombre='Servicios Personales';

INSERT INTO trabajo_subrubros (rubro_id, nombre, orden) SELECT id, unnest(ARRAY[
'Chofer particular','Repartidor','Fletero','Chofer profesional','Mensajería'
]), generate_series(1,5) FROM trabajo_rubros WHERE nombre='Choferes y Transporte';
