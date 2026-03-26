"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type TipoAyuda = "anuncio"|"empresa"|"servicio"|"grupo"|"trabajo"|"busqueda_ia"|"general"|"mapa"|"perfil"|"promotor";

type Info = {
  color:string; emoji:string; titulo:string; sub:string; costo:string;
  items:{emoji:string;titulo:string;desc:string}[];
};

const DATA: Record<TipoAyuda, Info> = {
  anuncio: {
    color:"#d4a017",emoji:"📣",titulo:"PUBLICÁ TU ANUNCIO",sub:"Vendé, comprá o permutá",
    costo:"Publicar: gratis con BIT Free | Conexión: 1 BIT por contacto",
    items:[
      {emoji:"🤖",titulo:"Matching IA",desc:"El sistema avisa automáticamente a quien busca lo tuyo"},
      {emoji:"🔗",titulo:"Conexión directa",desc:"1 BIT por contacto — doble chance de cerrar el trato"},
      {emoji:"🔍",titulo:"Filtros específicos",desc:"Marca, año, precio, km y más según el rubro"},
      {emoji:"⚡",titulo:"Flash destacado",desc:"Tu anuncio aparece primero en los resultados"},
      {emoji:"📍",titulo:"Por ubicación",desc:"Filtrá por provincia, ciudad y barrio"},
      {emoji:"🆓",titulo:"BIT Free mensuales",desc:"Publicá gratis con tus 3.000 BIT Free del mes"},
    ],
  },
  empresa: {
    color:"#c0392b",emoji:"🏢",titulo:"CREÁ TU EMPRESA",sub:"Tu página comercial completa",
    costo:"Primer mes GRATIS · Luego 10.000 BIT/mes",
    items:[
      {emoji:"🖼️",titulo:"Logo y banner",desc:"Personalizá tu perfil con imagen de marca"},
      {emoji:"📸",titulo:"Sliders de contenido",desc:"Galería, productos, servicios, novedades y más"},
      {emoji:"📥",titulo:"Descargas pagas",desc:"Vendé catálogos y guías — recibís 60% en BIT Promo"},
      {emoji:"👁️",titulo:"Visitas reales",desc:"Cada visita cuesta 1 BIT al dueño, garantiza tráfico real"},
      {emoji:"🤖",titulo:"Matching automático",desc:"Compradores que buscan tu rubro te encuentran solos"},
      {emoji:"⭐",titulo:"Primer mes gratis",desc:"Probás sin costo el primer mes completo"},
    ],
  },
  servicio: {
    color:"#27ae60",emoji:"🛠️",titulo:"OFRECÉ TU SERVICIO",sub:"Que te encuentren quienes te necesitan",
    costo:"Crear perfil: gratis | Sliders de contenido: 50 BIT c/u",
    items:[
      {emoji:"🤖",titulo:"Te encuentran solos",desc:"El matching IA conecta tu servicio con quienes lo buscan"},
      {emoji:"🎬",titulo:"Portfolio completo",desc:"Mostrá fotos, videos y trabajos realizados"},
      {emoji:"💬",titulo:"Testimonios",desc:"Tus clientes dejan opiniones visibles en tu perfil"},
      {emoji:"📥",titulo:"Vendé tu conocimiento",desc:"Cobrá por descargas: presupuestos, guías, tutoriales"},
      {emoji:"📍",titulo:"Local o nacional",desc:"Aparecés en búsquedas de tu ciudad o todo el país"},
      {emoji:"🆓",titulo:"Sin costo de publicidad",desc:"Pagás solo cuando alguien se conecta con vos"},
    ],
  },
  grupo: {
    color:"#3a7bd5",emoji:"👥",titulo:"CREÁ TU GRUPO",sub:"Tu comunidad con chat en vivo",
    costo:"Crear grupo: gratis | Membresía: 500 BIT/mes por miembro",
    items:[
      {emoji:"💬",titulo:"Chat en tiempo real",desc:"Todos los miembros pueden comunicarse al instante"},
      {emoji:"📋",titulo:"Páginas de contenido",desc:"Galería, documentos, novedades, descargas y más"},
      {emoji:"💰",titulo:"Generás ingresos",desc:"Recibís 150 BIT Promo por cada miembro que se une"},
      {emoji:"📥",titulo:"Contenido exclusivo",desc:"Vendé descargas pagas solo para miembros del grupo"},
      {emoji:"🛡️",titulo:"Control total",desc:"Vos elegís quién entra: libre, con aprobación o invitación"},
      {emoji:"🔗",titulo:"Invitá por WhatsApp",desc:"Compartí el link de tu grupo en un click"},
    ],
  },
  trabajo: {
    color:"#8e44ad",emoji:"💼",titulo:"BUSCÁ TRABAJO",sub:"Tu CV activo que trabaja solo",
    costo:"Publicar: gratis con BIT Free mensuales",
    items:[
      {emoji:"🤖",titulo:"Matching con empleadores",desc:"El sistema avisa a empresas cuando publicás tu perfil"},
      {emoji:"📍",titulo:"Local o nacional",desc:"Aparecés en búsquedas de tu ciudad o todo el país"},
      {emoji:"📎",titulo:"Adjuntá tu CV",desc:"Subí tu CV en PDF directamente en tu publicación"},
      {emoji:"🔔",titulo:"Alertas de empleo",desc:"Activá la Búsqueda IA y recibí avisos de ofertas nuevas"},
      {emoji:"🏷️",titulo:"Filtros específicos",desc:"Tipo de puesto, modalidad, jornada y nivel de estudios"},
      {emoji:"🆓",titulo:"Gratis con BIT Free",desc:"Publicá tu perfil laboral sin gastar dinero real"},
    ],
  },
  busqueda_ia: {
    color:"#16a085",emoji:"🤖",titulo:"BÚSQUEDA IA",sub:"Tu alerta inteligente 24/7",
    costo:"1 BIT por cada coincidencia encontrada · 3.000 BIT Free por mes incluidos",
    items:[
      {emoji:"🔔",titulo:"Notificación automática",desc:"Cada vez que aparece un anuncio con tus criterios recibís una alerta al instante"},
      {emoji:"🎯",titulo:"Filtros exactos",desc:"Configurás marca, precio, año, km, ciudad y más — la IA busca eso puntualmente"},
      {emoji:"⏰",titulo:"Sin revisar todos los días",desc:"El sistema trabaja 24/7 mientras vos hacés tu vida"},
      {emoji:"📋",titulo:"Múltiples búsquedas",desc:"Guardá varias búsquedas activas al mismo tiempo para distintas necesidades"},
      {emoji:"💡",titulo:"Solo resultados reales",desc:"Cada match consume 1 BIT — eso garantiza que el aviso es una coincidencia real"},
      {emoji:"✅",titulo:"Activar y desactivar",desc:"Pausás una búsqueda cuando ya no la necesitás y la reactivás cuando quieras"},
    ],
  },
  general: {
    color:"#d4a017",emoji:"✨",titulo:"NEXONET ARGENTINA",sub:"La red social con matching inteligente",
    costo:"Registrate gratis · 3.000 BIT Free cada mes incluidos",
    items:[
      {emoji:"📣",titulo:"Publicá anuncios",desc:"Vendé, comprá o permutá con matching IA automático"},
      {emoji:"🏢",titulo:"Creá tu empresa",desc:"Página comercial completa desde $0 el primer mes"},
      {emoji:"🛠️",titulo:"Ofrecé servicios",desc:"Que te encuentren quienes te necesitan sin pagar publicidad"},
      {emoji:"👥",titulo:"Grupos activos",desc:"Comunidades con chat en vivo, contenido y miembros activos"},
      {emoji:"🤖",titulo:"Búsqueda IA",desc:"Configurá filtros y recibí alertas automáticas de lo que buscás"},
      {emoji:"⭐",titulo:"Sé Promotor",desc:"Referí usuarios y ganá el 15% de sus compras de por vida"},
    ],
  },
  mapa: {
    color:"#3a7bd5",emoji:"🗺️",titulo:"MAPA DE NEXOS",sub:"Encontrá lo que buscás cerca tuyo",
    costo:"Gratis para explorar · 1 BIT para conectarte con un anuncio",
    items:[
      {emoji:"📍",titulo:"Geolocalización",desc:"Ves todos los anuncios y nexos activos en tu zona en tiempo real"},
      {emoji:"🔍",titulo:"Filtrá por rubro",desc:"Seleccioná categorías para ver solo lo que te interesa en el mapa"},
      {emoji:"🚗",titulo:"Calculá distancias",desc:"Sabés exactamente cuán lejos está cada publicación de vos"},
      {emoji:"🏢",titulo:"Empresas y servicios",desc:"Encontrá comercios y profesionales activos cerca tuyo"},
      {emoji:"👥",titulo:"Grupos cercanos",desc:"Descubrí comunidades activas en tu barrio o ciudad"},
      {emoji:"📱",titulo:"Usá tu GPS",desc:"Activá la ubicación para centrar el mapa en donde estás ahora"},
    ],
  },
  perfil: {
    color:"#d4a017",emoji:"👤",titulo:"TU PERFIL NEXONET",sub:"Todo lo que podés hacer desde acá",
    costo:"BIT Nexo desde $500 ARS · BIT Free: gratis cada mes",
    items:[
      {emoji:"🪙",titulo:"Comprá BIT Nexo",desc:"Cargá créditos para publicar, conectarte y acceder a contenido premium"},
      {emoji:"💙",titulo:"BIT Free gratis",desc:"Recibís 3.000 BIT Free cada 30 días automáticamente sin pagar nada"},
      {emoji:"🟢",titulo:"BIT Promo",desc:"Los ganás siendo Promotor o vendiendo contenido — se usan igual que los otros"},
      {emoji:"🏅",titulo:"Insignias de logro",desc:"Acumulá BIT y subí de nivel: Bronce, Plata, Oro, Platino, Diamante"},
      {emoji:"⭐",titulo:"Reputación",desc:"Otros usuarios te dan insignias de confianza, calidad y respuesta rápida"},
      {emoji:"⚙️",titulo:"Configurá tu perfil",desc:"Editá tus datos, foto, ciudad y visibilidad de WhatsApp"},
    ],
  },
  promotor: {
    color:"#8e44ad",emoji:"⭐",titulo:"NEXO PROMOTOR",sub:"Ganá dinero real referiendo usuarios",
    costo:"100.000 BIT Promo = $100.000 ARS · 1 BIT Promo = $1 ARS",
    items:[
      {emoji:"🔗",titulo:"Compartí tu link",desc:"Cada persona que se registra con tu código queda vinculada a tu cuenta para siempre"},
      {emoji:"💰",titulo:"15% automático",desc:"Cada vez que tu referido compra BIT recibís el 15% en BIT Promo al instante"},
      {emoji:"♾️",titulo:"De por vida",desc:"La comisión no vence — mientras tu referido compre, vos ganás"},
      {emoji:"👥",titulo:"Sin límite de referidos",desc:"Podés referir a tantas personas como quieras, sin techo de ganancias"},
      {emoji:"💸",titulo:"Reembolso en efectivo",desc:"Al acumular 100.000 BIT Promo podés solicitar $100.000 ARS contra factura"},
      {emoji:"📱",titulo:"Compartí por WhatsApp",desc:"Un click y tu link llega a todos tus contactos con mensaje personalizado"},
    ],
  },
};

