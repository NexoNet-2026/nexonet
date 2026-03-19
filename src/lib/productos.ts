// ══════════════════════════════════════════
// NEXONET — Catálogo de productos
// Importar desde cualquier componente
// ══════════════════════════════════════════

export const PRODUCTOS = {
  anuncio: [
    { id:"anu1",   label:"1 Anuncio",      emoji:"📋", precio:500,   duracion:"30 días", desc:"Publicá un anuncio por 30 días",    badge:null },
    { id:"anu3",   label:"3 Anuncios",     emoji:"📋", precio:1500,  duracion:"30 días", desc:"Publicá 3 anuncios activos",        badge:null },
    { id:"anu10",  label:"10 Anuncios",    emoji:"📋", precio:5000,  duracion:"30 días", desc:"Ideal para vendedores frecuentes",  badge:"AHORRÁS" },
  ],
  conexion: [
    { id:"con500",  label:"500 BIT",       emoji:"🔗", precio:500,   duracion:null,      desc:"500 conexiones a anuncios",         badge:null },
    { id:"con1000", label:"1.000 BIT",     emoji:"🔗", precio:900,   duracion:null,      desc:"Ahorrás $100 vs paquete básico",    badge:"AHORRÁS $100" },
    { id:"con5000", label:"5.000 BIT",     emoji:"🔗", precio:4000,  duracion:null,      desc:"Ahorrás $1000 — para power users",  badge:"AHORRÁS $1000" },
    { id:"coninf",  label:"Ilimitados",    emoji:"♾️", precio:10000, duracion:"30 días", desc:"Conexiones sin límite por 30 días", badge:"TOP" },
  ],
  flash: [
    { id:"fl_bar",  label:"PROMO Flash Barrio / Subgrupo", emoji:"⚡", precio:500,   duracion:"15 días", desc:"Destacado en tu zona cercana",     badge:null },
    { id:"fl_ciu",  label:"PROMO Flash Ciudad / Grupo",    emoji:"⚡", precio:2000,  duracion:"15 días", desc:"Alcance a toda la ciudad",         badge:null },
    { id:"fl_pro",  label:"PROMO Flash Provincia",         emoji:"⚡", precio:5000,  duracion:"30 días", desc:"Visibilidad en toda la provincia", badge:"RECOMENDADO" },
    { id:"fl_pai",  label:"PROMO Flash País",              emoji:"🌟", precio:10000, duracion:"30 días", desc:"Máxima exposición en Argentina",   badge:"MÁXIMO" },
  ],
  extras: [
    { id:"link",    label:"Link en anuncio",    emoji:"🔗", precio:500, duracion:"30 días", desc:"Agregá tu web o red social",       badge:null },
    { id:"adjunto", label:"Adjunto en anuncio", emoji:"📎", precio:500, duracion:"30 días", desc:"PDF, catálogo o ficha técnica",    badge:null },
    { id:"grupo",   label:"Unirse a grupo",     emoji:"👥", precio:500, duracion:"30 días", desc:"Accedé a un grupo y su comunidad", badge:null },
  ],
};
