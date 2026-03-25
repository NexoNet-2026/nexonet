"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";
import PopupCompra, { MetodoPago } from "@/components/PopupCompra";
import AyudaPopup from "@/components/AyudaPopup";

const SLIDERS_PREDEFINIDOS: Record<string, { id:string; emoji:string; titulo:string; tipo:string; desc:string }[]> = {
  galeria:      [{ id:"galeria",      emoji:"📸", titulo:"Galería de fotos",    tipo:"galeria",      desc:"Fotos e imágenes" }],
  videos:       [{ id:"videos",       emoji:"🎬", titulo:"Videos",              tipo:"videos",       desc:"Clips y presentaciones" }],
  documentos:   [{ id:"documentos",   emoji:"📄", titulo:"Documentos",          tipo:"documentos",   desc:"PDFs y archivos" }],
  descargas:    [{ id:"descargas",    emoji:"📥", titulo:"Descargas",           tipo:"descargas",    desc:"Archivos gratuitos y de pago" }],
  productos:    [{ id:"productos",    emoji:"🛒", titulo:"Productos",           tipo:"productos",    desc:"Catálogo de productos" }],
  novedades:    [{ id:"novedades",    emoji:"📢", titulo:"Novedades",           tipo:"novedades",    desc:"Anuncios y actualizaciones" }],
  proveedores:  [{ id:"proveedores",  emoji:"🏭", titulo:"Proveedores",         tipo:"proveedores",  desc:"Nexos de proveedores" }],
  faq:          [{ id:"faq",          emoji:"❓", titulo:"Preguntas frecuentes", tipo:"faq",          desc:"Dudas y respuestas" }],
  facturas:     [{ id:"facturas",     emoji:"🧾", titulo:"Facturas",            tipo:"facturas",     desc:"Comprobantes y pagos" }],
  calendario:   [{ id:"calendario",   emoji:"📅", titulo:"Calendario",          tipo:"calendario",   desc:"Eventos y fechas" }],
  equipo:       [{ id:"equipo",       emoji:"👤", titulo:"Equipo / Miembros",   tipo:"equipo",       desc:"Perfiles del equipo" }],
  servicios:    [{ id:"servicios",    emoji:"🛠️", titulo:"Servicios",           tipo:"servicios",    desc:"Lo que ofrecés" }],
  portfolio:    [{ id:"portfolio",    emoji:"🎨", titulo:"Portfolio",           tipo:"portfolio",    desc:"Trabajos realizados" }],
  testimonios:  [{ id:"testimonios",  emoji:"💬", titulo:"Testimonios",         tipo:"testimonios",  desc:"Opiniones de clientes" }],
  certificados: [{ id:"certificados", emoji:"🏅", titulo:"Certificados",        tipo:"certificados", desc:"Títulos y credenciales" }],
};

const CONFIG_TIPO: Record<string, { titulo:string; color:string; emoji:string; sliders_default:string[]; usaSliders:boolean }> = {
  anuncio:  { titulo:"Crear Anuncio",    color:"#d4a017", emoji:"📣", sliders_default:[], usaSliders:false },
  empresa:  { titulo:"Crear Empresa",    color:"#c0392b", emoji:"🏢", sliders_default:["galeria","servicios","productos","videos","documentos"], usaSliders:true },
  servicio: { titulo:"Ofrecer Servicio", color:"#27ae60", emoji:"🛠️", sliders_default:["portfolio","videos","testimonios","certificados"], usaSliders:true },
  trabajo:  { titulo:"Buscar Trabajo",   color:"#8e44ad", emoji:"💼", sliders_default:[], usaSliders:false },
};

const CONFIG_SUBTIPO: Record<string, { titulo:string; sliders_default:string[] }> = {
  emprendimiento: { titulo:"Crear Emprendimiento",   sliders_default:["novedades","productos","galeria","videos","proveedores","facturas","documentos"] },
  curso:          { titulo:"Crear Curso",            sliders_default:["novedades","videos","documentos","descargas","calendario","faq"] },
  consorcio:      { titulo:"Crear Consorcio",        sliders_default:["novedades","facturas","documentos","proveedores","calendario","galeria"] },
  deportivo:      { titulo:"Crear Club Deportivo",   sliders_default:["novedades","galeria","videos","equipo","calendario","documentos"] },
  estudio:        { titulo:"Crear Grupo de Estudio", sliders_default:["novedades","documentos","descargas","videos","calendario","faq"] },
  venta:          { titulo:"Crear Grupo de Venta",   sliders_default:["productos","novedades","galeria","videos","descargas"] },
  artistas:       { titulo:"Crear Grupo Artistas",   sliders_default:["portfolio","galeria","videos","novedades","calendario"] },
  vecinos:        { titulo:"Crear Grupo Vecinos",    sliders_default:["novedades","galeria","documentos","calendario","faq"] },
  generico:       { titulo:"Crear Grupo Libre",      sliders_default:["novedades","galeria"] },
};

type Prov   = { id:number; nombre:string };
type Ciudad = { id:number; nombre:string; provincia_id:number };

export default function NexoCrearPage() {
  return (
    <Suspense fallback={
      <div style={{paddingTop:"95px",textAlign:"center",color:"#9a9a9a",fontFamily:"'Nunito',sans-serif",background:"#f4f4f2",minHeight:"100vh",padding:"60px"}}>
        Cargando...
      </div>
    }>
      <NexoCrearInner />
    </Suspense>
  );
}

