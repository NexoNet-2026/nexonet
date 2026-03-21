-- ═══════════════════════════════════════════════════
-- CATÁLOGO COMPLETO DE CATEGORÍAS DE GRUPOS
-- ═══════════════════════════════════════════════════

DELETE FROM grupo_subcategorias;
DELETE FROM grupo_categorias;

INSERT INTO grupo_categorias (nombre, emoji, orden, activo) VALUES
('Por Zona', '📍', 1, true),
('Por Oficio o Rubro', '🔧', 2, true),
('Por Intereses', '🎨', 3, true),
('Deporte y Actividad Física', '⚽', 4, true),
('Estudio y Formación', '📚', 5, true),
('Bienestar y Espiritualidad', '🧘', 6, true),
('Negocios y Networking', '💼', 7, true);

INSERT INTO grupo_subcategorias (categoria_id, nombre, emoji, orden, activo)
SELECT id, unnest(ARRAY['Vecinos de barrio','Vecinos de edificio','Consorcios','Barrios cerrados','Comercios de una zona','Emprendedores de una ciudad','Vecinos de una localidad','Comunidad de una cuadra o sector']),
'📍', generate_series(1,8), true FROM grupo_categorias WHERE nombre='Por Zona';

INSERT INTO grupo_subcategorias (categoria_id, nombre, emoji, orden, activo)
SELECT id, unnest(ARRAY['Camioneros','Fleteros','Electricistas','Plomeros','Herreros','Técnicos','Mantenimiento industrial','Impresión 3D','Carpintería','Construcción','Diseño gráfico','Programación','Textil','Moda','Gastronomía']),
'🔧', generate_series(1,15), true FROM grupo_categorias WHERE nombre='Por Oficio o Rubro';

INSERT INTO grupo_subcategorias (categoria_id, nombre, emoji, orden, activo)
SELECT id, unnest(ARRAY['Arte','Diseño','Moda','Fotografía','Música','Cine','Magia','Juegos','Lectura','Anime','Tecnología','Energía alternativa','Experimentos','Huerta','Mascotas']),
'🎨', generate_series(1,15), true FROM grupo_categorias WHERE nombre='Por Intereses';

INSERT INTO grupo_subcategorias (categoria_id, nombre, emoji, orden, activo)
SELECT id, unnest(ARRAY['Runners','Gimnasios','Pádel','Fútbol','Ciclismo','Trekking','Crossfit','Yoga','Calistenia','Natación']),
'⚽', generate_series(1,10), true FROM grupo_categorias WHERE nombre='Deporte y Actividad Física';

INSERT INTO grupo_subcategorias (categoria_id, nombre, emoji, orden, activo)
SELECT id, unnest(ARRAY['Estudio','Cursos','Idiomas','Programación','Apoyo escolar','Ingreso universitario','Oficios','Talleres','Capacitación laboral']),
'📚', generate_series(1,9), true FROM grupo_categorias WHERE nombre='Estudio y Formación';

INSERT INTO grupo_subcategorias (categoria_id, nombre, emoji, orden, activo)
SELECT id, unnest(ARRAY['Reiki','Masajes','Terapias alternativas','Meditación','Espiritualidad','Esoterismo','Astrología','Tarot','Bienestar holístico']),
'🧘', generate_series(1,9), true FROM grupo_categorias WHERE nombre='Bienestar y Espiritualidad';

INSERT INTO grupo_subcategorias (categoria_id, nombre, emoji, orden, activo)
SELECT id, unnest(ARRAY['Emprendedores','Pymes','Proveedores','Ventas','Franquicias','Inversores','Profesionales independientes','Networking local','Búsqueda de socios']),
'💼', generate_series(1,9), true FROM grupo_categorias WHERE nombre='Negocios y Networking';