const CACHE_KEY = "ayuda_popups_activos";
const CACHE_TTL = 5 * 60 * 1000;

function checkCache(): boolean | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { val, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) { localStorage.removeItem(CACHE_KEY); return null; }
    return val;
  } catch { return null; }
}
function setCache(val: boolean) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ val, ts: Date.now() })); } catch {}
}

const CTA_URLS: Record<TipoAyuda, string> = {
  anuncio:     "/nexo/crear/anuncio",
  empresa:     "/nexo/crear/empresa",
  servicio:    "/nexo/crear/servicio",
  grupo:       "/nexo/crear/grupo",
  trabajo:     "/nexo/crear/trabajo",
  busqueda_ia: "/busqueda-ia",
  general:     "/publicar",
  mapa:        "/mapa",
  perfil:      "/usuario",
  promotor:    "/promotor",
};

export default function AyudaPopup({
  tipo,
  open: openProp,
  onClose,
}: {
  tipo: TipoAyuda;
  open?: boolean;
  onClose?: () => void;
}) {
  const [openInternal, setOpenInternal] = useState(false);
  const [visible, setVisible] = useState<boolean | null>(null);

  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : openInternal;
  const close = () => { isControlled ? onClose?.() : setOpenInternal(false); };

  useEffect(() => {
    localStorage.removeItem("ayuda_popups_activos");
    Promise.resolve(supabase.from("config_global").select("valor").eq("clave","ayuda_popups_activos").single())
      .then(({ data }) => { const v = data?.valor !== "false"; setCache(v); setVisible(v); })
      .catch(() => { setCache(true); setVisible(true); });
  }, []);

  if (visible === null || visible === false) return null;
  const d = DATA[tipo];
  if (!d) return null;
  const { color, emoji, titulo, sub, costo, items } = d;
  const ctaUrl = CTA_URLS[tipo] || "/publicar";

  return (
    <>
      {/* Botón flotante — solo cuando NO es controlado externamente */}
      {!isControlled && (
        <button onClick={() => setOpenInternal(true)}
          style={{position:"fixed",bottom:110,right:16,width:48,height:48,borderRadius:"50%",
            background:color,border:"none",color:"#fff",fontSize:24,fontWeight:900,
            fontFamily:"'Bebas Neue',sans-serif",cursor:"pointer",zIndex:200,
            boxShadow:`0 4px 14px ${color}66`,display:"flex",alignItems:"center",justifyContent:"center"}}>
          ?
        </button>
      )}

      {open && (
        <div onClick={close}
          style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:99999,
            display:"flex",flexDirection:"column",overflowY:"auto",fontFamily:"'Nunito',sans-serif"}}>
          <div onClick={e => e.stopPropagation()}
            style={{width:"100%",maxWidth:480,margin:"auto",background:"#fff"}}>

            {/* ── HEADER full ── */}
            <div style={{background:`linear-gradient(135deg,${color}dd,${color})`,padding:"32px 20px 20px",textAlign:"center",position:"relative"}}>
              <button onClick={close}
                style={{position:"absolute",top:16,right:16,background:"rgba(255,255,255,0.2)",border:"none",
                  borderRadius:"50%",width:36,height:36,fontSize:20,color:"#fff",cursor:"pointer",
                  display:"flex",alignItems:"center",justifyContent:"center",zIndex:1}}>
                ✕
              </button>
              <div style={{fontSize:36,lineHeight:1,marginBottom:6}}>{emoji}</div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:24,color:"#fff",letterSpacing:2,lineHeight:1.1}}>
                {titulo}
              </div>
              <div style={{fontSize:14,color:"rgba(255,255,255,0.75)",fontWeight:600,marginTop:6}}>
                {sub}
              </div>
            </div>

            {/* ── BENEFICIOS grid 2 col ── */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr"}}>
              {items.map((it, i) => (
                <div key={i} style={{padding:"10px 12px",
                  borderBottom: i < items.length - 2 ? "1px solid #f0f0f0" : "none",
                  borderRight: i % 2 === 0 ? "1px solid #f0f0f0" : "none"}}>
                  <div style={{fontSize:22,lineHeight:1,marginBottom:4}}>{it.emoji}</div>
                  <div style={{fontSize:13,fontWeight:900,color,lineHeight:1.2,marginBottom:4}}>
                    {it.titulo}
                  </div>
                  <div style={{fontSize:12,color:"#888",lineHeight:1.4,fontWeight:600}}>
                    {it.desc}
                  </div>
                </div>
              ))}
            </div>

            {/* ── COSTO ── */}
            <div style={{padding:"10px 16px"}}>
              <div style={{background:`${color}14`,border:`1.5px solid ${color}40`,borderRadius:12,
                padding:"14px 16px",textAlign:"center"}}>
                <div style={{fontSize:11,fontWeight:800,color,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>
                  💰 Costo
                </div>
                <div style={{fontSize:13,fontWeight:700,color:"#1a2a3a",lineHeight:1.4}}>
                  {costo}
                </div>
              </div>
            </div>

            {/* ── CTA ── */}
            <div style={{padding:"0 16px 24px"}}>
              <a href={ctaUrl}
                style={{display:"block",width:"100%",background:`linear-gradient(135deg,${color}cc,${color})`,
                  border:"none",borderRadius:14,padding:16,fontSize:17,fontWeight:900,
                  color:"#fff",cursor:"pointer",fontFamily:"'Nunito',sans-serif",
                  boxShadow:`0 4px 0 ${color}88`,letterSpacing:0.5,textDecoration:"none",
                  textAlign:"center",boxSizing:"border-box"}}>
                Empezar ahora →
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
