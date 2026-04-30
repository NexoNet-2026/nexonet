CREATE TABLE IF NOT EXISTS public._huerfanos_storage_snapshot (
  id bigint NOT NULL DEFAULT nextval('_huerfanos_storage_snapshot_id_seq'::regclass),
  bucket_id text NOT NULL,
  name_original text NOT NULL,
  name_cuarentena text NOT NULL,
  bytes bigint,
  fecha_snapshot timestamptz DEFAULT now(),
  fecha_subida_original timestamptz,
  estado text DEFAULT 'cuarentena'::text,
  ultima_operacion timestamptz DEFAULT now(),
  operacion_log jsonb DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS public.anuncio_visitas (
  id bigint NOT NULL DEFAULT nextval('anuncio_visitas_id_seq'::regclass),
  anuncio_id integer NOT NULL,
  visitante_id uuid NOT NULL,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.anuncios (
  id integer NOT NULL DEFAULT nextval('anuncios_id_seq'::regclass),
  usuario_id uuid,
  subrubro_id integer,
  titulo text NOT NULL,
  descripcion text,
  precio numeric,
  moneda text DEFAULT 'ARS'::text,
  ciudad text,
  provincia text,
  imagenes text[],
  destacado boolean DEFAULT false,
  estado text DEFAULT 'activo'::text,
  created_at timestamp DEFAULT now(),
  lat numeric,
  lng numeric,
  flash boolean DEFAULT false,
  bits_flash integer DEFAULT 0,
  bits_posicion integer DEFAULT 0,
  bits_conexion integer DEFAULT 0,
  conexiones integer DEFAULT 0,
  vistas integer DEFAULT 0,
  fuente text DEFAULT 'nexonet'::text,
  envio_gratis boolean DEFAULT false,
  mas_vendido boolean DEFAULT false,
  tienda_oficial boolean DEFAULT false,
  descuento_cantidad boolean DEFAULT false,
  presupuesto_sin_cargo boolean DEFAULT false,
  conexion_habilitada boolean DEFAULT false,
  descuento_porcentaje integer DEFAULT 0,
  links text[] DEFAULT '{}'::text[],
  adjuntos text[],
  link_habilitado boolean DEFAULT false,
  adjunto_habilitado boolean DEFAULT false,
  permuto boolean DEFAULT false,
  renovar_automatico boolean DEFAULT false,
  fecha_vencimiento timestamptz,
  fecha_renovacion timestamptz,
  direccion text,
  whatsapp text,
  link_externo text,
  avatar_url text,
  banner_url text,
  tipo text DEFAULT 'anuncio'::text,
  subtipo text,
  config jsonb,
  notif_whatsapp boolean DEFAULT false,
  filtros jsonb DEFAULT '{}'::jsonb,
  mostrar_en_mapa boolean DEFAULT true,
  limite_conexiones integer DEFAULT 500,
  conexiones_recibidas integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.barrios (
  id integer NOT NULL DEFAULT nextval('barrios_id_seq'::regclass),
  nombre text NOT NULL,
  ciudad_id integer
);

CREATE TABLE IF NOT EXISTS public.bits_promo_descargas (
  id bigint NOT NULL DEFAULT nextval('bits_promo_descargas_id_seq'::regclass),
  usuario_id uuid,
  nexo_id uuid,
  descarga_id uuid,
  bits_recibidos integer NOT NULL,
  comprador_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bot_mensajes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  bot_id uuid,
  usuario_id uuid,
  mensaje text NOT NULL,
  respuesta text,
  leido boolean DEFAULT false,
  respondido boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  respondido_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.busqueda_matches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  busqueda_id uuid,
  usuario_id uuid,
  anuncio_id integer,
  bits_consumidos integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.busquedas_automaticas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  usuario_id uuid,
  titulo text,
  subrubro_id integer,
  precio_min numeric,
  precio_max numeric,
  moneda text DEFAULT 'ARS'::text,
  ciudad text,
  provincia text,
  keywords text,
  activo boolean DEFAULT true,
  notificaciones_recibidas integer DEFAULT 0,
  created_at timestamp DEFAULT now(),
  tipo_nexo text DEFAULT 'anuncio'::text,
  dormitorios integer,
  ambientes integer,
  metros_min numeric,
  metros_max numeric,
  anio_min integer,
  anio_max integer,
  km_min integer,
  km_max integer,
  config jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.ciudades (
  id integer NOT NULL DEFAULT nextval('ciudades_id_seq'::regclass),
  nombre text NOT NULL,
  provincia_id integer
);

CREATE TABLE IF NOT EXISTS public.comisiones_promotor (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  promotor_id uuid,
  origen_id uuid,
  monto_origen numeric NOT NULL,
  monto_comision numeric NOT NULL,
  nivel integer NOT NULL DEFAULT 1,
  concepto text,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conexiones (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  anuncio_id integer,
  usuario_id uuid,
  vendedor_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conexiones_nexo (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nexo_id uuid,
  usuario_id uuid,
  vendedor_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.config (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clave text NOT NULL,
  valor text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.config_app (
  id text NOT NULL DEFAULT 'global'::text,
  usuarios_mult numeric DEFAULT 1,
  usuarios_suma numeric DEFAULT 0,
  activos_mult numeric DEFAULT 1,
  activos_suma numeric DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.config_global (
  clave text NOT NULL,
  valor text NOT NULL,
  descripcion text,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contactos_nexonet (
  id bigint NOT NULL DEFAULT nextval('contactos_nexonet_id_seq'::regclass),
  usuario_id uuid,
  tipo varchar(20) NOT NULL,
  mensaje text NOT NULL,
  estado varchar(20) DEFAULT 'pendiente'::character varying,
  respuesta text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.copyright_claims (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  download_id uuid,
  nexo_slider_item_id uuid,
  claimant_name text NOT NULL,
  claimant_email text NOT NULL,
  description text NOT NULL,
  content_url text,
  status varchar(20) DEFAULT 'pending'::character varying,
  received_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid,
  resolution_notes text
);

CREATE TABLE IF NOT EXISTS public.empresa_filtros (
  id integer NOT NULL DEFAULT nextval('empresa_filtros_id_seq'::regclass),
  subrubro_id integer,
  nombre varchar(50) NOT NULL,
  tipo varchar(20) DEFAULT 'rango'::character varying,
  opciones jsonb,
  orden integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.empresa_pagos (
  id bigint NOT NULL DEFAULT nextval('empresa_pagos_id_seq'::regclass),
  nexo_id uuid,
  usuario_id uuid,
  bits_pagados integer DEFAULT 3000,
  periodo_desde timestamptz,
  periodo_hasta timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.empresa_rubros (
  id integer NOT NULL DEFAULT nextval('empresa_rubros_id_seq'::regclass),
  nombre varchar(100) NOT NULL,
  orden integer DEFAULT 0,
  activo boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.empresa_subrubros (
  id integer NOT NULL DEFAULT nextval('empresa_subrubros_id_seq'::regclass),
  rubro_id integer,
  nombre varchar(100) NOT NULL,
  orden integer DEFAULT 0,
  sliders_sugeridos jsonb,
  activo boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.filtros (
  id integer NOT NULL DEFAULT nextval('filtros_id_seq'::regclass),
  subrubro_id integer,
  filtro_id integer,
  rubro_id integer,
  nombre text NOT NULL,
  tipo text,
  obligatorio boolean DEFAULT false,
  orden integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.filtros_busqueda_ia (
  id bigint NOT NULL DEFAULT nextval('filtros_busqueda_ia_id_seq'::regclass),
  nombre text NOT NULL,
  tipo varchar(20) NOT NULL DEFAULT 'texto'::character varying,
  opciones jsonb DEFAULT '[]'::jsonb,
  activo boolean DEFAULT true,
  orden integer DEFAULT 0,
  categorias jsonb DEFAULT '["todos"]'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.grupo_categorias (
  id integer NOT NULL DEFAULT nextval('grupo_categorias_id_seq'::regclass),
  nombre text NOT NULL,
  emoji text DEFAULT '👥'::text,
  descripcion text,
  orden integer DEFAULT 0,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.grupo_eventos (
  id integer NOT NULL DEFAULT nextval('grupo_eventos_id_seq'::regclass),
  grupo_id integer,
  titulo text NOT NULL,
  descripcion text,
  fecha timestamptz,
  lugar text,
  imagen text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.grupo_invitaciones (
  id integer NOT NULL DEFAULT nextval('grupo_invitaciones_id_seq'::regclass),
  grupo_id integer,
  invitador_id uuid,
  invitado_id uuid,
  canon_gratis boolean DEFAULT false,
  estado text DEFAULT 'pendiente'::text,
  mensaje text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.grupo_mensajes (
  id integer NOT NULL DEFAULT nextval('grupo_mensajes_id_seq'::regclass),
  grupo_id integer,
  usuario_id uuid,
  texto text NOT NULL,
  created_at timestamptz DEFAULT now(),
  adjunto_tipo text,
  adjunto_nombre text,
  link_url text,
  link_titulo text,
  link_descripcion text,
  link_imagen text
);

CREATE TABLE IF NOT EXISTS public.grupo_miembros (
  id integer NOT NULL DEFAULT nextval('grupo_miembros_id_seq'::regclass),
  grupo_id integer,
  usuario_id uuid,
  rol text DEFAULT 'miembro'::text,
  estado text DEFAULT 'activo'::text,
  canon_gratis boolean DEFAULT false,
  bits_grupo boolean DEFAULT false,
  bits_grupo_hasta date,
  created_at timestamptz DEFAULT now(),
  silenciado boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.grupo_planos (
  id integer NOT NULL DEFAULT nextval('grupo_planos_id_seq'::regclass),
  grupo_id integer,
  titulo text DEFAULT 'Plano'::text,
  imagen_url text NOT NULL,
  descripcion text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.grupo_proveedores (
  id integer NOT NULL DEFAULT nextval('grupo_proveedores_id_seq'::regclass),
  grupo_id integer,
  nombre text NOT NULL,
  rubro text,
  telefono text,
  email text,
  notas text,
  estado text DEFAULT 'habilitado'::text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.grupo_publicaciones (
  id integer NOT NULL DEFAULT nextval('grupo_publicaciones_id_seq'::regclass),
  grupo_id integer,
  usuario_id uuid,
  titulo text NOT NULL,
  descripcion text,
  imagenes text[],
  precio numeric DEFAULT 0,
  moneda text DEFAULT 'ARS'::text,
  tipo text DEFAULT 'interna'::text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.grupo_residentes (
  id integer NOT NULL DEFAULT nextval('grupo_residentes_id_seq'::regclass),
  grupo_id integer,
  nombre text NOT NULL,
  unidad text,
  piso text,
  telefono text,
  email text,
  vehiculo text,
  personas integer DEFAULT 1,
  estado_cuota text DEFAULT 'al_dia'::text,
  notas text,
  usuario_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.grupo_servicios (
  id integer NOT NULL DEFAULT nextval('grupo_servicios_id_seq'::regclass),
  grupo_id integer,
  titulo text NOT NULL,
  descripcion text,
  tipo text DEFAULT 'listado'::text,
  archivo_url text,
  items jsonb DEFAULT '[]'::jsonb,
  orden integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.grupo_subcategorias (
  id integer NOT NULL DEFAULT nextval('grupo_subcategorias_id_seq'::regclass),
  categoria_id integer,
  nombre text NOT NULL,
  emoji text DEFAULT '📌'::text,
  orden integer DEFAULT 0,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  sliders_sugeridos jsonb
);

CREATE TABLE IF NOT EXISTS public.grupos (
  id integer NOT NULL DEFAULT nextval('grupos_id_seq'::regclass),
  nombre text NOT NULL,
  descripcion text,
  imagen text,
  tipo text DEFAULT 'abierto'::text,
  categoria_id integer,
  subcategoria_id integer,
  creador_id uuid,
  miembros_count integer DEFAULT 0,
  config jsonb DEFAULT '{"pestanas_publicas": ["info", "publico"], "ver_miembros_detalle": false, "miembros_pueden_invitar": false, "canon_gratis_por_defecto": true}'::jsonb,
  especial_titulo text DEFAULT 'Especial'::text,
  especial_contenido text,
  especial_imagenes text[],
  links text[],
  reglas text,
  whatsapp_link text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  ciudad text,
  provincia text,
  lat numeric,
  lng numeric,
  pago_ingreso_admin boolean DEFAULT false,
  imagen_fondo text
);

CREATE TABLE IF NOT EXISTS public.insignias_reputacion (
  id bigint NOT NULL DEFAULT nextval('insignias_reputacion_id_seq'::regclass),
  receptor_id uuid NOT NULL,
  dador_id uuid NOT NULL,
  anuncio_id integer,
  nexo_id uuid,
  tipo varchar(20) NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.liquidaciones_promotor (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  promotor_id uuid,
  monto_bits numeric NOT NULL,
  estado text DEFAULT 'pendiente'::text,
  factura_url text,
  nota text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.log_bits_internos (
  id bigint NOT NULL DEFAULT nextval('log_bits_internos_id_seq'::regclass),
  usuario_id uuid,
  cantidad integer NOT NULL,
  motivo text,
  asignado_por uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.log_fallos_sistema (
  id bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  severidad text NOT NULL,
  contexto text NOT NULL,
  operacion text NOT NULL,
  usuario_id uuid,
  datos_contexto jsonb,
  error_mensaje text,
  estado text NOT NULL DEFAULT 'pendiente'::text,
  resuelto_por uuid,
  resuelto_at timestamptz,
  resolucion_nota text
);

CREATE TABLE IF NOT EXISTS public.log_socios_comerciales (
  id bigint NOT NULL DEFAULT nextval('log_socios_comerciales_id_seq'::regclass),
  socio_id uuid,
  usuario_comprador_id uuid,
  bits_comprados integer NOT NULL,
  porcentaje numeric(5,2) NOT NULL,
  bits_acreditados integer NOT NULL,
  concepto text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mensajes (
  id bigint NOT NULL DEFAULT nextval('mensajes_id_seq'::regclass),
  anuncio_id integer,
  emisor_id uuid,
  receptor_id uuid,
  texto text NOT NULL,
  leido boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  nexo_id uuid
);

CREATE TABLE IF NOT EXISTS public.mensajes_soporte (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  usuario_id uuid,
  nombre_usuario text,
  codigo text,
  tipo varchar(20) NOT NULL,
  mensaje text NOT NULL,
  estado varchar(20) DEFAULT 'pendiente'::character varying,
  respuesta text,
  respondido_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.nexo_descarga_solicitudes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  descarga_id uuid,
  nexo_id uuid,
  solicitante_id uuid,
  estado varchar(20) DEFAULT 'pendiente'::character varying,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.nexo_descargas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  item_id uuid,
  nexo_id uuid,
  titulo text NOT NULL,
  descripcion text,
  url text NOT NULL,
  precio_bits integer NOT NULL DEFAULT 1,
  tipo_archivo text,
  "tamaño_kb" integer,
  descargas integer DEFAULT 0,
  bits_generados integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  rights_declared boolean DEFAULT false,
  rights_declared_at timestamptz,
  vence_el timestamptz,
  visibilidad varchar(20) DEFAULT 'publica'::character varying
);

CREATE TABLE IF NOT EXISTS public.nexo_descargas_pagos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  descarga_id uuid,
  nexo_id uuid,
  comprador_id uuid,
  admin_id uuid,
  bits_pagados integer NOT NULL,
  bits_admin integer NOT NULL,
  bits_nexonet integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.nexo_flash_envios (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nexo_id uuid,
  emisor_id uuid,
  plantilla_id uuid,
  item_id text,
  item_url text,
  mensaje text NOT NULL,
  filtro jsonb DEFAULT '{}'::jsonb,
  cantidad_destinatarios integer DEFAULT 0,
  bits_consumidos integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.nexo_horarios (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nexo_id uuid,
  dia integer NOT NULL,
  hora_desde time without time zone,
  hora_hasta time without time zone,
  cerrado boolean DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.nexo_mensajes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nexo_id uuid,
  usuario_id uuid,
  texto text,
  adjunto_url text,
  adjunto_tipo text,
  adjunto_nombre text,
  link_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.nexo_miembros (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nexo_id uuid,
  usuario_id uuid,
  rol text DEFAULT 'miembro'::text,
  estado text DEFAULT 'activo'::text,
  silenciado boolean DEFAULT false,
  bits_pagados integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  aprobado_por uuid,
  fecha_pago timestamptz DEFAULT now(),
  vence_el timestamptz
);

CREATE TABLE IF NOT EXISTS public.nexo_plantillas_mensaje (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nexo_id uuid,
  usuario_id uuid,
  titulo text NOT NULL,
  cuerpo text NOT NULL,
  incluir_link boolean DEFAULT false,
  activa boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.nexo_resenas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nexo_id uuid,
  usuario_id uuid,
  rating integer NOT NULL,
  comentario text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.nexo_slider_anuncios (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nexo_id uuid,
  slider_id uuid,
  anuncio_id integer,
  usuario_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.nexo_slider_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slider_id uuid,
  nexo_id uuid,
  tipo text NOT NULL,
  titulo text,
  descripcion text,
  url text,
  miniatura_url text,
  precio_bits integer DEFAULT 0,
  orden integer DEFAULT 0,
  publicado_por uuid,
  created_at timestamptz DEFAULT now(),
  vence_el timestamptz,
  visibilidad varchar(20) DEFAULT 'publica'::character varying
);

CREATE TABLE IF NOT EXISTS public.nexo_sliders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nexo_id uuid,
  titulo text NOT NULL,
  tipo text NOT NULL,
  orden integer DEFAULT 0,
  activo boolean DEFAULT true,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.nexo_visitas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nexo_id uuid NOT NULL,
  visitante_id uuid NOT NULL,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.nexos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  usuario_id uuid,
  tipo text NOT NULL,
  subtipo text,
  titulo text NOT NULL,
  descripcion text,
  banner_url text,
  avatar_url text,
  ciudad text,
  provincia text,
  precio numeric,
  moneda text DEFAULT 'ARS'::text,
  whatsapp text,
  link_externo text,
  estado text DEFAULT 'activo'::text,
  vistas integer DEFAULT 0,
  config jsonb DEFAULT '{}'::jsonb,
  lat numeric,
  lng numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  renovar_automatico boolean DEFAULT false,
  fecha_vencimiento timestamptz,
  fecha_renovacion timestamptz,
  direccion text,
  subrubro_id integer,
  rubro_id integer,
  trial_hasta timestamptz,
  siguiente_pago timestamptz,
  plan_mensual_bits integer DEFAULT 3000,
  bits_promo integer DEFAULT 0,
  chat_habilitado boolean DEFAULT false,
  mostrar_en_mapa boolean DEFAULT true,
  limite_conexiones integer DEFAULT 500,
  conexiones_recibidas integer DEFAULT 0,
  filtros jsonb,
  cv_url text
);

CREATE TABLE IF NOT EXISTS public.notificaciones (
  id integer NOT NULL DEFAULT nextval('notificaciones_id_seq'::regclass),
  usuario_id uuid,
  emisor_id uuid,
  anuncio_id integer,
  tipo text DEFAULT 'conexion'::text,
  leida boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  mensaje text,
  nexo_id uuid,
  url text
);

CREATE TABLE IF NOT EXISTS public.opciones_filtro (
  id integer NOT NULL DEFAULT nextval('opciones_filtro_id_seq'::regclass),
  subrubro_id integer,
  filtro_id integer,
  opcion text NOT NULL,
  orden integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.pagos_mp (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  payment_id text NOT NULL,
  usuario_id uuid,
  paquete text NOT NULL,
  monto numeric NOT NULL,
  estado text NOT NULL DEFAULT 'approved'::text,
  bits_col text,
  bits_cant integer,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.provincias (
  id integer NOT NULL DEFAULT nextval('provincias_id_seq'::regclass),
  nombre text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.push_suscripciones (
  id bigint NOT NULL DEFAULT nextval('push_suscripciones_id_seq'::regclass),
  usuario_id uuid,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  dispositivo text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rubros (
  id integer NOT NULL DEFAULT nextval('rubros_id_seq'::regclass),
  nombre text NOT NULL,
  emoji text,
  color text,
  orden integer DEFAULT 0,
  activo boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.servicio_filtros (
  id integer NOT NULL DEFAULT nextval('servicio_filtros_id_seq'::regclass),
  subrubro_id integer,
  nombre varchar(50) NOT NULL,
  tipo varchar(20) DEFAULT 'lista'::character varying,
  opciones jsonb,
  orden integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.servicio_rubros (
  id integer NOT NULL DEFAULT nextval('servicio_rubros_id_seq'::regclass),
  nombre varchar(100) NOT NULL,
  orden integer DEFAULT 0,
  activo boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.servicio_subrubros (
  id integer NOT NULL DEFAULT nextval('servicio_subrubros_id_seq'::regclass),
  rubro_id integer,
  nombre varchar(100) NOT NULL,
  orden integer DEFAULT 0,
  sliders_sugeridos jsonb,
  activo boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.sesiones_log (
  id bigint NOT NULL,
  usuario_id uuid NOT NULL,
  inicio timestamptz NOT NULL DEFAULT now(),
  fin timestamptz,
  duracion_seg integer,
  paginas jsonb DEFAULT '[]'::jsonb,
  dispositivo text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.slider_tipos (
  id integer NOT NULL DEFAULT nextval('slider_tipos_id_seq'::regclass),
  codigo text NOT NULL,
  label text NOT NULL,
  icono text NOT NULL DEFAULT '📄'::text,
  descripcion_admin text,
  activo boolean NOT NULL DEFAULT true,
  orden integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  descripcion_publica text
);

CREATE TABLE IF NOT EXISTS public.socios_comerciales (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  usuario_id uuid,
  tipo varchar(20) NOT NULL,
  porcentaje numeric(5,2) NOT NULL,
  region text,
  codigo_referido text,
  activo boolean DEFAULT true,
  bits_promotor_acumulado integer DEFAULT 0,
  bits_promotor_reintegrado integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.solicitudes_reembolso_promotor (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  usuario_id uuid,
  bits_cantidad integer NOT NULL,
  monto_ars integer NOT NULL,
  estado text DEFAULT 'pendiente'::text,
  created_at timestamptz DEFAULT now(),
  procesado_at timestamptz,
  procesado_por uuid,
  nota text
);

CREATE TABLE IF NOT EXISTS public.subrubro_filtros (
  id integer NOT NULL DEFAULT nextval('subrubro_filtros_id_seq'::regclass),
  subrubro_id integer,
  nombre varchar(50) NOT NULL,
  tipo varchar(20) DEFAULT 'rango'::character varying,
  opciones jsonb,
  orden integer DEFAULT 0,
  contexto text DEFAULT 'ambos'::text
);

CREATE TABLE IF NOT EXISTS public.subrubros (
  id integer NOT NULL DEFAULT nextval('subrubros_id_seq'::regclass),
  rubro_id integer,
  nombre text NOT NULL,
  emoji text,
  orden integer DEFAULT 0,
  activo boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.sugerencias_categorias (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  usuario_id uuid,
  tipo text,
  rubro_sugerido text,
  subrubro_sugerido text,
  created_at timestamptz DEFAULT now(),
  revisado boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.suscripciones_mp (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  usuario_id uuid,
  mp_preapproval_id text,
  mp_plan_id text,
  tipo varchar(20) NOT NULL,
  referencia_id text,
  monto numeric(10,2) NOT NULL,
  moneda varchar(5) DEFAULT 'ARS'::character varying,
  estado varchar(20) DEFAULT 'pending'::character varying,
  proximo_cobro timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.trabajo_filtros (
  id integer NOT NULL DEFAULT nextval('trabajo_filtros_id_seq'::regclass),
  subrubro_id integer,
  nombre varchar(50) NOT NULL,
  tipo varchar(20) DEFAULT 'lista'::character varying,
  opciones jsonb,
  orden integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.trabajo_rubros (
  id integer NOT NULL DEFAULT nextval('trabajo_rubros_id_seq'::regclass),
  nombre varchar(100) NOT NULL,
  orden integer DEFAULT 0,
  activo boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.trabajo_subrubros (
  id integer NOT NULL DEFAULT nextval('trabajo_subrubros_id_seq'::regclass),
  rubro_id integer,
  nombre varchar(100) NOT NULL,
  orden integer DEFAULT 0,
  sliders_sugeridos jsonb,
  activo boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.usuarios (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL,
  nombre text,
  avatar_url text,
  ciudad text,
  provincia text,
  bits_saldo integer DEFAULT 0,
  created_at timestamp DEFAULT now(),
  apellido text,
  empresa text,
  whatsapp text,
  direccion text,
  direccion_comercial text,
  bits integer DEFAULT 0,
  promotor boolean DEFAULT false,
  codigo text,
  usuario text,
  nombre_usuario text,
  codigo_promotor_ref text,
  plan text DEFAULT 'nexofree'::text,
  slots_extra integer DEFAULT 0,
  barrio text,
  telefono text,
  nombre_empresa text,
  whatsapp_empresa text,
  provincia_empresa text,
  ciudad_empresa text,
  barrio_empresa text,
  direccion_empresa text,
  lat_empresa numeric,
  lng_empresa numeric,
  vis_personal jsonb,
  vis_empresa jsonb,
  horarios jsonb,
  feriados jsonb,
  bits_promo integer DEFAULT 0,
  bits_gastados integer DEFAULT 0,
  bits_promo_gastados integer DEFAULT 0,
  estrellas integer DEFAULT 0,
  total_vistas integer DEFAULT 0,
  total_conexiones integer DEFAULT 0,
  grupos_unidos integer DEFAULT 0,
  bits_free integer DEFAULT 0,
  bits_free_gastados integer DEFAULT 0,
  bits_promo_total integer DEFAULT 0,
  bits_busquedas integer DEFAULT 0,
  bits_grupo integer DEFAULT 0,
  bits_gastados_anuncios integer DEFAULT 0,
  bits_gastados_conexion integer DEFAULT 0,
  bits_gastados_link integer DEFAULT 0,
  bits_gastados_flash integer DEFAULT 0,
  bits_gastados_busquedas integer DEFAULT 0,
  bits_gastados_grupo integer DEFAULT 0,
  bits_promo_ganados integer DEFAULT 0,
  bits_promo_reembolso integer DEFAULT 0,
  referido_por uuid,
  bits_promotor integer DEFAULT 0,
  es_promotor boolean DEFAULT false,
  total_referidos integer DEFAULT 0,
  bits_promotor_total integer DEFAULT 0,
  notif_whatsapp boolean DEFAULT false,
  bits_gastados_adjuntos integer DEFAULT 0,
  bits_free_fecha timestamptz DEFAULT now(),
  es_admin boolean DEFAULT false,
  estado_cuenta varchar(30),
  nota_baja text,
  insignia_logro varchar(20) DEFAULT 'ninguna'::character varying,
  bits_totales_acumulados integer DEFAULT 0,
  lat numeric(10,8),
  lng numeric(11,8),
  is_interno boolean DEFAULT false,
  es_bot boolean DEFAULT false,
  bits_free_asignados_total integer DEFAULT 0,
  socio_regional_id uuid,
  onboarding_completado boolean DEFAULT false,
  es_admin_sistema boolean DEFAULT false,
  last_seen timestamptz,
  bits_gastados_empresa integer DEFAULT 0,
  bits_gastados_servicio integer DEFAULT 0,
  bits_gastados_trabajo integer DEFAULT 0,
  bot_activo boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.usuarios_conectados (
  id bigint NOT NULL,
  usuario_id uuid NOT NULL,
  last_seen timestamptz NOT NULL DEFAULT now(),
  pagina text,
  dispositivo text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.usuarios_mp_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  usuario_id uuid,
  mp_user_id text,
  access_token text,
  refresh_token text,
  token_type text,
  expires_in integer,
  scope text,
  created_at timestamptz DEFAULT now()
);