function NexoCrearInner() {
  const router       = useRouter();
  const params       = useParams();
  const searchParams = useSearchParams();
  const tipo         = (params?.tipo as string) || "";
  const subtipo      = searchParams?.get("subtipo") || "";
  const preRubroId   = searchParams?.get("rubro_id") || "";
  const preSubrubroId = searchParams?.get("subrubro_id") || "";

  const cfg        = tipo === "grupo" ? null : CONFIG_TIPO[tipo];
  const cfgSub     = subtipo ? CONFIG_SUBTIPO[subtipo] : null;
  const usaSliders = tipo === "grupo" || cfg?.usaSliders;

  const tituloPage     = cfgSub?.titulo || cfg?.titulo || (tipo === "grupo" ? "Crear Grupo" : "Crear Nexo");
  const colorPage      = cfg?.color || "#3a7bd5";
  const emojiPage      = cfg?.emoji || "👥";
  const slidersDefault = tipo === "grupo"
    ? (cfgSub?.sliders_default || ["novedades","galeria"])
    : (cfg?.sliders_default || []);

  const [paso,           setPaso]           = useState(1);
  const [perfil,         setPerfil]         = useState<any>(null);
  const [guardando,      setGuardando]      = useState(false);
  const [subiendoImg,    setSubiendoImg]    = useState<"banner"|"avatar"|null>(null);
  const [popupSlider,    setPopupSlider]    = useState(false);
  const [popupConfirmar, setPopupConfirmar] = useState(false);
  const [gpsLoad,        setGpsLoad]        = useState(false);
  const [pagoBITEmpresa, setPagoBITEmpresa] = useState(false);
  const [esPrimeraEmpresa, setEsPrimeraEmpresa] = useState<boolean|null>(null);

  const [provs,     setProvs]     = useState<Prov[]>([]);
  const [ciudades,  setCiudades]  = useState<Ciudad[]>([]);
  const [rubros,    setRubros]    = useState<{id:number;nombre:string}[]>([]);
  const [subrubros, setSubrubros] = useState<{id:number;nombre:string;rubro_id:number}[]>([]);
  const [entRubros,    setEntRubros]    = useState<{id:number;nombre:string}[]>([]);
  const [entSubrubros, setEntSubrubros] = useState<{id:number;nombre:string;rubro_id:number}[]>([]);
  const [sliders,   setSliders]   = useState<{id:string;emoji:string;titulo:string;tipo:string;orden:number}[]>([]);
  const [subFiltros, setSubFiltros] = useState<any[]>([]);
  const [filtroVals, setFiltroVals] = useState<Record<string,any>>({});

  const [form, setForm] = useState({
    titulo:"", descripcion:"", precio:"", moneda:"ARS",
    provincia:"", ciudad:"", direccion:"", whatsapp:"", link_externo:"",
    permuto:false, banner_url:"", avatar_url:"",
    foto1_url:"", foto2_url:"", foto3_url:"",
    tipo_acceso:"libre", tipo_contacto:"datos",
    rubro_id: preRubroId, subrubro_id: preSubrubroId,
    lat:"", lng:"",
  });

  const F = (k:string, v:any) => setForm(f => ({...f, [k]:v}));
  const cargarSubFiltros = async (subId:string) => {
    if (!subId) { setSubFiltros([]); setFiltroVals({}); return; }
    const {data} = await supabase.from("subrubro_filtros").select("*").eq("subrubro_id",parseInt(subId)).in("contexto",["publicacion","ambos"]).order("orden");
    setSubFiltros(data||[]);
    setFiltroVals({});
  };
  const setFV = (nombre:string, val:any) => setFiltroVals(prev=>({...prev,[nombre]:val}));

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data:{ session } }) => {
      if (!session) { router.push("/login"); return; }
      const { data: u } = await supabase.from("usuarios").select("*").eq("id", session.user.id).single();
      setPerfil(u);
      if (u?.whatsapp) setForm(f => ({ ...f, whatsapp: u.whatsapp }));
      // Check if user already had an empresa before
      const { count } = await supabase.from("nexos").select("id", { count: "exact", head: true })
        .eq("usuario_id", session.user.id).eq("tipo", "empresa");
      setEsPrimeraEmpresa((count || 0) === 0);
    });

    Promise.all([
      supabase.from("provincias").select("id,nombre").order("nombre"),
      supabase.from("rubros").select("id,nombre").order("nombre"),
      supabase.from("subrubros").select("id,nombre,rubro_id").order("nombre"),
    ]).then(([{data:p},{data:r},{data:s}]) => {
      if (p) setProvs(p);
      if (r) setRubros(r);
      if (s) setSubrubros(s);
    });

    // Cargar rubros/subrubros específicos por tipo
    const ENT_TABLES: Record<string,{rubros:string;subrubros:string}> = {
      empresa:  {rubros:"empresa_rubros",subrubros:"empresa_subrubros"},
      servicio: {rubros:"servicio_rubros",subrubros:"servicio_subrubros"},
      trabajo:  {rubros:"trabajo_rubros",subrubros:"trabajo_subrubros"},
      grupo:    {rubros:"grupo_categorias",subrubros:"grupo_subcategorias"},
    };
    const ent = ENT_TABLES[tipo];
    if (ent) {
      const subSelect = tipo==="grupo" ? "id,nombre,categoria_id" : "id,nombre,rubro_id";
      Promise.all([
        supabase.from(ent.rubros).select("id,nombre").order("orden",{ascending:true}),
        supabase.from(ent.subrubros).select(subSelect).order("orden",{ascending:true}),
      ]).then(([{data:er},{data:es}]) => {
        if (er) setEntRubros(er);
        if (es) setEntSubrubros(
          (es as any[]).map((s:any)=>({
            id: s.id,
            nombre: s.nombre,
            rubro_id: s.rubro_id ?? s.categoria_id ?? 0,
          }))
        );
      });
    }

    // Pre-cargar filtros si viene subrubro_id por URL
    if (preSubrubroId) cargarSubFiltros(preSubrubroId);

    const inicial = slidersDefault.map((s, i) => {
      const cat = Object.values(SLIDERS_PREDEFINIDOS).flat().find(p => p.tipo === s);
      return { id:s, emoji:cat?.emoji||"📋", titulo:cat?.titulo||s, tipo:s, orden:i };
    });
    setSliders(inicial);
  }, []);

  const cambiarProv = async (nombre:string) => {
    F("provincia", nombre); F("ciudad", "");
    if (!nombre) { setCiudades([]); return; }
    const p = provs.find(x => x.nombre===nombre); if (!p) return;
    const { data } = await supabase.from("ciudades").select("id,nombre,provincia_id").eq("provincia_id",p.id).order("nombre");
    if (data) setCiudades(data);
  };

  const gps = () => {
    if (!navigator.geolocation) return alert("GPS no disponible");
    setGpsLoad(true);
    navigator.geolocation.getCurrentPosition(async pos => {
      try {
        F("lat", String(pos.coords.latitude));
        F("lng", String(pos.coords.longitude));
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&accept-language=es`);
        const d = await r.json();
        const norm = (s:string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
        const pNom = d.address?.state||"";
        const cNom = d.address?.city||d.address?.town||d.address?.village||"";
        const pm = provs.find(p => norm(p.nombre).includes(norm(pNom))||norm(pNom).includes(norm(p.nombre)));
        if (pm) {
          F("provincia", pm.nombre);
          const { data:cd } = await supabase.from("ciudades").select("id,nombre,provincia_id").eq("provincia_id",pm.id).order("nombre");
          if (cd) {
            setCiudades(cd);
            const cm = cd.find((c:any) => norm(c.nombre).includes(norm(cNom))||norm(cNom).includes(norm(c.nombre)));
            if (cm) F("ciudad", cm.nombre);
          }
        }
      } catch { alert("Error al obtener ubicación"); }
      setGpsLoad(false);
    }, () => { alert("No se pudo acceder al GPS"); setGpsLoad(false); });
  };

  const subirImagen = async (e:React.ChangeEvent<HTMLInputElement>, campo:"banner"|"avatar") => {
    const file = e.target.files?.[0];
    if (!file || !perfil) return;
    if (file.size > 5*1024*1024) { alert("Máximo 5MB"); return; }
    setSubiendoImg(campo);
    const ext  = file.name.split(".").pop();
    const path = `anuncios/${perfil.id}/${campo}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("imagenes").upload(path, file, { upsert:true });
    if (error) { alert("Error: " + error.message); setSubiendoImg(null); return; }
    const { data } = supabase.storage.from("imagenes").getPublicUrl(path);
    F(`${campo}_url`, data.publicUrl);
    setSubiendoImg(null);
  };

  const subirImagenAnuncio = async (e:React.ChangeEvent<HTMLInputElement>, campo:string) => {
    const file = e.target.files?.[0];
    if (!file || !perfil) return;
    if (file.size > 5*1024*1024) { alert("Máximo 5MB"); return; }
    setSubiendoImg("avatar");
    const ext  = file.name.split(".").pop();
    const path = `anuncios/${perfil.id}/${campo}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("imagenes").upload(path, file, { upsert:true });
    if (error) { alert("Error: " + error.message); setSubiendoImg(null); return; }
    const { data } = supabase.storage.from("imagenes").getPublicUrl(path);
    F(`${campo}_url`, data.publicUrl);
    setSubiendoImg(null);
  };

  const agregarSlider = (cat:any) => {
    if (sliders.find(s=>s.tipo===cat.tipo)) return;
    setSliders(prev => [...prev, {...cat, orden:prev.length}]);
    setPopupSlider(false);
  };

  const moverSlider = (idx:number, dir:-1|1) => {
    setSliders(prev => {
      const arr = [...prev]; const dest = idx+dir;
      if (dest<0||dest>=arr.length) return arr;
      [arr[idx],arr[dest]] = [arr[dest],arr[idx]];
      return arr.map((s,i) => ({...s, orden:i}));
    });
  };

  const crear = async () => {
    if (!form.titulo.trim()) { alert("Escribí un título"); return; }
    if (!perfil) { alert("Sesión no válida"); return; }

    setGuardando(true);
    try {
      const payload: any = {
        usuario_id:   perfil.id,
        tipo,
        subtipo:      subtipo||null,
        titulo:       form.titulo,
        descripcion:  form.descripcion||null,
        ciudad:       form.ciudad||null,
        provincia:    form.provincia||null,
        direccion:    form.direccion||null,
        whatsapp:     form.whatsapp||null,
        link_externo: form.link_externo||null,
        banner_url:   form.banner_url||null,
        avatar_url:   form.avatar_url||null,
        estado:       "activo",
        config:       { tipo_acceso:form.tipo_acceso, permuto:form.permuto, tipo_contacto:form.tipo_contacto },
      };
      if (form.precio)      payload.precio      = parseFloat(form.precio);
      if (form.moneda)      payload.moneda      = form.moneda;
      if (form.lat)         payload.lat         = parseFloat(form.lat);
      if (form.lng)         payload.lng         = parseFloat(form.lng);
      if (form.subrubro_id) payload.subrubro_id = parseInt(form.subrubro_id);

      // Guardar filtros dinámicos
      const filtrosLimpios: Record<string,any> = {};
      for (const [k,v] of Object.entries(filtroVals)) {
        if (v!=null && v!=="" && !(typeof v==="object" && !v.desde && !v.hasta)) filtrosLimpios[k] = v;
      }
      if (Object.keys(filtrosLimpios).length > 0) {
        if (tipo==="anuncio"||tipo==="trabajo") {
          payload.filtros = filtrosLimpios;
        } else {
          payload.config = { ...payload.config, filtros: filtrosLimpios };
        }
      }

      if (tipo==="empresa") {
        const en30dias = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        payload.trial_hasta = esPrimeraEmpresa ? en30dias : null;
        payload.siguiente_pago = en30dias;
        payload.plan_mensual_bits = 10000;
      }

      if (tipo==="anuncio"||tipo==="trabajo") {
        const imgs = [form.foto1_url, form.foto2_url, form.foto3_url].filter(Boolean);
        if (imgs.length > 0) { payload.imagenes = imgs; payload.avatar_url = imgs[0]; }
        delete payload.banner_url;
      }

      const tabla = tipo==="anuncio" ? "anuncios" : "nexos";
      const { data: nexo, error } = await supabase.from(tabla).insert(payload).select().single();
      if (error) { console.error(error); alert(`Error al crear: ${error.message}`); setGuardando(false); return; }

      if (sliders.length > 0) {
        await supabase.from("nexo_sliders").insert(
          sliders.map(s => ({ nexo_id:nexo.id, titulo:s.titulo, tipo:s.tipo, orden:s.orden, activo:true }))
        );
      }
      if (tipo==="grupo") {
        await supabase.from("nexo_miembros").insert({ nexo_id:nexo.id, usuario_id:perfil.id, rol:"creador", estado:"activo" });
      }

      if (tipo==="empresa")        window.location.href = "/mis-anuncios";
      else if (tipo==="anuncio")   window.location.href = `/anuncios/${nexo.id}`;
      else                         router.push(`/nexo/${nexo.id}`);

    } catch(e:any) {
      alert("Error al crear: " + (e?.message||"Intentá de nuevo"));
      setGuardando(false);
    }
  };

  const subsDe = form.rubro_id ? subrubros.filter(s => s.rubro_id===parseInt(form.rubro_id)) : [];

  if (!perfil) return (
    <main style={{paddingTop:"95px",textAlign:"center",color:"#9a9a9a",fontFamily:"'Nunito',sans-serif",background:"#f4f4f2",minHeight:"100vh",padding:"60px"}}>
      Cargando...
    </main>
  );

  // ── SIN SLIDERS: anuncio / trabajo ───────────────────────────────────────
  if (!usaSliders) {
    return (
      <main style={{paddingTop:"105px",paddingBottom:"130px",background:"#f4f4f2",minHeight:"100vh",fontFamily:"'Nunito',sans-serif"}}>
        <Header/>
        <div style={{background:`linear-gradient(135deg,${colorPage}dd,${colorPage})`,padding:"12px 16px",display:"flex",alignItems:"center"}}>
          <button onClick={()=>router.push("/publicar")} style={{background:"rgba(255,255,255,0.2)",border:"1px solid rgba(255,255,255,0.3)",borderRadius:"10px",padding:"8px 14px",color:"#fff",fontSize:"13px",fontWeight:700,cursor:"pointer",fontFamily:"'Nunito',sans-serif",flexShrink:0,whiteSpace:"nowrap"}}>← Volver</button>
          <div style={{flex:1,textAlign:"center",fontFamily:"'Bebas Neue',sans-serif",fontSize:"20px",color:"#fff",letterSpacing:"1px"}}>{emojiPage} {tituloPage}</div>
          <div style={{width:"68px",flexShrink:0}}/>
        </div>

        <div style={{padding:"16px",display:"flex",flexDirection:"column",gap:"14px",maxWidth:"500px",margin:"0 auto"}}>

          {tipo==="anuncio" && (
            <div style={CAJA}>
              <SL>📂 Categoría</SL>
              {preRubroId ? (
                <div style={{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap"}}>
                  <span style={{background:`${colorPage}18`,border:`1px solid ${colorPage}40`,borderRadius:"20px",padding:"6px 14px",fontSize:"12px",fontWeight:800,color:colorPage}}>
                    {rubros.find(r=>String(r.id)===form.rubro_id)?.nombre || `Rubro #${form.rubro_id}`}
                    {form.subrubro_id && ` → ${subsDe.find(s=>String(s.id)===form.subrubro_id)?.nombre || form.subrubro_id}`}
                  </span>
                  <button onClick={()=>{F("rubro_id","");F("subrubro_id","");}} style={{background:"none",border:"none",fontSize:"11px",fontWeight:700,color:"#9a9a9a",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>cambiar</button>
                </div>
              ) : (<>
                <L>Rubro</L>
                <select value={form.rubro_id} onChange={e=>{F("rubro_id",e.target.value);F("subrubro_id","");}} style={{...IS,marginBottom:"12px"}}>
                  <option value="">— Elegí un rubro —</option>
                  {rubros.map(r=><option key={r.id} value={r.id}>{r.nombre}</option>)}
                </select>
                {form.rubro_id && subsDe.length>0 && (<>
                  <L>Subrubro</L>
                  <select value={form.subrubro_id} onChange={e=>{F("subrubro_id",e.target.value);cargarSubFiltros(e.target.value);}} style={{...IS,marginBottom:"0"}}>
                    <option value="">— Todos —</option>
                    {subsDe.map(s=><option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                </>)}
              </>)}
            </div>
          )}

          {tipo==="trabajo" && entRubros.length>0 && (
            <div style={CAJA}>
              <SL>📂 Categoría</SL>
              {preRubroId ? (
                <div style={{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap"}}>
                  <span style={{background:`${colorPage}18`,border:`1px solid ${colorPage}40`,borderRadius:"20px",padding:"6px 14px",fontSize:"12px",fontWeight:800,color:colorPage}}>
                    {entRubros.find(r=>String(r.id)===form.rubro_id)?.nombre || `Rubro #${form.rubro_id}`}
                    {form.subrubro_id && ` → ${entSubrubros.find(s=>String(s.id)===form.subrubro_id)?.nombre || form.subrubro_id}`}
                  </span>
                  <button onClick={()=>router.push("/publicar")} style={{background:"none",border:"none",fontSize:"11px",fontWeight:700,color:"#9a9a9a",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>cambiar</button>
                </div>
              ) : (<>
                <L>Rubro</L>
                <select value={form.rubro_id} onChange={e=>{F("rubro_id",e.target.value);F("subrubro_id","");setSubFiltros([]);setFiltroVals({});}} style={{...IS,marginBottom:"12px"}}>
                  <option value="">— Elegí un rubro —</option>
                  {entRubros.map(r=><option key={r.id} value={r.id}>{r.nombre}</option>)}
                </select>
                {form.rubro_id && entSubrubros.filter(s=>s.rubro_id===parseInt(form.rubro_id)).length>0 && (<>
                  <L>Subrubro</L>
                  <select value={form.subrubro_id} onChange={e=>{F("subrubro_id",e.target.value);cargarSubFiltros(e.target.value);}} style={{...IS,marginBottom:"0"}}>
                    <option value="">— Todos —</option>
                    {entSubrubros.filter(s=>s.rubro_id===parseInt(form.rubro_id)).map(s=><option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                </>)}
              </>)}
            </div>
          )}

          {/* ── Filtros dinámicos de subcategoría ── */}
          {subFiltros.length>0 && (
            <div style={CAJA}>
              <SL>🔧 Detalles adicionales</SL>
              <div style={{fontSize:"11px",color:"#9a9a9a",fontWeight:600,marginBottom:"12px"}}>Completá los campos que apliquen a tu publicación</div>
              {subFiltros.map((f:any)=>(
                <div key={f.id} style={{marginBottom:"12px"}}>
                  {f.tipo==="boolean" && (<>
                    <L>{f.nombre}</L>
                    <div style={{display:"flex",gap:"8px"}}>
                      {[{v:true,l:"Sí"},{v:false,l:"No"}].map(op=>(
                        <button key={String(op.v)} onClick={()=>setFV(f.nombre,op.v)}
                          style={{flex:1,background:filtroVals[f.nombre]===op.v?"#1a2a3a":"#f4f4f2",border:`2px solid ${filtroVals[f.nombre]===op.v?"#1a2a3a":"#e8e8e6"}`,borderRadius:"10px",padding:"8px",fontSize:"12px",fontWeight:800,color:filtroVals[f.nombre]===op.v?colorPage:"#666",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>
                          {op.l}
                        </button>
                      ))}
                    </div>
                  </>)}
                  {f.tipo==="numero" && (<>
                    <L>{f.nombre}</L>
                    <input type="number" value={filtroVals[f.nombre]||""} onChange={e=>setFV(f.nombre,e.target.value)} placeholder={f.nombre} style={IS}/>
                  </>)}
                  {f.tipo==="rango" && (<>
                    <L>{f.nombre}</L>
                    <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
                      <input type="number" value={filtroVals[f.nombre]?.desde||""} onChange={e=>setFV(f.nombre,{...filtroVals[f.nombre],desde:e.target.value})} placeholder="Desde" style={{...IS,flex:1}}/>
                      <span style={{color:"#9a9a9a",fontWeight:800}}>—</span>
                      <input type="number" value={filtroVals[f.nombre]?.hasta||""} onChange={e=>setFV(f.nombre,{...filtroVals[f.nombre],hasta:e.target.value})} placeholder="Hasta" style={{...IS,flex:1}}/>
                    </div>
                  </>)}
                  {f.tipo==="texto" && (<>
                    <L>{f.nombre}</L>
                    <input value={filtroVals[f.nombre]||""} onChange={e=>setFV(f.nombre,e.target.value)} placeholder={f.nombre} style={IS}/>
                  </>)}
                  {f.tipo==="opciones" && (<>
                    <L>{f.nombre}</L>
                    <select value={filtroVals[f.nombre]||""} onChange={e=>setFV(f.nombre,e.target.value)} style={IS}>
                      <option value="">— Seleccionar —</option>
                      {(Array.isArray(f.opciones)?f.opciones:[]).map((op:string)=><option key={op} value={op}>{op}</option>)}
                    </select>
                  </>)}
                  {f.tipo==="moneda" && (<>
                    <L>{f.nombre}</L>
                    <select value={filtroVals[f.nombre]||""} onChange={e=>setFV(f.nombre,e.target.value)} style={IS}>
                      <option value="">— Seleccionar —</option>
                      <option value="ARS">$ ARS</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </>)}
                </div>
              ))}
            </div>
          )}

          <div style={CAJA}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
              <SL style={{margin:0}}>📍 Ubicación</SL>
              <button onClick={gps} disabled={gpsLoad} style={{background:`${colorPage}18`,border:`2px solid ${colorPage}40`,borderRadius:"10px",padding:"6px 12px",fontSize:"12px",fontWeight:800,color:colorPage,cursor:gpsLoad?"wait":"pointer",fontFamily:"'Nunito',sans-serif",display:"flex",alignItems:"center",gap:"5px",opacity:gpsLoad?0.6:1}}>
                {gpsLoad?"⏳ Buscando...":"📍 Usar mi ubicación"}
              </button>
            </div>
            <L>Provincia</L>
            <select value={form.provincia} onChange={e=>cambiarProv(e.target.value)} style={{...IS,marginBottom:"12px"}}>
              <option value="">— Elegí una provincia —</option>
              {provs.map(p=><option key={p.id} value={p.nombre}>{p.nombre}</option>)}
            </select>
            {form.provincia && (<>
              <L>Ciudad</L>
              <select value={form.ciudad} onChange={e=>F("ciudad",e.target.value)} style={{...IS,marginBottom:"12px"}}>
                <option value="">— Elegí una ciudad —</option>
                {ciudades.map(c=><option key={c.id} value={c.nombre}>{c.nombre}</option>)}
              </select>
            </>)}
            <L>Dirección (opcional)</L>
            <input value={form.direccion} onChange={e=>F("direccion",e.target.value)} placeholder="Ej: San Martín 1234, local 3" style={{...IS,marginBottom:"0"}}/>
            {form.lat && <div style={{marginTop:"8px",fontSize:"11px",color:"#27ae60",fontWeight:700}}>✅ Ubicación GPS detectada</div>}
          </div>

          <div style={CAJA}>
            <SL>📝 Información</SL>
            <L>Título *</L>
            <input value={form.titulo} onChange={e=>F("titulo",e.target.value)}
              placeholder={tipo==="trabajo"?"Ej: Diseñador gráfico disponible":"Ej: Bicicleta rodado 26 impecable"} style={IS}/>
            <L>Descripción</L>
            <textarea value={form.descripcion} onChange={e=>F("descripcion",e.target.value)} placeholder="Describí en detalle..." rows={4} style={{...IS,resize:"vertical" as any}}/>
            {tipo==="anuncio" && (<>
              <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:"10px",marginTop:"4px"}}>
                <div><L>Precio</L><input type="number" value={form.precio} onChange={e=>F("precio",e.target.value)} placeholder="0" style={IS}/></div>
                <div><L>Moneda</L>
                  <select value={form.moneda} onChange={e=>F("moneda",e.target.value)} style={{...IS,padding:"11px 10px"}}>
                    <option value="ARS">ARS $</option>
                    <option value="USD">USD U$S</option>
                  </select>
                </div>
              </div>
              <label style={{display:"flex",alignItems:"center",gap:"10px",cursor:"pointer",padding:"8px 0"}}>
                <input type="checkbox" checked={form.permuto} onChange={e=>F("permuto",e.target.checked)} style={{width:"18px",height:"18px",accentColor:colorPage}}/>
                <span style={{fontSize:"13px",fontWeight:700,color:"#1a2a3a"}}>🔄 Acepto permuta</span>
              </label>
            </>)}
            <L>WhatsApp</L>
            <input value={form.whatsapp} onChange={e=>F("whatsapp",e.target.value)} placeholder="Ej: 3412345678" style={{...IS,marginBottom:"12px"}}/>
            <SL>📬 Tipo de contacto</SL>
            {[
              {v:"datos",e:"📋",l:"Mostrar mis datos",d:"El comprador ve tu WhatsApp y puede conectarse"},
              {v:"chat", e:"💬",l:"Solo chat interno",d:"Nadie ve tu WhatsApp — solo pueden escribirte por chat"},
            ].map(o=>(
              <div key={o.v} onClick={()=>F("tipo_contacto",o.v)}
                style={{display:"flex",gap:"12px",alignItems:"center",padding:"12px 14px",borderRadius:"12px",border:`2px solid ${form.tipo_contacto===o.v?colorPage:"#e8e8e6"}`,background:form.tipo_contacto===o.v?`${colorPage}08`:"#fafafa",cursor:"pointer",marginBottom:"8px"}}>
                <span style={{fontSize:"22px"}}>{o.e}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:"13px",fontWeight:900,color:form.tipo_contacto===o.v?colorPage:"#1a2a3a"}}>{o.l}</div>
                  <div style={{fontSize:"11px",color:"#9a9a9a",fontWeight:600}}>{o.d}</div>
                </div>
                {form.tipo_contacto===o.v&&<span style={{color:colorPage,fontSize:"18px"}}>✓</span>}
              </div>
            ))}
          </div>

          <div style={CAJA}>
            <SL>📷 Fotos del producto</SL>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px"}}>
              {["foto1","foto2","foto3"].map((campo,i) => (
                <label key={campo} style={{cursor:"pointer"}}>
                  <div style={{height:"80px",background:"#f4f4f2",borderRadius:"12px",border:`2px dashed ${(form as any)[campo+"_url"]?"#d4a017":"rgba(212,160,23,0.3)"}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"4px",overflow:"hidden",position:"relative"}}>
                    {(form as any)[campo+"_url"]
                      ? <><img src={(form as any)[campo+"_url"]} style={{width:"100%",height:"100%",objectFit:"cover"}}/><div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px"}}>📷</div></>
                      : <><span style={{fontSize:"22px"}}>📷</span><span style={{fontSize:"9px",fontWeight:700,color:"#9a9a9a"}}>Foto {i+1}</span></>
                    }
                  </div>
                  <input type="file" accept="image/*" onChange={e=>subirImagenAnuncio(e,campo)} style={{display:"none"}}/>
                </label>
              ))}
            </div>
            {subiendoImg && <div style={{textAlign:"center",fontSize:"12px",color:"#9a9a9a",marginTop:"8px"}}>⏳ Subiendo imagen...</div>}
          </div>

          <button
            onClick={() => {
              if ((tipo==="anuncio"||tipo==="trabajo") && perfil?.plan !== "nexoempresa") {
                const totalBits = (perfil?.bits_free||0) + (perfil?.bits||0);
                if (totalBits < 500) { alert(`Necesitás 500 BIT para publicar. Tenés ${totalBits} BIT disponibles.`); return; }
                setPopupConfirmar(true);
              } else { crear(); }
            }}
            disabled={guardando||!form.titulo.trim()}
            style={{width:"100%",background:guardando||!form.titulo.trim()?`${colorPage}50`:`linear-gradient(135deg,${colorPage}cc,${colorPage})`,border:"none",borderRadius:"14px",padding:"16px",fontSize:"16px",fontWeight:900,color:"#fff",cursor:guardando||!form.titulo.trim()?"not-allowed":"pointer",fontFamily:"'Nunito',sans-serif",boxShadow:guardando||!form.titulo.trim()?"none":`0 4px 0 ${colorPage}88`}}>
            {guardando ? "⏳ Creando..." : tipo==="trabajo" ? "✅ Publicar búsqueda de trabajo" : "✅ Publicar anuncio"}
          </button>
        </div>
        <AyudaPopup tipo={tipo as any}/>
        <BottomNav/>

        {popupConfirmar && (
          <PopupCompra
            titulo="📣 Publicar anuncio" emoji="📣" costo="500 BIT"
            descripcion="Publicá tu anuncio en NexoNet"
            bits={{ free: Math.max(0,perfil?.bits_free||0), nexo: Math.max(0,perfil?.bits||0), promo: Math.max(0,perfil?.bits_promo||0) }}
            onClose={() => setPopupConfirmar(false)}
            onPagar={async (metodo: MetodoPago) => {
              if (metodo === "bit_free") {
                if ((perfil?.bits_free||0) < 500) { alert("No tenés suficientes BIT FREE."); return; }
                await supabase.from("usuarios").update({ bits_free: perfil.bits_free - 500 }).eq("id", perfil.id);
                setPerfil((p:any) => ({...p, bits_free: p.bits_free - 500}));
              } else if (metodo === "bit_nexo") {
                if ((perfil?.bits||0) < 500) { alert("No tenés suficientes BIT Nexo."); return; }
                await supabase.from("usuarios").update({ bits: perfil.bits - 500 }).eq("id", perfil.id);
                setPerfil((p:any) => ({...p, bits: p.bits - 500}));
              } else { alert("Próximamente — pagos con tarjeta/transferencia"); return; }
              setPopupConfirmar(false);
              crear();
            }}
          />
        )}
      </main>
    );
  }

  // ── CON SLIDERS: grupo / empresa / servicio ───────────────────────────────
  return (
    <main style={{paddingTop:"0px",paddingBottom:"100px",background:"#f4f4f2",minHeight:"100vh",fontFamily:"'Nunito',sans-serif"}}>
      <Header/>

      {/* HERO */}
      <div style={{background:form.banner_url?`url(${form.banner_url}) center/cover no-repeat`:"linear-gradient(135deg,#1a2a3a,#243b55)",minHeight:"160px",position:"relative",marginTop:"95px"}}>
        {form.banner_url && <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.5)"}}/>}
        <div style={{position:"relative",zIndex:1,padding:"14px 16px 20px"}}>
          <button onClick={()=>router.push("/publicar")} style={{background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.25)",borderRadius:"10px",padding:"7px 14px",color:"#fff",fontSize:"13px",fontWeight:700,cursor:"pointer",fontFamily:"'Nunito',sans-serif",marginBottom:"14px"}}>
            ← Volver
          </button>
          <div style={{display:"flex",alignItems:"center",gap:"14px"}}>
            <div style={{position:"relative"}}>
              <div style={{width:"64px",height:"64px",borderRadius:"16px",background:`${colorPage}22`,border:`3px solid ${colorPage}60`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"28px",overflow:"hidden"}}>
                {form.avatar_url?<img src={form.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span>{emojiPage}</span>}
              </div>
              <label style={{position:"absolute",bottom:"-6px",right:"-6px",width:"24px",height:"24px",borderRadius:"50%",background:colorPage,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",border:"2px solid #1a2a3a",fontSize:"11px"}}>
                {subiendoImg==="avatar"?"⏳":"📷"}
                <input type="file" accept="image/*" onChange={e=>subirImagen(e,"avatar")} style={{display:"none"}}/>
              </label>
            </div>
            <div style={{flex:1}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"22px",color:colorPage,letterSpacing:"1px"}}>{tituloPage}</div>
              <div style={{fontSize:"11px",color:"rgba(255,255,255,0.5)",fontWeight:600}}>{form.titulo||"Escribí el nombre..."}</div>
            </div>
            <label style={{background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:"10px",padding:"8px 12px",color:"rgba(255,255,255,0.7)",fontSize:"11px",fontWeight:700,cursor:"pointer",textAlign:"center" as const}}>
              {subiendoImg==="banner"?"⏳":"🖼️ Banner"}
              <input type="file" accept="image/*" onChange={e=>subirImagen(e,"banner")} style={{display:"none"}}/>
            </label>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{background:"#fff",borderBottom:"2px solid #f0f0f0",padding:"0 16px",display:"flex"}}>
        {[["1","Información"],["2","Páginas"],["3","Acceso"]].map(([n,l])=>(
          <button key={n} onClick={()=>setPaso(parseInt(n))}
            style={{flex:1,background:"none",border:"none",borderBottom:paso===parseInt(n)?`3px solid ${colorPage}`:"3px solid transparent",padding:"12px 4px",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>
            <div style={{fontSize:"10px",fontWeight:800,color:paso===parseInt(n)?colorPage:"#9a9a9a",textTransform:"uppercase" as const,letterSpacing:"0.5px"}}>{n}. {l}</div>
          </button>
        ))}
      </div>

      <div style={{padding:"16px",maxWidth:"500px",margin:"0 auto"}}>

        {/* PASO 1: INFORMACIÓN */}
        {paso===1 && (
          <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>

            {tipo==="empresa" && !pagoBITEmpresa && esPrimeraEmpresa === true && (
              <div style={{background:"linear-gradient(135deg,#1a3a2a,#204a30)",borderRadius:"16px",padding:"20px",border:"2px solid rgba(39,174,96,0.4)"}}>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"20px",color:"#27ae60",letterSpacing:"1px",marginBottom:"8px"}}>🏢 ¡Tu primera empresa es GRATIS!</div>
                <div style={{fontSize:"13px",color:"#8abba0",fontWeight:600,lineHeight:1.6,marginBottom:"16px"}}>
                  Tenés <strong style={{color:"#27ae60"}}>30 días gratis</strong> para probar tu perfil empresarial. Después del trial, el plan cuesta 10.000 BIT/mes.
                </div>
                <button onClick={() => {
                  setPagoBITEmpresa(true);
                }} style={{width:"100%",background:"linear-gradient(135deg,#27ae60,#1e8449)",border:"none",borderRadius:"12px",padding:"14px",fontSize:"15px",fontWeight:900,color:"#fff",cursor:"pointer",fontFamily:"'Nunito',sans-serif",boxShadow:"0 4px 0 rgba(0,0,0,0.3)"}}>
                  🎉 Activar 30 días gratis
                </button>
              </div>
            )}

            {tipo==="empresa" && !pagoBITEmpresa && esPrimeraEmpresa === false && (
              <div style={{background:"linear-gradient(135deg,#2c1a1a,#4a2020)",borderRadius:"16px",padding:"20px",border:"2px solid rgba(192,57,43,0.4)"}}>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"20px",color:"#e74c3c",letterSpacing:"1px",marginBottom:"8px"}}>🏢 Nexo Empresa</div>
                <div style={{fontSize:"13px",color:"#e88a8a",fontWeight:600,lineHeight:1.6,marginBottom:"16px"}}>
                  Para crear tu perfil empresarial necesitás abonar el plan Empresa.
                </div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(0,0,0,0.2)",borderRadius:"12px",padding:"12px 16px",marginBottom:"16px"}}>
                  <span style={{fontSize:"13px",fontWeight:700,color:"#e88a8a"}}>Costo del plan</span>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"28px",color:"#e74c3c"}}>10.000</div>
                    <div style={{fontSize:"10px",color:"#e88a8a",fontWeight:700}}>BIT / mes</div>
                  </div>
                </div>
                <button onClick={async () => {
                  const bitsTotal = Math.max(0,perfil?.bits||0)+Math.max(0,perfil?.bits_free||0)+Math.max(0,perfil?.bits_promo||0);
                  if (bitsTotal < 10000) { alert("Necesitás 10.000 BIT. Cargá BIT desde la tienda."); return; }
                  const campo = (perfil?.bits_free||0)>=10000?"bits_free":(perfil?.bits_promo||0)>=10000?"bits_promo":"bits";
                  const valor = campo==="bits_free"?perfil.bits_free:campo==="bits_promo"?perfil.bits_promo:perfil.bits;
                  await supabase.from("usuarios").update({[campo]:valor-10000,plan:"nexoempresa"}).eq("id",perfil.id);
                  setPerfil((p:any)=>({...p,[campo]:valor-10000,plan:"nexoempresa"}));
                  setPagoBITEmpresa(true);
                }} style={{width:"100%",background:"linear-gradient(135deg,#c0392b,#e74c3c)",border:"none",borderRadius:"12px",padding:"14px",fontSize:"15px",fontWeight:900,color:"#fff",cursor:"pointer",fontFamily:"'Nunito',sans-serif",boxShadow:"0 4px 0 rgba(0,0,0,0.3)"}}>
                  💳 Pagar 10.000 BIT y activar Empresa
                </button>
              </div>
            )}

            {tipo==="empresa" && pagoBITEmpresa && (
              <div style={{background:"rgba(39,174,96,0.1)",border:"2px solid rgba(39,174,96,0.3)",borderRadius:"12px",padding:"12px 16px",display:"flex",alignItems:"center",gap:"10px"}}>
                <span style={{fontSize:"20px"}}>✅</span>
                <div style={{fontSize:"13px",fontWeight:800,color:"#27ae60"}}>{esPrimeraEmpresa ? "Trial 30 días activado — ¡creá tu empresa!" : "Plan Empresa activado"}</div>
              </div>
            )}

            <div style={{...CAJA, opacity:tipo==="empresa"&&!pagoBITEmpresa?0.4:1, pointerEvents:tipo==="empresa"&&!pagoBITEmpresa?"none" as any:"auto"}}>
              <SL>📝 Información básica</SL>
              <L>Nombre / Título *</L>
              <input value={form.titulo} onChange={e=>F("titulo",e.target.value)}
                placeholder={tipo==="servicio"?"Ej: Plomería y gas — reparaciones urgentes":tipo==="grupo"?"Ej: Emprendedores Rosario":"Ej: Ferretería San Martín"}
                style={{...IS,marginBottom:"12px"}}/>
              <L>Descripción</L>
              <textarea value={form.descripcion} onChange={e=>F("descripcion",e.target.value)}
                placeholder="Describí en detalle..." rows={3} style={{...IS,resize:"vertical" as any,marginBottom:"12px"}}/>
              {entRubros.length > 0 && (
                <>
                  <SL>📂 Categoría</SL>
                  {preRubroId ? (
                    <div style={{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap",marginBottom:"12px"}}>
                      <span style={{background:`${colorPage}18`,border:`1px solid ${colorPage}40`,borderRadius:"20px",padding:"6px 14px",fontSize:"12px",fontWeight:800,color:colorPage}}>
                        {entRubros.find(r=>String(r.id)===form.rubro_id)?.nombre || `Rubro #${form.rubro_id}`}
                        {form.subrubro_id && ` → ${entSubrubros.find(s=>String(s.id)===form.subrubro_id)?.nombre || form.subrubro_id}`}
                      </span>
                      <button onClick={()=>router.push("/publicar")} style={{background:"none",border:"none",fontSize:"11px",fontWeight:700,color:"#9a9a9a",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>cambiar</button>
                    </div>
                  ) : (
                    <>
                      <L>Rubro</L>
                      <select value={form.rubro_id} onChange={e=>{F("rubro_id",e.target.value);F("subrubro_id","");setSubFiltros([]);setFiltroVals({});}} style={{...IS,marginBottom:"12px"}}>
                        <option value="">— Elegí un rubro —</option>
                        {entRubros.map(r=><option key={r.id} value={r.id}>{r.nombre}</option>)}
                      </select>
                      {form.rubro_id && entSubrubros.filter(s=>s.rubro_id===parseInt(form.rubro_id)).length > 0 && (
                        <>
                          <L>Subrubro</L>
                          <select value={form.subrubro_id} onChange={e=>{F("subrubro_id",e.target.value);cargarSubFiltros(e.target.value);}} style={{...IS,marginBottom:"12px"}}>
                            <option value="">— Todos —</option>
                            {entSubrubros.filter(s=>s.rubro_id===parseInt(form.rubro_id)).map(s=><option key={s.id} value={s.id}>{s.nombre}</option>)}
                          </select>
                        </>
                      )}
                    </>
                  )}
                </>
              )}
              {/* Filtros dinámicos de subcategoría (sliders block) */}
              {subFiltros.length>0 && (<>
                <SL>🔧 Detalles adicionales</SL>
                <div style={{fontSize:"11px",color:"#9a9a9a",fontWeight:600,marginBottom:"12px"}}>Completá los campos que apliquen</div>
                {subFiltros.map((f:any)=>(
                  <div key={f.id} style={{marginBottom:"12px"}}>
                    {f.tipo==="boolean" && (<><L>{f.nombre}</L><div style={{display:"flex",gap:"8px"}}>{[{v:true,l:"Sí"},{v:false,l:"No"}].map(op=>(<button key={String(op.v)} onClick={()=>setFV(f.nombre,op.v)} style={{flex:1,background:filtroVals[f.nombre]===op.v?"#1a2a3a":"#f4f4f2",border:`2px solid ${filtroVals[f.nombre]===op.v?"#1a2a3a":"#e8e8e6"}`,borderRadius:"10px",padding:"8px",fontSize:"12px",fontWeight:800,color:filtroVals[f.nombre]===op.v?colorPage:"#666",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>{op.l}</button>))}</div></>)}
                    {f.tipo==="numero" && (<><L>{f.nombre}</L><input type="number" value={filtroVals[f.nombre]||""} onChange={e=>setFV(f.nombre,e.target.value)} placeholder={f.nombre} style={IS}/></>)}
                    {f.tipo==="rango" && (<><L>{f.nombre}</L><div style={{display:"flex",gap:"8px",alignItems:"center"}}><input type="number" value={filtroVals[f.nombre]?.desde||""} onChange={e=>setFV(f.nombre,{...filtroVals[f.nombre],desde:e.target.value})} placeholder="Desde" style={{...IS,flex:1}}/><span style={{color:"#9a9a9a",fontWeight:800}}>—</span><input type="number" value={filtroVals[f.nombre]?.hasta||""} onChange={e=>setFV(f.nombre,{...filtroVals[f.nombre],hasta:e.target.value})} placeholder="Hasta" style={{...IS,flex:1}}/></div></>)}
                    {f.tipo==="texto" && (<><L>{f.nombre}</L><input value={filtroVals[f.nombre]||""} onChange={e=>setFV(f.nombre,e.target.value)} placeholder={f.nombre} style={IS}/></>)}
                    {f.tipo==="opciones" && (<><L>{f.nombre}</L><select value={filtroVals[f.nombre]||""} onChange={e=>setFV(f.nombre,e.target.value)} style={IS}><option value="">— Seleccionar —</option>{(Array.isArray(f.opciones)?f.opciones:[]).map((op:string)=><option key={op} value={op}>{op}</option>)}</select></>)}
                    {f.tipo==="moneda" && (<><L>{f.nombre}</L><select value={filtroVals[f.nombre]||""} onChange={e=>setFV(f.nombre,e.target.value)} style={IS}><option value="">— Seleccionar —</option><option value="ARS">$ ARS</option><option value="USD">USD</option><option value="EUR">EUR</option></select></>)}
                  </div>
                ))}
              </>)}
              {(tipo==="empresa"||tipo==="servicio") && (<>
                <SL>📷 Imágenes</SL>
                <div style={{display:"flex",gap:"12px",marginBottom:"12px"}}>
                  <label style={{cursor:"pointer",flex:1}}>
                    <div style={{height:"80px",background:"#f4f4f2",borderRadius:"12px",border:`2px dashed ${form.avatar_url?colorPage:"rgba(0,0,0,0.15)"}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"4px",overflow:"hidden",position:"relative"}}>
                      {form.avatar_url
                        ? <><img src={form.avatar_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/><div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px",color:"#fff",fontWeight:900}}>📷</div></>
                        : <><span style={{fontSize:"22px"}}>📷</span><span style={{fontSize:"9px",fontWeight:700,color:"#9a9a9a"}}>Logo / Avatar</span></>
                      }
                    </div>
                    <input type="file" accept="image/*" onChange={e=>subirImagen(e,"avatar")} style={{display:"none"}}/>
                  </label>
                  <label style={{cursor:"pointer",flex:2}}>
                    <div style={{height:"80px",background:"#f4f4f2",borderRadius:"12px",border:`2px dashed ${form.banner_url?colorPage:"rgba(0,0,0,0.15)"}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"4px",overflow:"hidden",position:"relative"}}>
                      {form.banner_url
                        ? <><img src={form.banner_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/><div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px",color:"#fff",fontWeight:900}}>🖼️</div></>
                        : <><span style={{fontSize:"22px"}}>🖼️</span><span style={{fontSize:"9px",fontWeight:700,color:"#9a9a9a"}}>Banner / Portada</span></>
                      }
                    </div>
                    <input type="file" accept="image/*" onChange={e=>subirImagen(e,"banner")} style={{display:"none"}}/>
                  </label>
                </div>
                {subiendoImg && <div style={{textAlign:"center",fontSize:"12px",color:"#9a9a9a",marginBottom:"8px"}}>⏳ Subiendo imagen...</div>}
                <L>Link externo (opcional)</L>
                <input value={form.link_externo} onChange={e=>F("link_externo",e.target.value)} placeholder="https://..." style={{...IS,marginBottom:"12px"}}/>
              </>)}
            </div>

            <div style={{...CAJA, opacity:tipo==="empresa"&&!pagoBITEmpresa?0.4:1, pointerEvents:tipo==="empresa"&&!pagoBITEmpresa?"none" as any:"auto"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
                <SL style={{margin:0}}>📍 Ubicación</SL>
                <button onClick={gps} disabled={gpsLoad} style={{background:`${colorPage}18`,border:`2px solid ${colorPage}40`,borderRadius:"10px",padding:"6px 12px",fontSize:"12px",fontWeight:800,color:colorPage,cursor:gpsLoad?"wait":"pointer",fontFamily:"'Nunito',sans-serif",opacity:gpsLoad?0.6:1}}>
                  {gpsLoad?"⏳":"📍 Mi ubicación"}
                </button>
              </div>
              <L>Provincia</L>
              <select value={form.provincia} onChange={e=>cambiarProv(e.target.value)} style={{...IS,marginBottom:"12px"}}>
                <option value="">— Elegí una provincia —</option>
                {provs.map(p=><option key={p.id} value={p.nombre}>{p.nombre}</option>)}
              </select>
              {form.provincia && (<>
                <L>Ciudad</L>
                <select value={form.ciudad} onChange={e=>F("ciudad",e.target.value)} style={{...IS,marginBottom:"12px"}}>
                  <option value="">— Elegí una ciudad —</option>
                  {ciudades.map(c=><option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                </select>
              </>)}
              <L>Dirección {tipo==="empresa"?"del local":"(opcional)"}</L>
              <input value={form.direccion} onChange={e=>F("direccion",e.target.value)} placeholder="Ej: San Martín 1234, local 3" style={{...IS,marginBottom:"0"}}/>
              {form.lat && <div style={{marginTop:"8px",fontSize:"11px",color:"#27ae60",fontWeight:700}}>✅ Ubicación GPS detectada</div>}
            </div>

            <div style={{...CAJA, opacity:tipo==="empresa"&&!pagoBITEmpresa?0.4:1, pointerEvents:tipo==="empresa"&&!pagoBITEmpresa?"none" as any:"auto"}}>
              <SL>📱 Contacto</SL>
              <L>WhatsApp</L>
              <input value={form.whatsapp} onChange={e=>F("whatsapp",e.target.value)} placeholder="Ej: 3412345678" style={IS}/>
            </div>

            <button onClick={()=>setPaso(2)} disabled={!form.titulo.trim()} style={{...BTN(colorPage),opacity:form.titulo.trim()?1:0.5}}>
              Siguiente → Páginas
            </button>
          </div>
        )}

        {/* PASO 2: PÁGINAS */}
        {paso===2 && (
          <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
            <div style={{background:"rgba(58,123,213,0.08)",border:"2px dashed rgba(58,123,213,0.3)",borderRadius:"14px",padding:"14px 16px"}}>
              <div style={{fontSize:"12px",fontWeight:800,color:"#3a7bd5",marginBottom:"4px"}}>💡 Páginas de contenido</div>
              <div style={{fontSize:"12px",color:"#9a9a9a",fontWeight:600,lineHeight:1.6}}>Cada página es una sección de tu Nexo. Podés reordenarlas y agregarles contenido luego.</div>
            </div>
            {sliders.map((s,i)=>(
              <div key={s.id} style={{background:"#fff",borderRadius:"14px",padding:"14px 16px",display:"flex",alignItems:"center",gap:"12px",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
                <span style={{fontSize:"22px"}}>{s.emoji}</span>
                <div style={{flex:1}}>
                  <input type="text" value={s.titulo} onChange={e=>setSliders(prev=>prev.map((x,j)=>j===i?{...x,titulo:e.target.value}:x))}
                    style={{border:"none",outline:"none",fontSize:"14px",fontWeight:800,color:"#1a2a3a",fontFamily:"'Nunito',sans-serif",width:"100%",background:"none"}}/>
                  <div style={{fontSize:"10px",color:"#9a9a9a",fontWeight:600,textTransform:"uppercase" as const,letterSpacing:"0.5px"}}>{s.tipo}</div>
                </div>
                <div style={{display:"flex",gap:"4px"}}>
                  <MB emoji="↑" onClick={()=>moverSlider(i,-1)} disabled={i===0}/>
                  <MB emoji="↓" onClick={()=>moverSlider(i,1)} disabled={i===sliders.length-1}/>
                  <MB emoji="🗑️" onClick={()=>setSliders(prev=>prev.filter((_,j)=>j!==i))} color="#e74c3c"/>
                </div>
              </div>
            ))}
            <button onClick={()=>setPopupSlider(true)} style={{background:"rgba(212,160,23,0.08)",border:"2px dashed rgba(212,160,23,0.4)",borderRadius:"14px",padding:"14px",fontSize:"13px",fontWeight:800,color:"#d4a017",cursor:"pointer",fontFamily:"'Nunito',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px"}}>
              ➕ Agregar página
            </button>
            <div style={{display:"flex",gap:"10px"}}>
              <button onClick={()=>setPaso(1)} style={{flex:1,...BTN2}}>← Volver</button>
              <button onClick={()=>setPaso(3)} style={{flex:2,...BTN(colorPage)}}>Siguiente → Acceso</button>
            </div>
          </div>
        )}

        {/* PASO 3: ACCESO */}
        {paso===3 && (
          <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
            <div style={CAJA}>
              <SL>🔐 Tipo de acceso</SL>
              {[
                {v:"libre",     e:"🟢",l:"Libre",         d:"Cualquiera puede ver y unirse"},
                {v:"aprobacion",e:"⏳",l:"Con aprobación",d:"Vos aprobás cada nuevo miembro"},
                {v:"pago",      e:"💰",l:"De pago",       d:"500 BIT para ingresar"},
              ].map(o=>(
                <div key={o.v} onClick={()=>F("tipo_acceso",o.v)}
                  style={{display:"flex",gap:"12px",alignItems:"center",padding:"14px",borderRadius:"12px",border:`2px solid ${form.tipo_acceso===o.v?colorPage:"#e8e8e6"}`,background:form.tipo_acceso===o.v?`${colorPage}08`:"#fafafa",cursor:"pointer",marginBottom:"8px"}}>
                  <span style={{fontSize:"24px"}}>{o.e}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:"14px",fontWeight:900,color:form.tipo_acceso===o.v?colorPage:"#1a2a3a"}}>{o.l}</div>
                    <div style={{fontSize:"11px",color:"#9a9a9a",fontWeight:600}}>{o.d}</div>
                  </div>
                  {form.tipo_acceso===o.v&&<span style={{color:colorPage,fontSize:"18px"}}>✓</span>}
                </div>
              ))}
            </div>

            <div style={{background:"linear-gradient(135deg,#1a2a3a,#243b55)",borderRadius:"16px",padding:"20px"}}>
              <div style={{fontSize:"12px",fontWeight:800,color:"#8a9aaa",textTransform:"uppercase" as const,letterSpacing:"1px",marginBottom:"14px"}}>📋 Resumen</div>
              {[
                {l:"Tipo",   v:`${emojiPage} ${tituloPage.replace("Crear ","").replace("Ofrecer ","")}`},
                {l:"Título", v:form.titulo||"—"},
                {l:"Páginas",v:`${sliders.length} sección${sliders.length!==1?"es":""}`},
                {l:"Acceso", v:form.tipo_acceso==="libre"?"🟢 Libre":form.tipo_acceso==="aprobacion"?"⏳ Aprobación":"💰 Pago"},
                {l:"Ciudad", v:form.ciudad||"—"},
              ].map(r=>(
                <div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
                  <span style={{fontSize:"12px",fontWeight:600,color:"#8a9aaa"}}>{r.l}</span>
                  <span style={{fontSize:"12px",fontWeight:800,color:"#fff"}}>{r.v}</span>
                </div>
              ))}
            </div>

            <div style={{display:"flex",gap:"10px"}}>
              <button onClick={()=>setPaso(2)} style={{flex:1,...BTN2}}>← Volver</button>
              <button onClick={() => {
                if (tipo === "empresa") { crear(); return; }
                const totalBits = (perfil?.bits_free||0) + (perfil?.bits||0) + (perfil?.bits_promo||0);
                if (totalBits < 500) { alert(`Necesitás 500 BIT para crear este Nexo. Tenés ${totalBits} BIT.`); return; }
                setPopupConfirmar(true);
              }} disabled={guardando} style={{flex:2,...BTN(colorPage),opacity:guardando?0.7:1}}>
                {guardando?"⏳ Creando...":"✅ Crear Nexo"}
              </button>
            </div>
          </div>
        )}
      </div>

      {popupSlider && (
        <PopupSlider
          onClose={()=>setPopupSlider(false)}
          onAgregar={agregarSlider}
          onCustom={(t:string)=>{
            if(!t.trim()) return;
            setSliders(prev=>[...prev,{id:`c_${Date.now()}`,emoji:"✨",titulo:t,tipo:"personalizado",orden:prev.length}]);
            setPopupSlider(false);
          }}
          yaExisten={sliders.map(s=>s.tipo)}
        />
      )}
      {popupConfirmar && (
        <PopupCompra
          titulo={`Crear ${tituloPage.replace("Crear ","").replace("Ofrecer ","")}`}
          emoji={emojiPage} costo="500 BIT"
          descripcion={`Publicá tu ${tipo} en NexoNet`}
          bits={{ free: Math.max(0,perfil?.bits_free||0), nexo: Math.max(0,perfil?.bits||0), promo: Math.max(0,perfil?.bits_promo||0) }}
          onClose={() => setPopupConfirmar(false)}
          onPagar={async (metodo: MetodoPago) => {
            if (metodo === "bit_free") {
              if ((perfil?.bits_free||0) < 500) { alert("No tenés suficientes BIT FREE."); return; }
              await supabase.from("usuarios").update({ bits_free: perfil.bits_free - 500 }).eq("id", perfil.id);
              setPerfil((p:any) => ({...p, bits_free: p.bits_free - 500}));
            } else if (metodo === "bit_nexo") {
              if ((perfil?.bits||0) < 500) { alert("No tenés suficientes BIT Nexo."); return; }
              await supabase.from("usuarios").update({ bits: perfil.bits - 500 }).eq("id", perfil.id);
              setPerfil((p:any) => ({...p, bits: p.bits - 500}));
            } else { alert("Próximamente — pagos con tarjeta/transferencia"); return; }
            setPopupConfirmar(false);
            crear();
          }}
        />
      )}
      <AyudaPopup tipo={tipo as any}/>
      <BottomNav/>
    </main>
  );
}

function PopupSlider({onClose,onAgregar,onCustom,yaExisten}:{onClose:()=>void;onAgregar:(c:any)=>void;onCustom:(t:string)=>void;yaExisten:string[]}) {
  const [ct,setCt] = useState("");
  const todas = Object.values(SLIDERS_PREDEFINIDOS).flat();
  return (
    <div style={{position:"fixed",inset:0,zIndex:500,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"flex-end"}} onClick={onClose}>
      <div style={{width:"100%",background:"#fff",borderRadius:"24px 24px 0 0",padding:"24px 20px 44px",maxHeight:"80vh",overflowY:"auto",fontFamily:"'Nunito',sans-serif"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"20px",color:"#1a2a3a",letterSpacing:"1px",marginBottom:"16px"}}>➕ Elegí una página</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"16px"}}>
          {todas.map(c=>{
            const existe = yaExisten.includes(c.tipo);
            return (
              <button key={c.id} onClick={()=>!existe&&onAgregar(c)} disabled={existe}
                style={{background:existe?"#f9f9f9":"#fff",border:`2px solid ${existe?"#e8e8e6":"rgba(212,160,23,0.3)"}`,borderRadius:"12px",padding:"12px 10px",cursor:existe?"default":"pointer",textAlign:"left" as const,fontFamily:"'Nunito',sans-serif",opacity:existe?0.45:1,display:"flex",gap:"8px",alignItems:"center"}}>
                <span style={{fontSize:"20px"}}>{c.emoji}</span>
                <div>
                  <div style={{fontSize:"12px",fontWeight:800,color:"#1a2a3a"}}>{c.titulo}</div>
                  <div style={{fontSize:"10px",color:"#9a9a9a",fontWeight:600}}>{existe?"Ya agregado":c.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
        <div style={{borderTop:"2px solid #f0f0f0",paddingTop:"14px"}}>
          <div style={{fontSize:"11px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase" as const,letterSpacing:"1px",marginBottom:"8px"}}>✨ Personalizado</div>
          <div style={{display:"flex",gap:"8px"}}>
            <input type="text" value={ct} onChange={e=>setCt(e.target.value)} placeholder="Nombre de la página..."
              style={{flex:1,border:"2px solid #e8e8e6",borderRadius:"10px",padding:"10px 14px",fontSize:"13px",fontFamily:"'Nunito',sans-serif",outline:"none"}}/>
            <button onClick={()=>{onCustom(ct);setCt("");}} disabled={!ct.trim()}
              style={{background:"linear-gradient(135deg,#d4a017,#f0c040)",border:"none",borderRadius:"10px",padding:"10px 16px",fontSize:"13px",fontWeight:900,color:"#1a2a3a",cursor:"pointer",fontFamily:"'Nunito',sans-serif",opacity:ct.trim()?1:0.5}}>
              ➕
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MB({emoji,onClick,disabled,color="#9a9a9a"}:{emoji:string;onClick:()=>void;disabled?:boolean;color?:string}) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{background:`${color}18`,border:`1px solid ${color}30`,borderRadius:"8px",width:"32px",height:"32px",fontSize:"14px",cursor:disabled?"default":"pointer",opacity:disabled?0.3:1,display:"flex",alignItems:"center",justifyContent:"center"}}>
      {emoji}
    </button>
  );
}

function L({children}:{children:React.ReactNode}) {
  return <div style={{fontSize:"11px",fontWeight:800,color:"#666",textTransform:"uppercase" as const,letterSpacing:"1px",marginBottom:"6px"}}>{children}</div>;
}
function SL({children,style}:{children:React.ReactNode;style?:React.CSSProperties}) {
  return <div style={{fontSize:"11px",fontWeight:900,color:"#9a9a9a",textTransform:"uppercase" as const,letterSpacing:"1px",marginBottom:"14px",...style}}>{children}</div>;
}

const IS:React.CSSProperties   = {width:"100%",border:"2px solid #e8e8e6",borderRadius:"10px",padding:"11px 14px",fontSize:"14px",fontFamily:"'Nunito',sans-serif",color:"#2c2c2e",outline:"none",boxSizing:"border-box" as const,marginBottom:"12px"};
const CAJA:React.CSSProperties  = {background:"#fff",borderRadius:"16px",padding:"18px",boxShadow:"0 2px 10px rgba(0,0,0,0.06)"};
const BTN  = (c:string):React.CSSProperties => ({width:"100%",background:`linear-gradient(135deg,${c}cc,${c})`,border:"none",borderRadius:"12px",padding:"14px",fontSize:"15px",fontWeight:900,color:"#fff",cursor:"pointer",fontFamily:"'Nunito',sans-serif",boxShadow:`0 4px 0 ${c}88`});
const BTN2:React.CSSProperties  = {flex:1,background:"#f4f4f2",border:"none",borderRadius:"12px",padding:"14px",fontSize:"14px",fontWeight:800,color:"#9a9a9a",cursor:"pointer",fontFamily:"'Nunito',sans-serif"} as const;
