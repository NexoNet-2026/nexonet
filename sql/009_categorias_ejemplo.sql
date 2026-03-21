-- ═══════════════════════════════════════════════════
-- CATEGORÍAS DE EJEMPLO para Servicios, Trabajo, Empresa
-- ═══════════════════════════════════════════════════

-- SERVICIOS
INSERT INTO servicio_rubros (nombre, orden) VALUES
('Construcción y Reformas', 1), ('Hogar y Mantenimiento', 2),
('Tecnología', 3), ('Salud y Bienestar', 4),
('Educación', 5), ('Transporte', 6), ('Gastronomía', 7)
ON CONFLICT DO NOTHING;

INSERT INTO servicio_subrubros (rubro_id, nombre, orden) VALUES
((SELECT id FROM servicio_rubros WHERE nombre='Construcción y Reformas'), 'Plomería', 1),
((SELECT id FROM servicio_rubros WHERE nombre='Construcción y Reformas'), 'Electricistas', 2),
((SELECT id FROM servicio_rubros WHERE nombre='Construcción y Reformas'), 'Albañilería', 3),
((SELECT id FROM servicio_rubros WHERE nombre='Construcción y Reformas'), 'Pintura', 4),
((SELECT id FROM servicio_rubros WHERE nombre='Construcción y Reformas'), 'Jardinería', 5),
((SELECT id FROM servicio_rubros WHERE nombre='Hogar y Mantenimiento'), 'Limpieza', 1),
((SELECT id FROM servicio_rubros WHERE nombre='Hogar y Mantenimiento'), 'Mudanzas', 2),
((SELECT id FROM servicio_rubros WHERE nombre='Hogar y Mantenimiento'), 'Cerrajería', 3),
((SELECT id FROM servicio_rubros WHERE nombre='Hogar y Mantenimiento'), 'Domiciliarios', 4),
((SELECT id FROM servicio_rubros WHERE nombre='Tecnología'), 'Reparación PC', 1),
((SELECT id FROM servicio_rubros WHERE nombre='Tecnología'), 'Diseño web', 2),
((SELECT id FROM servicio_rubros WHERE nombre='Tecnología'), 'Redes', 3)
ON CONFLICT DO NOTHING;

-- TRABAJO
INSERT INTO trabajo_rubros (nombre, orden) VALUES
('Industrial', 1), ('Servicios', 2), ('Comercio', 3),
('Tecnología', 4), ('Salud', 5), ('Educación', 6)
ON CONFLICT DO NOTHING;

INSERT INTO trabajo_subrubros (rubro_id, nombre, orden) VALUES
((SELECT id FROM trabajo_rubros WHERE nombre='Industrial'), 'Operarios', 1),
((SELECT id FROM trabajo_rubros WHERE nombre='Industrial'), 'Técnicos', 2),
((SELECT id FROM trabajo_rubros WHERE nombre='Industrial'), 'Seguridad e Higiene', 3),
((SELECT id FROM trabajo_rubros WHERE nombre='Servicios'), 'Domiciliarios', 1),
((SELECT id FROM trabajo_rubros WHERE nombre='Servicios'), 'Gastronomía', 2),
((SELECT id FROM trabajo_rubros WHERE nombre='Servicios'), 'Limpieza', 3),
((SELECT id FROM trabajo_rubros WHERE nombre='Comercio'), 'Vendedores', 1),
((SELECT id FROM trabajo_rubros WHERE nombre='Comercio'), 'Administrativos', 2),
((SELECT id FROM trabajo_rubros WHERE nombre='Tecnología'), 'Programadores', 1),
((SELECT id FROM trabajo_rubros WHERE nombre='Tecnología'), 'Diseñadores', 2)
ON CONFLICT DO NOTHING;

-- EMPRESA
INSERT INTO empresa_rubros (nombre, orden) VALUES
('Comercio', 1), ('Industria', 2), ('Gastronomía', 3),
('Salud', 4), ('Tecnología', 5), ('Educación', 6), ('Servicios', 7)
ON CONFLICT DO NOTHING;

INSERT INTO empresa_subrubros (rubro_id, nombre, orden) VALUES
((SELECT id FROM empresa_rubros WHERE nombre='Comercio'), 'Ferretería', 1),
((SELECT id FROM empresa_rubros WHERE nombre='Comercio'), 'Indumentaria', 2),
((SELECT id FROM empresa_rubros WHERE nombre='Comercio'), 'Supermercado', 3),
((SELECT id FROM empresa_rubros WHERE nombre='Gastronomía'), 'Restaurante', 1),
((SELECT id FROM empresa_rubros WHERE nombre='Gastronomía'), 'Delivery', 2),
((SELECT id FROM empresa_rubros WHERE nombre='Gastronomía'), 'Bar', 3),
((SELECT id FROM empresa_rubros WHERE nombre='Tecnología'), 'Software', 1),
((SELECT id FROM empresa_rubros WHERE nombre='Tecnología'), 'Hardware', 2),
((SELECT id FROM empresa_rubros WHERE nombre='Salud'), 'Clínica', 1),
((SELECT id FROM empresa_rubros WHERE nombre='Salud'), 'Farmacia', 2)
ON CONFLICT DO NOTHING;
