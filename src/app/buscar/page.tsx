"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";
import PopupCompra, { MetodoPago } from "@/components/PopupCompra";
import InsigniaLogro from "@/app/_components/InsigniaLogro";

type Anuncio = {
  permuto?: boolean; id:number; titulo:string; precio:number; moneda:string;
  ciudad:string; provincia:string; imagenes:string[]; flash:boolean; fuente:string;
  usuario_id:string; subrubro_nombre:string; rubro_nombre:string;
  owner_whatsapp?: string; owner_insignia_logro?: string; owner_nombre?: string; tipo?: string; visitas_semana?: number;
};
type Nexo = {
  id:string; titulo:string; descripcion:string; tipo:string; subtipo:string;
  ciudad:string; provincia:string; avatar_url:string; banner_url:string;
  precio:number; moneda:string; usuario_id:string; miembros_count?:number;
  config?:any; visitas_semana?: number;
};
type Rubro = { id:number; nombre:string; subrubros:{id:number; nombre:string}[] };
type RubroFlat = { id:number; nombre:string };
type SubrubroFlat = { id:number; nombre:string; rubro_id:number };
type Prov = { id:number; nombre:string };
type Ciudad = { id:number; nombre:string; provincia_id:number };
type Barrio = { id:number; nombre:string; ciudad_id:number };
type TipoPublicacion = "anuncios" | "grupos" | "empresas" | "servicios" | "trabajo";

const TIPOS: { key:TipoPublicacion; emoji:string; label:string; color:string }[] = [
  { key:"anuncios",  emoji:"📣", label:"Anuncios",  color:"#d4a017" },
  { key:"grupos",    emoji:"👥", label:"Grupos",    color:"#3a7bd5" },
  { key:"empresas",  emoji:"🏢", label:"Empresas",  color:"#c0392b" },
  { key:"servicios", emoji:"🛠️", label:"Servicios", color:"#27ae60" },
  { key:"trabajo",   emoji:"💼", label:"Trabajo",   color:"#8e44ad" },
];

const F: Record<string,{color:string;texto:string;label:string}> = {
  nexonet:      {color:"#d4a017",texto:"#1a2a3a",label:"NexoNet"},
  mercadolibre: {color:"#ffe600",texto:"#333",   label:"Mercado Libre"},
  rosariogarage:{color:"#ff6b00",texto:"#fff",   label:"Rosario Garage"},
  olx:          {color:"#00a884",texto:"#fff",   label:"OLX"},
  otro:         {color:"#888",   texto:"#fff",   label:"Externo"},
};

export default function Buscar() {
  return (
    <Suspense fallback={<div style={{paddingTop:"95px",textAlign:"center",padding:"60px",color:"#9a9a9a",fontWeight:700}}>Cargando...</div>}>
      <BuscarInner />
    </Suspense>
  );
}

function BuscarInner() {
  const sp = useSearchParams();
  const router = useRouter();

  const [tipoActivo, setTipoActivo] = useState<TipoPublicacion>("anuncios");

  const [provs,    setProvs]    = useState<Prov[]>([]);
  const [ciudades, setCiudades] = useState<Ciudad[]>([]);
  const [barrios,  setBarrios]  = useState<Barrio[]>([]);
  const [provSel,  setProvSel]  = useState("");
  const [ciudSel,  setCiudSel]  = useState("");
  const [barrSel,  setBarrSel]  = useState("");
  const [gpsLoad,  setGpsLoad]  = useState(false);

  const [query,    setQuery]    = useState("");
  const [rSel,     setRSel]     = useState<RubroFlat|null>(null);
  const [sSel,     setSSel]     = useState<SubrubroFlat|null>(null);
  const [dropOpen, setDropOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef  = useRef<HTMLDivElement>(null);

  const [soloPermuto, setSoloPermuto] = useState(false);

  const [rubros,   setRubros]   = useState<Rubro[]>([]);
  const [rFlat,    setRFlat]    = useState<RubroFlat[]>([]);
  const [sFlat,    setSFlat]    = useState<SubrubroFlat[]>([]);
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [nexos,    setNexos]    = useState<Nexo[]>([]);
  const [subAct,   setSubAct]   = useState<Record<number,number|null>>({});
  const [grupoCats, setGrupoCats] = useState<{id:number;nombre:string;emoji:string}[]>([]);
  const [loading,  setLoading]  = useState(true);

  const [session,    setSession]    = useState<any>(null);
  // ── FIX: trackear cada bolsillo por separado ──
  const [bitsNexo,  setBitsNexo]  = useState(0);
  const [bitsFree,  setBitsFree]  = useState(0);
  const [bitsPromo, setBitsPromo] = useState(0);
  const bits = bitsNexo + bitsFree + bitsPromo; // total para mostrar en UI

  const [modoConexion,   setModoConexion]   = useState(false);
  const [seleccionados,  setSeleccionados]  = useState<Set<number>>(new Set());
  const [conectando,     setConectando]     = useState(false);
  const [resultadoConex, setResultadoConex] = useState<string|null>(null);
  const [popupConexion,  setPopupConexion]  = useState(false);
  const [popupPago,      setPopupPago]      = useState(false);

  const MENSAJES_PRESET = [
    "Hola, estoy interesado/a en tu anuncio. ¿Podemos hablar?",
    "Hola, vi tu publicación y me gustaría más información.",
    "Buen día, ¿el anuncio sigue disponible?",
    "Hola, ¿cuál es el precio final? Estoy listo/a para cerrar.",
  ];
  const [mensajeConexion, setMensajeConexion] = useState(MENSAJES_PRESET[0]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) {
        supabase.from("usuarios").select("bits,bits_free,bits_promo").eq("id", s.user.id).single()
          .then(({ data }) => {
            if (data) {
              // ── FIX: guardar cada bolsillo por separado ──
              setBitsNexo(Math.max(0, data.bits || 0));
              setBitsFree(Math.max(0, data.bits_free || 0));
              setBitsPromo(Math.max(0, data.bits_promo || 0));
            }
          });
      }
    });
  }, []);

  useEffect(() => {
    if (sp.get("q")) setQuery(sp.get("q")!);
    if (sp.get("tipo")) {
  const t = sp.get("tipo") as any;
  if (["anuncios","grupos","empresas","servicios","trabajo"].includes(t)) setTipoActivo(t);
}
    const rP = sp.get("rubro");
    const sP = sp.get("subrubro");

    Promise.all([
      supabase.from("provincias").select("id,nombre").order("nombre"),
      supabase.from("rubros").select("id,nombre").order("nombre"),
      supabase.from("subrubros").select("id,nombre,rubro_id").order("nombre"),
      supabase.from("anuncios")
        .select("id,titulo,precio,moneda,ciudad,provincia,imagenes,flash,fuente,usuario_id,permuto,subrubros!inner(id,nombre,rubros!inner(id,nombre))")
        .eq("estado","activo").order("created_at",{ascending:false}).limit(200),
      supabase.from("nexos")
        .select("id,titulo,descripcion,tipo,subtipo,ciudad,provincia,avatar_url,banner_url,precio,moneda,usuario_id,config")
        .eq("estado","activo").order("created_at",{ascending:false}).limit(200),
    ]).then(async ([{data:pData},{data:rData},{data:sData},{data:aData},{data:nData}]) => {
      const gData: any[] = []; const catData: any[] = [];

      if (pData) setProvs(pData);

      if (rData && sData) {
        const rubrosConSubs = rData.map((r:any) => ({
          ...r, subrubros: sData.filter((s:any) => Number(s.rubro_id) === Number(r.id)),
        }));
        setRubros(rubrosConSubs as any);
        const rf = rData.map((r:any) => ({id:Number(r.id), nombre:r.nombre}));
        setRFlat(rf);
        setSFlat(sData.map((s:any) => ({id:Number(s.id), nombre:s.nombre, rubro_id:Number(s.rubro_id)})));
        if (rP) { const r = rf.find((x:any) => x.id===parseInt(rP)); if(r){setRSel(r);setQuery(r.nombre);} }
        if (sP) {
          const s = sData.find((x:any) => Number(x.id)===parseInt(sP));
          if(s){setSSel({id:Number(s.id),nombre:s.nombre,rubro_id:Number(s.rubro_id)});setQuery(s.nombre);}
        }
      }

      if (aData) {
        let mapped: Anuncio[] = aData.map((a:any) => ({
          id: a.id, titulo: a.titulo, precio: a.precio, moneda: a.moneda,
          ciudad: a.ciudad, provincia: a.provincia, imagenes: a.imagenes || [],
          flash: a.flash || false, fuente: a.fuente || "nexonet",
          usuario_id: a.usuario_id, permuto: a.permuto || false,
          subrubro_nombre: a.subrubros?.nombre || "",
          rubro_nombre: Array.isArray(a.subrubros?.rubros)
            ? (a.subrubros.rubros[0]?.nombre || "")
            : (a.subrubros?.rubros?.nombre || ""),
          tipo: "anuncio",
        }));
        const uids = [...new Set(mapped.map(a => a.usuario_id).filter(Boolean))];
        if (uids.length > 0) {
          const { data: owners } = await supabase.from("usuarios")
            .select("id,bits,bits_promo,bits_free,whatsapp,vis_personal,insignia_logro,nombre_usuario,nombre").in("id", uids);
          if (owners) {
            const ownerMap: Record<string,any> = Object.fromEntries(owners.map((o:any) => [o.id, o]));
            mapped = mapped.map(a => {
              const o = ownerMap[a.usuario_id];
              const totalBits = (o?.bits||0) + (o?.bits_promo||0) + (o?.bits_free||0);
              const waVisible = o?.vis_personal?.whatsapp === true;
              return { ...a, owner_whatsapp: (o?.whatsapp && waVisible && totalBits > 0) ? o.whatsapp : undefined, owner_insignia_logro: o?.insignia_logro || "ninguna", owner_nombre: o?.nombre_usuario || o?.nombre || undefined };
            });
          }
        }
        // Obtener visitas semanales de anuncios
        const hace7dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const anuIds = mapped.map(a => a.id);
        if (anuIds.length > 0) {
          const { data: vData } = await supabase
            .from("anuncio_visitas").select("anuncio_id")
            .in("anuncio_id", anuIds).gte("fecha", hace7dias);
          if (vData) {
            const conteo: Record<number, number> = {};
            vData.forEach((v: any) => { conteo[v.anuncio_id] = (conteo[v.anuncio_id] || 0) + 1; });
            mapped = mapped.map(a => ({ ...a, visitas_semana: conteo[a.id] || 0 }));
          }
        }
        mapped.sort((a, b) => (b.visitas_semana || 0) - (a.visitas_semana || 0));
        setAnuncios(mapped);
      }

      const nexosArr: Nexo[] = nData ? (nData as Nexo[]) : [];
      if (catData) setGrupoCats(catData as any);

      const gruposArr: Nexo[] = gData ? (gData as any[]).map((g:any) => ({
        id:            String(g.id),
        titulo:        g.nombre || "Sin nombre",
        descripcion:   g.descripcion || "",
        tipo:          "grupo",
        subtipo:       String(g.categoria_id || ""),
        ciudad:        g.ciudad || "",
        provincia:     g.provincia || "",
        avatar_url:    g.imagen || "",
        banner_url:    g.imagen_fondo || "",
        precio:        0,
        moneda:        "ARS",
        usuario_id:    g.creador_id,
        miembros_count: g.miembros_count || 0,
        config:        { tipo_acceso: g.pago_ingreso_admin ? "pago" : (g.config?.tipo_acceso || "libre") },
      })) : [];
      let allNexos = [...nexosArr, ...gruposArr];

      // Obtener visitas semanales de nexos
      const hace7dias2 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const nxIds = allNexos.map(n => n.id);
      if (nxIds.length > 0) {
        const { data: nvData } = await supabase
          .from("nexo_visitas").select("nexo_id")
          .in("nexo_id", nxIds).gte("fecha", hace7dias2);
        if (nvData) {
          const conteo: Record<string, number> = {};
          nvData.forEach((v: any) => { conteo[v.nexo_id] = (conteo[v.nexo_id] || 0) + 1; });
          allNexos = allNexos.map(n => ({ ...n, visitas_semana: conteo[n.id] || 0 }));
        }
      }
      allNexos.sort((a, b) => (b.visitas_semana || 0) - (a.visitas_semana || 0));
      setNexos(allNexos);
      setLoading(false);
    });
  }, []);

  const cambiarProv = async (nombre: string) => {
    setProvSel(nombre); setCiudSel(""); setBarrSel(""); setCiudades([]); setBarrios([]);
    if (!nombre) return;
    const p = provs.find(x => x.nombre===nombre); if (!p) return;
    const {data} = await supabase.from("ciudades").select("id,nombre,provincia_id").eq("provincia_id",p.id).order("nombre");
    if (data) setCiudades(data);
  };
  const cambiarCiud = async (nombre: string) => {
    setCiudSel(nombre); setBarrSel(""); setBarrios([]);
    if (!nombre) return;
    const c = ciudades.find(x => x.nombre===nombre); if (!c) return;
    const {data} = await supabase.from("barrios").select("id,nombre,ciudad_id").eq("ciudad_id",c.id).order("nombre");
    if (data) setBarrios(data);
  };

  useEffect(() => {
    const h = (e:MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node))
        setDropOpen(false);
    };
    document.addEventListener("mousedown",h); return () => document.removeEventListener("mousedown",h);
  }, []);

  const gps = () => {
    if (!navigator.geolocation) return alert("GPS no disponible");
    setGpsLoad(true);
    navigator.geolocation.getCurrentPosition(async pos => {
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&accept-language=es`);
        const d = await r.json();
        const norm = (s:string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
        const pNom = d.address?.state||""; const cNom = d.address?.city||d.address?.town||d.address?.village||""; const bNom = d.address?.suburb||"";
        const pm = provs.find(p => norm(p.nombre).includes(norm(pNom))||norm(pNom).includes(norm(p.nombre)));
        if (!pm) { setGpsLoad(false); return; }
        const {data:cd} = await supabase.from("ciudades").select("id,nombre,provincia_id").eq("provincia_id",pm.id).order("nombre");
        let cF="",bF="",bsF:Barrio[]=[],csF:Ciudad[]=cd||[];
        if (cd&&cNom) {
          const cm = cd.find((c:any) => norm(c.nombre).includes(norm(cNom))||norm(cNom).includes(norm(c.nombre)));
          if (cm) {
            cF=cm.nombre;
            const {data:bd} = await supabase.from("barrios").select("id,nombre,ciudad_id").eq("ciudad_id",cm.id).order("nombre");
            if (bd&&bd.length>0) { bsF=bd; const bm=bd.find((b:any)=>norm(b.nombre).includes(norm(bNom))||norm(bNom).includes(norm(b.nombre))); if(bm)bF=bm.nombre; }
          }
        }
        setCiudades(csF); setBarrios(bsF); setProvSel(pm.nombre); setCiudSel(cF); setBarrSel(bF);
      } catch { alert("Error al obtener ubicación"); }
      setGpsLoad(false);
    }, () => { alert("No se pudo acceder al GPS"); setGpsLoad(false); });
  };

  const limpUbi = () => { setProvSel(""); setCiudSel(""); setBarrSel(""); };
  const ubiActiva = !!(provSel||ciudSel||barrSel);
  const qLow = query.toLowerCase();
  const rFilt = rFlat.filter(r => r.nombre.toLowerCase().includes(qLow));
  const sFilt = sFlat.filter(s => s.nombre.toLowerCase().includes(qLow));
  const sDRubro = rSel ? sFlat.filter(s => s.rubro_id===rSel.id) : [];
  const limpQ  = () => { setQuery(""); setRSel(null); setSSel(null); setDropOpen(false); };
  const selR   = (r:RubroFlat)    => { setRSel(r); setSSel(null); setQuery(r.nombre); setDropOpen(false); };
  const selS   = (s:SubrubroFlat) => { setRSel(rFlat.find(r=>r.id===s.rubro_id)||null); setSSel(s); setQuery(s.nombre); setDropOpen(false); };
  const togSub = (rId:number,sId:number) => setSubAct(p => ({...p,[rId]:p[rId]===sId?null:sId}));

  const filtrarPorUbi = (ciudad:string, provincia:string) => {
    if (barrSel) return (ciudad||"").toLowerCase().includes(barrSel.toLowerCase());
    if (ciudSel) return (ciudad||"").toLowerCase().includes(ciudSel.toLowerCase());
    if (provSel) return (provincia||"").toLowerCase().includes(provSel.toLowerCase());
    return true;
  };

  const anuFilt = anuncios.filter(a => filtrarPorUbi(a.ciudad, a.provincia));
  const nexosFilt = nexos.filter(n => filtrarPorUbi(n.ciudad, n.provincia));

  const nexosPorTipo: Record<string, Nexo[]> = {
    grupos:    nexosFilt.filter(n => n.tipo === "grupo"),
    empresas:  nexosFilt.filter(n => n.tipo === "empresa"),
    servicios: nexosFilt.filter(n => n.tipo === "servicio"),
    trabajo:   nexosFilt.filter(n => n.tipo === "trabajo"),
  };

  const busLibre = query.trim()!==""&&!rSel&&!sSel;
  const rubrosM  = rSel ? rubros.filter(r=>r.nombre===rSel.nombre) : rubros;
  const getAnus = (rubro:Rubro) => {
    const sa = subAct[rubro.id];
    return anuFilt.filter(a => {
      if (a.rubro_nombre !== rubro.nombre) return false;
      if (sa) { const sub = rubro.subrubros.find((s:any) => Number(s.id) === Number(sa)); return sub ? a.subrubro_nombre === sub.nombre : false; }
      if (sSel) return a.subrubro_nombre === sSel.nombre;
      return true;
    }).slice(0,8);
  };
  const resTxt = busLibre ? anuFilt.filter(a =>
    a.titulo.toLowerCase().includes(qLow) ||
    a.subrubro_nombre.toLowerCase().includes(qLow) ||
    a.rubro_nombre.toLowerCase().includes(qLow)
  ) : [];
  const anuSinCategoria = anuFilt.filter(a => !a.rubro_nombre);
  const fmt = (p:number,m:string) => !p?"Consultar":`${m==="USD"?"U$D":"$"} ${p.toLocaleString("es-AR")}`;
  const phQ  = barrSel?`¿Qué buscás en ${barrSel}?`:ciudSel?`¿Qué buscás en ${ciudSel}?`:provSel?`¿Qué buscás en ${provSel}?`:"¿Qué buscás?";

  const toggleSeleccion = (id:number) => { const s = new Set(seleccionados); s.has(id) ? s.delete(id) : s.add(id); setSeleccionados(s); };
  const seleccionarTodos = () => setSeleccionados(new Set(anuFilt.map(a=>a.id)));
  const deseleccionarTodos = () => setSeleccionados(new Set());
  const todosSeleccionados = anuFilt.length > 0 && seleccionados.size === anuFilt.length;
  const activarModoConexion = () => { if (!session) { router.push("/login"); return; } setModoConexion(true); setSeleccionados(new Set()); };
  const cancelarConexion = () => { setModoConexion(false); setSeleccionados(new Set()); setResultadoConex(null); };
  const abrirWA = (ownerWa: string, anuncioId: number, titulo: string) => {
    const num = ownerWa.replace(/\D/g,"");
    const msg = encodeURIComponent(`Hola! Me conecté con tu anuncio en NexoNet: "${titulo}" 🔗 nexonet.ar/anuncios/${anuncioId}`);
    window.open(`https://wa.me/${num}?text=${msg}`, "_blank");
  };

  // ── FIX: ejecutarConexion recibe el metodo y descuenta del bolsillo correcto ──
  const ejecutarConexion = async (metodo: MetodoPago) => {
    if (seleccionados.size === 0) return;
    setConectando(true);
    const ids = Array.from(seleccionados);
    const costo = ids.length;

    // Verificar saldo según método
    if (metodo === "bit_free" && bitsFree < costo) {
      alert(`No tenés suficientes BIT FREE. Necesitás ${costo}, tenés ${bitsFree}.`);
      setConectando(false); return;
    }
    if (metodo === "bit_nexo" && bitsNexo < costo) {
      alert(`No tenés suficientes BIT Nexo. Necesitás ${costo}, tenés ${bitsNexo}.`);
      setConectando(false); return;
    }

    const { data: anuData } = await supabase.from("anuncios").select("id,usuario_id,conexiones").in("id", ids);
    if (anuData) {
      await Promise.all(anuData.map((a:any) => supabase.from("anuncios").update({ conexiones: (a.conexiones||0)+1 }).eq("id",a.id)));
      await supabase.from("notificaciones").insert(anuData.map((a:any) => ({
        usuario_id: a.usuario_id, emisor_id: session.user.id,
        anuncio_id: a.id, tipo: "conexion", mensaje: mensajeConexion
      })));

      // Descontar del bolsillo correcto
      if (metodo === "bit_free") {
        await supabase.from("usuarios").update({ bits_free: bitsFree - costo }).eq("id", session.user.id);
        setBitsFree(prev => prev - costo);
      } else if (metodo === "bit_nexo") {
        await supabase.from("usuarios").update({ bits: bitsNexo - costo }).eq("id", session.user.id);
        setBitsNexo(prev => prev - costo);
      }

      for (const a of anuData) {
        const anuncio = anuncios.find(x => x.id === a.id);
        if (anuncio?.owner_whatsapp) { abrirWA(anuncio.owner_whatsapp, anuncio.id, anuncio.titulo); break; }
      }
    }
    setResultadoConex(`✅ Mensaje enviado a ${ids.length} anuncio${ids.length!==1?"s":""}. Usaste ${ids.length} BIT.`);
    setConectando(false); setSeleccionados(new Set()); setMensajeConexion(MENSAJES_PRESET[0]);
    setTimeout(() => cancelarConexion(), 3000);
  };

  const colorActivo = TIPOS.find(t => t.key === tipoActivo)?.color || "#d4a017";

  return (
    <main style={{paddingTop:"95px",paddingBottom: modoConexion ? "230px" : "130px",background:"#f4f4f2",minHeight:"100vh",fontFamily:"'Nunito',sans-serif"}}>
      <Header />

      <div style={{background:"linear-gradient(135deg,#1a2a3a,#243b55)",padding:"12px 16px 0",display:"flex",flexDirection:"column",gap:"10px"}}>

        {/* UBICACIÓN */}
        <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
          <SelUbi value={provSel} placeholder="🗺️ Provincia" opciones={provs.map(p=>p.nombre)} onChange={cambiarProv} />
          {provSel && <SelUbi value={ciudSel} placeholder="🏙️ Ciudad" opciones={ciudades.map(c=>c.nombre)} onChange={cambiarCiud} />}
          {ciudSel && barrios.length>0 && <SelUbi value={barrSel} placeholder="🏘️ Barrio" opciones={barrios.map(b=>b.nombre)} onChange={setBarrSel} />}
          <button onClick={gps} disabled={gpsLoad} style={{flexShrink:0,width:"42px",height:"42px",background:"rgba(212,160,23,0.2)",border:"2px solid rgba(212,160,23,0.5)",borderRadius:"12px",fontSize:"18px",cursor:"pointer",opacity:gpsLoad?0.6:1,display:"flex",alignItems:"center",justifyContent:"center"}}>
            {gpsLoad?"⏳":"📍"}
          </button>
          {ubiActiva && <button onClick={limpUbi} style={{flexShrink:0,width:"42px",height:"42px",background:"rgba(255,80,80,0.15)",border:"2px solid rgba(255,80,80,0.3)",borderRadius:"12px",fontSize:"16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>}
        </div>

        {ubiActiva && (
          <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
            {[provSel,ciudSel,barrSel].filter(Boolean).map((l,i)=>(
              <span key={i} style={{background:"rgba(212,160,23,0.2)",border:"1px solid rgba(212,160,23,0.4)",borderRadius:"20px",padding:"3px 10px",fontSize:"11px",fontWeight:800,color:"#d4a017"}}>
                {["🗺️","🏙️","🏘️"][i]} {l}
              </span>
            ))}
          </div>
        )}

        {/* BUSCADOR */}
        <div style={{position:"relative"}}>
          <div style={{display:"flex",background:"#fff",borderRadius:"14px",boxShadow:"0 2px 8px rgba(0,0,0,0.2)",zIndex:10,position:"relative"}}>
            <div style={{flex:1,position:"relative"}}>
              <input ref={inputRef} type="text" value={query}
                onChange={e=>{setQuery(e.target.value);setRSel(null);setSSel(null);setDropOpen(true);}}
                onFocus={()=>setDropOpen(true)} placeholder={phQ}
                style={{width:"100%",border:"none",padding:"12px 16px",fontFamily:"'Nunito',sans-serif",fontSize:"14px",color:"#2c2c2e",outline:"none",background:"transparent",boxSizing:"border-box",borderRadius:"14px 0 0 14px"}}
              />
              {(rSel||sSel) && (
                <div onClick={limpQ} style={{position:"absolute",right:"8px",top:"50%",transform:"translateY(-50%)",background:"#d4a017",borderRadius:"20px",padding:"3px 10px",fontSize:"11px",fontWeight:800,color:"#1a2a3a",cursor:"pointer"}}>
                  {sSel?sSel.nombre:rSel!.nombre} ✕
                </div>
              )}
            </div>
            {query&&!rSel && <button onClick={limpQ} style={{background:"none",border:"none",padding:"0 8px",cursor:"pointer",fontSize:"16px",color:"#9a9a9a"}}>✕</button>}
            <button onClick={()=>setDropOpen(false)} style={{background:"#d4a017",border:"none",padding:"0 18px",cursor:"pointer",fontSize:"16px",color:"#1a2a3a",borderRadius:"0 14px 14px 0",flexShrink:0}}>🔍</button>
          </div>
          {dropOpen && tipoActivo === "anuncios" && (
            <div ref={dropRef} style={{position:"absolute",top:"calc(100% + 6px)",left:0,right:0,background:"#fff",borderRadius:"14px",boxShadow:"0 8px 32px rgba(0,0,0,0.2)",zIndex:100,maxHeight:"300px",overflowY:"auto",border:"1px solid #e8e8e6"}}>
              {rSel&&sDRubro.length>0 ? (
                <>
                  <div style={{padding:"10px 14px 6px",fontSize:"10px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase",letterSpacing:"1px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span>Subrubros de {rSel.nombre}</span>
                    <button onClick={limpQ} style={{background:"none",border:"none",cursor:"pointer",fontSize:"11px",color:"#d4a017",fontWeight:800,fontFamily:"'Nunito',sans-serif"}}>← Todos</button>
                  </div>
                  <div onClick={()=>{setSSel(null);setDropOpen(false);}} style={dItem(false)}><span>📋</span><div style={{fontSize:"13px",fontWeight:800,color:"#1a2a3a"}}>Todos en {rSel.nombre}</div></div>
                  {sDRubro.map(s=>(<div key={s.id} onClick={()=>selS(s)} style={dItem(sSel?.id===s.id)}><span style={{fontSize:"13px"}}>↳</span><div style={{fontSize:"13px",fontWeight:700,color:"#1a2a3a"}}>{s.nombre}</div></div>))}
                </>
              ) : (
                <>
                  {query===""&&<div style={{padding:"10px 14px 4px",fontSize:"10px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase",letterSpacing:"1px"}}>Todos los rubros</div>}
                  {query!==""&&rFilt.length===0&&sFilt.length===0&&<div style={{padding:"20px",textAlign:"center",fontSize:"13px",color:"#9a9a9a",fontWeight:600}}>Sin resultados para "{query}"</div>}
                  {rFilt.map(r=>(<div key={r.id} onClick={()=>selR(r)} style={dItem(rSel?.id===r.id)}><span>📂</span><div style={{flex:1}}><div style={{fontSize:"13px",fontWeight:800,color:"#1a2a3a"}}>{r.nombre}</div><div style={{fontSize:"10px",color:"#9a9a9a",fontWeight:600}}>{sFlat.filter(s=>s.rubro_id===r.id).length} subrubros</div></div><span style={{fontSize:"12px",color:"#d4a017",fontWeight:800}}>→</span></div>))}
                  {query!==""&&sFilt.length>0&&(<>
                    <div style={{padding:"8px 14px 4px",fontSize:"10px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase",letterSpacing:"1px",borderTop:"1px solid #f0f0f0"}}>Subrubros</div>
                    {sFilt.slice(0,5).map(s=>{const r=rFlat.find(x=>x.id===s.rubro_id);return(<div key={s.id} onClick={()=>selS(s)} style={dItem(false)}><span style={{fontSize:"13px"}}>↳</span><div><div style={{fontSize:"13px",fontWeight:700,color:"#1a2a3a"}}>{s.nombre}</div>{r&&<div style={{fontSize:"10px",color:"#9a9a9a",fontWeight:600}}>en {r.nombre}</div>}</div></div>);})}
                  </>)}
                  {query!==""&&(<div onClick={()=>setDropOpen(false)} style={{...dItem(false),borderTop:"1px solid #f0f0f0",background:"#f9f7f0"}}><span>🔍</span><div><div style={{fontSize:"13px",fontWeight:800,color:"#d4a017"}}>Buscar "{query}"</div><div style={{fontSize:"10px",color:"#9a9a9a",fontWeight:600}}>Ver todos los resultados</div></div></div>)}
                </>
              )}
            </div>
          )}
        </div>

        {/* FILTROS */}
        {tipoActivo === "anuncios" && (
          <div style={{display:"flex",gap:"8px",flexWrap:"wrap",paddingBottom:"4px"}}>
            <button onClick={() => setSoloPermuto(v => !v)}
              style={{background: soloPermuto ? "#d4a017" : "rgba(255,255,255,0.12)", border: `2px solid ${soloPermuto ? "#d4a017" : "rgba(255,255,255,0.3)"}`, borderRadius:"20px", padding:"6px 14px", fontSize:"12px", fontWeight:800, color: soloPermuto ? "#1a2a3a" : "#fff", cursor:"pointer", fontFamily:"'Nunito',sans-serif"}}>
              🔄 Permuta {soloPermuto && "✓"}
            </button>
            <button onClick={() => router.push("/busqueda-ia")}
              style={{background:"linear-gradient(135deg,rgba(22,160,133,0.3),rgba(22,160,133,0.15))", border:"2px solid rgba(22,160,133,0.7)", borderRadius:"20px", padding:"6px 14px", fontSize:"12px", fontWeight:800, color:"#1abc9c", cursor:"pointer", fontFamily:"'Nunito',sans-serif"}}>
              🤖 Búsqueda IA
            </button>
            <button onClick={() => {
              const params = new URLSearchParams();
              if (sSel) params.set("subrubro", String(sSel.id));
              else if (rSel) params.set("rubro", String(rSel.id));
              if (provSel) params.set("provincia", provSel);
              if (ciudSel) params.set("ciudad", ciudSel);
              router.push(`/mapa?${params.toString()}`);
            }}
              style={{background:"linear-gradient(135deg,rgba(58,123,213,0.3),rgba(58,123,213,0.15))", border:"2px solid rgba(58,123,213,0.7)", borderRadius:"20px", padding:"6px 14px", fontSize:"12px", fontWeight:800, color:"#7fb3f5", cursor:"pointer", fontFamily:"'Nunito',sans-serif"}}>
              🗺️ Ver en mapa
            </button>
          </div>
        )}

        {/* CONEXION BUTTON */}
        {session && !modoConexion && tipoActivo === "anuncios" && (
          <button onClick={activarModoConexion} style={{background:"linear-gradient(135deg,#f0c040,#d4a017)",border:"none",borderRadius:"12px",padding:"8px 16px",display:"flex",flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:"10px",cursor:"pointer",fontFamily:"'Nunito',sans-serif",boxShadow:"0 4px 0 #a07810",width:"100%",marginBottom:"4px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
              <span style={{fontSize:"15px"}}>🔗</span>
              <span style={{fontSize:"13px",fontWeight:900,color:"#1a2a3a"}}>Conectarme con:</span>
            </div>
            <span style={{background:"rgba(26,42,58,0.18)",borderRadius:"20px",padding:"3px 12px",fontSize:"12px",fontWeight:800,color:"#1a2a3a",whiteSpace:"nowrap"}}>{bits} BIT disponibles</span>
          </button>
        )}
        {modoConexion && (
          <div style={{background:"linear-gradient(135deg,#f0c040,#d4a017)",borderRadius:"12px",padding:"8px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"8px",boxShadow:"0 4px 0 #a07810",marginBottom:"4px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
              <span style={{fontSize:"15px"}}>🔗</span>
              <span style={{fontSize:"13px",fontWeight:900,color:"#1a2a3a"}}>Conectándome a:</span>
            </div>
            <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
              <button onClick={todosSeleccionados?deseleccionarTodos:seleccionarTodos} style={{background:"#1a2a3a",border:"none",borderRadius:"20px",padding:"4px 14px",fontSize:"12px",fontWeight:900,color:"#d4a017",cursor:"pointer",fontFamily:"'Nunito',sans-serif",whiteSpace:"nowrap"}}>
                {todosSeleccionados?"✕ TODOS":"✅ TODOS"}
              </button>
              <button onClick={cancelarConexion} style={{background:"rgba(26,42,58,0.2)",border:"none",borderRadius:"8px",padding:"4px 10px",fontSize:"14px",fontWeight:900,color:"#1a2a3a",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>✕</button>
            </div>
          </div>
        )}

        {/* TABS */}
        <div style={{display:"flex",overflowX:"auto",scrollbarWidth:"none",gap:"0",borderTop:"1px solid rgba(255,255,255,0.08)"}}>
          {TIPOS.map(t => (
            <button key={t.key} onClick={()=>{ setTipoActivo(t.key); setModoConexion(false); setSeleccionados(new Set()); }}
              style={{flex:"0 0 auto",background:"none",border:"none",cursor:"pointer",padding:"10px 16px 8px",
                       display:"flex",flexDirection:"column",alignItems:"center",gap:"3px",
                       borderBottom: tipoActivo===t.key ? `3px solid ${t.color}` : "3px solid transparent",
                       fontFamily:"'Nunito',sans-serif"}}>
              <span style={{fontSize:"18px"}}>{t.emoji}</span>
              <span style={{fontSize:"10px",fontWeight:800,color:tipoActivo===t.key?t.color:"rgba(255,255,255,0.45)",textTransform:"uppercase",letterSpacing:"0.5px",whiteSpace:"nowrap"}}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* CONTENIDO */}
      {loading ? (
        <div style={{textAlign:"center",padding:"40px",color:"#9a9a9a",fontWeight:700}}>Cargando...</div>
      ) : (
        <>
          {tipoActivo === "anuncios" && (
            busLibre ? (
              <div>
                <div style={{padding:"14px 16px 8px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:"14px",fontWeight:900,color:"#1a2a3a"}}>🔍 <span style={{color:"#d4a017"}}>{resTxt.length}</span> resultado{resTxt.length!==1?"s":""} para "{query}"</span>
                  <button onClick={limpQ} style={{background:"none",border:"none",fontSize:"12px",fontWeight:700,color:"#9a9a9a",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>✕ Limpiar</button>
                </div>
                {resTxt.length===0 ? (
                  <div style={{textAlign:"center",padding:"40px 20px"}}>
                    <div style={{fontSize:"40px",marginBottom:"12px"}}>🔍</div>
                    <div style={{fontSize:"15px",fontWeight:800,color:"#1a2a3a",marginBottom:"6px"}}>Sin resultados</div>
                    <button onClick={limpQ} style={{background:"linear-gradient(135deg,#d4a017,#f0c040)",border:"none",borderRadius:"12px",padding:"12px 24px",fontSize:"13px",fontWeight:800,color:"#1a2a3a",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>Ver todos</button>
                  </div>
                ) : (
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",padding:"8px 16px 16px"}}>
                    {resTxt.map((a,i)=><TarjetaAnuncio key={a.id} a={a} fmt={fmt} qLow={qLow} query={query} modoConexion={modoConexion} seleccionado={seleccionados.has(a.id)} onToggle={()=>toggleSeleccion(a.id)} esPrimero={i===0&&(a.visitas_semana||0)>0} />)}
                  </div>
                )}
              </div>
            ) : (
              <>
                {rubrosM.map(rubro => {
                  const items = getAnus(rubro);
                  if (ubiActiva && !rSel && items.length===0) return null;
                  return (
                    <div key={rubro.id} style={{marginBottom:"8px",background:"#fff",paddingBottom:"12px",borderBottom:"6px solid #f4f4f2"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px 8px"}}>
                        <button onClick={()=>{
                          const p = new URLSearchParams();
                          if (provSel) p.set("provincia", provSel);
                          if (ciudSel) p.set("ciudad", ciudSel);
                          router.push(`/categoria/${rubro.id}${p.toString()?"?"+p.toString():""}`);
                        }}
                          style={{fontSize:"16px",fontWeight:900,color:"#1a2a3a",background:"none",border:"none",cursor:"pointer",fontFamily:"'Nunito',sans-serif",padding:0,textAlign:"left"}}>
                          {rubro.nombre} →
                        </button>
                        <span onClick={()=>{
                          const p = new URLSearchParams();
                          if (provSel) p.set("provincia", provSel);
                          if (ciudSel) p.set("ciudad", ciudSel);
                          router.push(`/categoria/${rubro.id}${p.toString()?"?"+p.toString():""}`);
                        }} style={{fontSize:"12px",fontWeight:700,color:"#d4a017",cursor:"pointer"}}>Ver todos →</span>
                      </div>
                      <div style={{display:"flex",gap:"8px",padding:"0 16px 12px",overflowX:"auto",scrollbarWidth:"none"}}>
                        {rubro.subrubros.map((sub:any)=>(
                          <button key={sub.id} onClick={()=>togSub(rubro.id,sub.id)} style={{background:subAct[rubro.id]===sub.id?"#1a2a3a":"#f4f4f2",border:`2px solid ${subAct[rubro.id]===sub.id?"#1a2a3a":"#e8e8e6"}`,borderRadius:"20px",padding:"5px 14px",fontSize:"12px",fontWeight:700,color:subAct[rubro.id]===sub.id?"#d4a017":"#2c2c2e",whiteSpace:"nowrap",cursor:"pointer",flexShrink:0,fontFamily:"'Nunito',sans-serif"}}>
                            {sub.nombre}
                          </button>
                        ))}
                      </div>
                      {items.length===0 ? (
                        <div style={{padding:"12px 16px",color:"#9a9a9a",fontSize:"13px",fontWeight:600}}>Sin anuncios{ubiActiva?` en ${barrSel||ciudSel||provSel}`:""}</div>
                      ) : (
                        <div style={{display:"flex",gap:"12px",padding:"0 16px",overflowX:"auto",scrollbarWidth:"none"}}>
                          {items.map((a,i)=><TarjetaAnuncio key={a.id} a={a} fmt={fmt} horizontal modoConexion={modoConexion} seleccionado={seleccionados.has(a.id)} onToggle={()=>toggleSeleccion(a.id)} esPrimero={i===0&&(a.visitas_semana||0)>0} />)}
                        </div>
                      )}
                    </div>
                  );
                })}
                {!busLibre && !loading && anuSinCategoria.length > 0 && (
                  <div style={{marginBottom:"8px",background:"#fff",paddingBottom:"12px",borderBottom:"6px solid #f4f4f2"}}>
                    <div style={{padding:"14px 16px 8px"}}><span style={{fontSize:"16px",fontWeight:900,color:"#1a2a3a"}}>📦 Otros</span></div>
                    <div style={{display:"flex",gap:"12px",padding:"0 16px",overflowX:"auto",scrollbarWidth:"none"}}>
                      {anuSinCategoria.slice(0,8).map(a=><TarjetaAnuncio key={a.id} a={a} fmt={fmt} horizontal modoConexion={modoConexion} seleccionado={seleccionados.has(a.id)} onToggle={()=>toggleSeleccion(a.id)} />)}
                    </div>
                  </div>
                )}
              </>
            )
          )}

          {tipoActivo === "grupos" && (
            <div>
              {(nexosPorTipo["grupos"]||[]).length === 0 ? (
                <div style={{textAlign:"center",padding:"50px 20px"}}>
                  <div style={{fontSize:"48px",marginBottom:"12px"}}>👥</div>
                  <div style={{fontSize:"16px",fontWeight:900,color:"#1a2a3a",marginBottom:"6px"}}>No hay grupos todavía</div>
                  <div style={{fontSize:"13px",color:"#9a9a9a",fontWeight:600,marginBottom:"20px"}}>Sé el primero en crear uno</div>
                  <button onClick={()=>router.push("/publicar")}
                    style={{background:"linear-gradient(135deg,#3a7bd5cc,#3a7bd5)",border:"none",borderRadius:"12px",padding:"12px 24px",fontSize:"13px",fontWeight:900,color:"#fff",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>
                    ➕ Crear grupo
                  </button>
                </div>
              ) : (() => {
                const grupos = nexosPorTipo["grupos"] || [];
                const sinCat = grupos.filter(g => !g.subtipo);
                const cats = grupoCats.length > 0 ? grupoCats : [];
                const bloques = cats.length > 0
                  ? cats.map(c => ({ cat: c, items: grupos.filter(g => g.subtipo === String(c.id)) })).filter(b => b.items.length > 0)
                  : [{ cat: { id:0, nombre:"Grupos", emoji:"👥" }, items: grupos }];
                if (sinCat.length > 0) bloques.push({ cat:{ id:-1, nombre:"Otros grupos", emoji:"✨" }, items: sinCat });
                return bloques.map(bloque => (
                  <div key={bloque.cat.id} style={{marginBottom:"8px",background:"#fff",paddingBottom:"14px",borderBottom:"6px solid #f4f4f2"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px 10px"}}>
                      <span onClick={()=>router.push(`/grupos/categoria/${bloque.cat.id}`)}
                        style={{fontSize:"16px",fontWeight:900,color:"#1a2a3a",cursor:"pointer",display:"flex",alignItems:"center",gap:"6px"}}>
                        {bloque.cat.emoji} {bloque.cat.nombre}
                        <span style={{fontSize:"12px",fontWeight:600,color:"#9a9a9a"}}>({bloque.items.length})</span>
                        <span style={{fontSize:"12px",color:"#3a7bd5"}}>→</span>
                      </span>
                      <span onClick={()=>router.push(`/grupos/categoria/${bloque.cat.id}`)}
                        style={{fontSize:"12px",fontWeight:700,color:"#3a7bd5",cursor:"pointer"}}>Ver todos →</span>
                    </div>
                    <div style={{display:"flex",gap:"12px",padding:"0 16px",overflowX:"auto",scrollbarWidth:"none",WebkitOverflowScrolling:"touch"}}>
                      {bloque.items.slice(0,8).map(n => (
                        <TarjetaGrupoSlider key={n.id} nexo={n} onNavigate={()=>router.push(`/grupos/${n.id}`)} />
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}

          {tipoActivo !== "anuncios" && tipoActivo !== "grupos" && (
            <div style={{padding:"16px",display:"flex",flexDirection:"column",gap:"12px"}}>
              {(nexosPorTipo[tipoActivo]||[]).length === 0 ? (
                <div style={{textAlign:"center",padding:"50px 20px"}}>
                  <div style={{fontSize:"48px",marginBottom:"12px"}}>{TIPOS.find(t=>t.key===tipoActivo)?.emoji}</div>
                  <div style={{fontSize:"16px",fontWeight:900,color:"#1a2a3a",marginBottom:"6px"}}>
                    No hay {TIPOS.find(t=>t.key===tipoActivo)?.label.toLowerCase()} todavía
                  </div>
                  <div style={{fontSize:"13px",color:"#9a9a9a",fontWeight:600,marginBottom:"20px"}}>Sé el primero en crear uno</div>
                  <button onClick={()=>router.push("/publicar")}
                    style={{background:`linear-gradient(135deg,${colorActivo}cc,${colorActivo})`,border:"none",borderRadius:"12px",padding:"12px 24px",fontSize:"13px",fontWeight:900,color:"#fff",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>
                    ➕ Crear {TIPOS.find(t=>t.key===tipoActivo)?.label.slice(0,-1)}
                  </button>
                </div>
              ) : (
                (nexosPorTipo[tipoActivo]||[]).map((n, i) => (
                  <TarjetaNexo key={n.id} nexo={n} color={colorActivo} onNavigate={()=>router.push(`/nexo/${n.id}`)} esPrimero={i === 0 && (n.visitas_semana || 0) > 0} />
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* PANEL CONEXIÓN */}
      {modoConexion && (
        <div style={{position:"fixed",bottom:"110px",left:0,right:0,zIndex:100,padding:"0 16px 12px"}}>
          {resultadoConex ? (
            <div style={{background:"linear-gradient(135deg,#f0c040,#d4a017)",borderRadius:"14px",padding:"14px 18px",textAlign:"center",fontSize:"14px",fontWeight:900,color:"#1a2a3a",boxShadow:"0 4px 0 #a07810"}}>
              {resultadoConex}
            </div>
          ) : (
            <div style={{background:"linear-gradient(135deg,#1a2a3a,#243b55)",borderRadius:"14px",padding:"12px 14px",boxShadow:"0 6px 0 #0a1015",border:"2px solid #d4a017"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"10px"}}>
                <span style={{fontSize:"13px",fontWeight:900,color:"#fff"}}>
                  {seleccionados.size>0?`🔗 ${seleccionados.size} anuncio${seleccionados.size!==1?"s":""}  ·  ${seleccionados.size} BIT`:"Tocá los anuncios"}
                </span>
                <span style={{background:"rgba(212,160,23,0.2)",borderRadius:"20px",padding:"2px 10px",fontSize:"11px",fontWeight:800,color:"#d4a017",border:"1px solid rgba(212,160,23,0.4)"}}>
                  Tenés {bits} BIT
                </span>
              </div>
              <button onClick={()=>{ if(seleccionados.size===0) return; setPopupConexion(true); }}
                disabled={seleccionados.size===0||conectando}
                style={{width:"100%",background:seleccionados.size===0?"rgba(255,255,255,0.06)":"linear-gradient(135deg,#f0c040,#d4a017)",border:"none",borderRadius:"10px",padding:"12px",fontSize:"14px",fontWeight:900,color:seleccionados.size===0?"rgba(255,255,255,0.25)":"#1a2a3a",cursor:seleccionados.size===0?"not-allowed":"pointer",fontFamily:"'Nunito',sans-serif",boxShadow:seleccionados.size===0?"none":"0 4px 0 #a07810"}}>
                {conectando?"Conectando...":seleccionados.size>0?`Conectar con ${seleccionados.size} anuncio${seleccionados.size!==1?"s":""} (${seleccionados.size} BIT)`:"Seleccioná anuncios"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* POPUP MENSAJE */}
      {popupConexion && (
        <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.65)",display:"flex",alignItems:"flex-end",padding:"16px"}}>
          <div style={{width:"100%",background:"#fff",borderRadius:"20px 20px 16px 16px",padding:"24px 20px 20px",boxShadow:"0 -8px 40px rgba(0,0,0,0.3)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"18px"}}>
              <div>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"22px",color:"#1a2a3a",letterSpacing:"1px"}}>🔗 Mensaje de conexión</div>
                <div style={{fontSize:"12px",color:"#9a9a9a",fontWeight:600}}>Se enviará a {seleccionados.size} anuncio{seleccionados.size!==1?"s":""} · {seleccionados.size} BIT</div>
              </div>
              <button onClick={()=>setPopupConexion(false)} style={{background:"#f0f0f0",border:"none",borderRadius:"50%",width:"32px",height:"32px",fontSize:"16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"8px",marginBottom:"14px"}}>
              {MENSAJES_PRESET.map((m,i) => (
                <button key={i} onClick={()=>setMensajeConexion(m)} style={{textAlign:"left",background:mensajeConexion===m?"linear-gradient(135deg,#fff8e0,#fff3c0)":"#f8f8f8",border:mensajeConexion===m?"2px solid #d4a017":"2px solid transparent",borderRadius:"12px",padding:"10px 14px",fontSize:"13px",fontWeight:700,color:"#1a2a3a",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>
                  {mensajeConexion===m && <span style={{color:"#d4a017",marginRight:"6px"}}>✓</span>}{m}
                </button>
              ))}
            </div>
            <div style={{marginBottom:"16px"}}>
              <textarea value={mensajeConexion} onChange={e=>setMensajeConexion(e.target.value)} maxLength={200} rows={3}
                style={{width:"100%",borderRadius:"12px",border:"2px solid #e8e8e8",padding:"10px 14px",fontSize:"13px",fontWeight:600,color:"#1a2a3a",fontFamily:"'Nunito',sans-serif",resize:"none",outline:"none",boxSizing:"border-box"}}
                placeholder="Escribí tu mensaje..." />
            </div>
            <button onClick={()=>{ if(!mensajeConexion.trim()) return; setPopupConexion(false); setPopupPago(true); }}
              style={{width:"100%",background:"linear-gradient(135deg,#f0c040,#d4a017)",border:"none",borderRadius:"12px",padding:"14px",fontSize:"15px",fontWeight:900,color:"#1a2a3a",cursor:"pointer",fontFamily:"'Nunito',sans-serif",boxShadow:"0 4px 0 #a07810"}}>
              🔗 Conectar con anuncio
            </button>
          </div>
        </div>
      )}

      {/* ── FIX: PopupCompra con bolsillos correctos y metodo pasado a ejecutarConexion ── */}
      {popupPago && (
        <PopupCompra
          titulo={`Conectar con ${seleccionados.size} anuncio${seleccionados.size!==1?"s":""}`}
          emoji="🔗" costo={`${seleccionados.size} BIT`}
          descripcion="Se enviará tu mensaje a los anuncios seleccionados"
          bits={{ free: bitsFree, nexo: bitsNexo, promo: bitsPromo }}
          onClose={() => setPopupPago(false)}
          onPagar={async (metodo: MetodoPago) => {
            setPopupPago(false);
            if (metodo === "bit_free" || metodo === "bit_nexo") await ejecutarConexion(metodo);
            else alert("Próximamente");
          }}
        />
      )}

      <BottomNav />
    </main>
  );
}

function TarjetaAnuncio({ a, fmt, qLow, query, horizontal, modoConexion, seleccionado, onToggle, esPrimero }: {
  a:Anuncio; fmt:(p:number,m:string)=>string; qLow?:string; query?:string;
  horizontal?:boolean; modoConexion:boolean; seleccionado:boolean; onToggle:()=>void; esPrimero?:boolean;
}) {
  const f = F[a.fuente]||F.nexonet;
  const tieneWA = !!a.owner_whatsapp;
  return (
    <div onClick={modoConexion ? onToggle : undefined} style={{flexShrink:horizontal?0:undefined,width:horizontal?"160px":undefined,position:"relative",cursor:modoConexion?"pointer":undefined}}>
      {esPrimero && (
        <div style={{position:"absolute",top:"-6px",right:"-4px",zIndex:12,background:"linear-gradient(135deg,#ff6b00,#ff4500)",borderRadius:"8px",padding:"2px 7px",fontSize:"10px",fontWeight:900,color:"#fff",boxShadow:"0 2px 6px rgba(255,69,0,0.4)"}}>🔥</div>
      )}
      {modoConexion && <div style={{position:"absolute",inset:0,zIndex:10,borderRadius:"14px",border:`3px solid ${seleccionado?"#d4a017":"rgba(212,160,23,0.4)"}`,background:seleccionado?"rgba(212,160,23,0.15)":"transparent",transition:"all .15s",pointerEvents:"none"}} />}
      {modoConexion && (
        <div style={{position:"absolute",top:"8px",right:"8px",zIndex:11,width:"24px",height:"24px",borderRadius:"50%",background:seleccionado?"#d4a017":"rgba(255,255,255,0.9)",border:`2px solid ${seleccionado?"#d4a017":"#ccc"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px",boxShadow:"0 2px 6px rgba(0,0,0,0.2)"}}>
          {seleccionado && <span style={{color:"#fff",fontWeight:900}}>✓</span>}
        </div>
      )}
      <a href={modoConexion ? undefined : `/anuncios/${a.id}`} style={{textDecoration:"none",display:"block"}} onClick={e=>modoConexion&&e.preventDefault()}>
        <div style={{background:"#fff",borderRadius:"14px",overflow:"hidden",boxShadow:"0 2px 10px rgba(0,0,0,0.08)",border:esPrimero?"2px solid #ff6b00":"1px solid #f0f0f0"}}>
          <div style={{background:f.color,padding:"3px 8px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:"9px",fontWeight:900,color:f.texto,textTransform:"uppercase"}}>{a.owner_nombre||f.label}</span>
            <div style={{display:"flex",alignItems:"center",gap:"4px"}}>
              {a.flash&&<span style={{background:"#1a2a3a",color:"#d4a017",fontSize:"8px",fontWeight:900,padding:"1px 5px",borderRadius:"5px"}}>⚡Flash</span>}
              <div style={{width:"16px",height:"16px",borderRadius:"50%",background:tieneWA?"#25d366":"rgba(0,0,0,0.18)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"9px",opacity:tieneWA?1:0.35,flexShrink:0}}>📱</div>
            </div>
          </div>
          <div style={{width:"100%",height:"110px",background:"#f4f4f2",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
            {a.imagenes?.[0]?<img src={a.imagenes[0]} alt={a.titulo} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:"36px"}}>📦</span>}
          </div>
          <div style={{padding:"8px 10px 10px"}}>
            <div style={{fontSize:"11px",color:"#9a9a9a",fontWeight:700,marginBottom:"2px",textTransform:"uppercase",letterSpacing:"0.5px"}}>{a.subrubro_nombre}</div>
            <div style={{fontSize:"12px",fontWeight:800,color:"#2c2c2e",marginBottom:"3px",overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>
              {qLow&&query ? a.titulo.split(new RegExp(`(${query})`, "gi")).map((p:string,i:number)=>
                p.toLowerCase()===qLow?<mark key={i} style={{background:"#fff3cd",color:"#1a2a3a",borderRadius:"3px",padding:"0 2px"}}>{p}</mark>:p) : a.titulo}
            </div>
            <div style={{fontSize:"14px",fontWeight:900,color:"#d4a017"}}>{fmt(a.precio,a.moneda)}</div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:"2px"}}>
              <div style={{fontSize:"11px",color:"#9a9a9a",fontWeight:600}}>📍 {a.ciudad}</div>
              {tieneWA && <span style={{background:"rgba(37,211,102,0.15)",border:"1px solid rgba(37,211,102,0.4)",borderRadius:"20px",padding:"1px 7px",fontSize:"9px",fontWeight:900,color:"#1a7a4a"}}>WA</span>}
            </div>
            {a.owner_insignia_logro && a.owner_insignia_logro !== "ninguna" && (
              <div style={{marginTop:"3px"}}><InsigniaLogro nivel={a.owner_insignia_logro} size="xs" /></div>
            )}
          </div>
        </div>
      </a>
    </div>
  );
}

function TarjetaGrupoSlider({ nexo, onNavigate }: { nexo:Nexo; onNavigate:()=>void }) {
  return (
    <div onClick={onNavigate} style={{flexShrink:0,width:"150px",cursor:"pointer"}}>
      <div style={{background:"#fff",borderRadius:"14px",overflow:"hidden",boxShadow:"0 2px 10px rgba(0,0,0,0.08)",border:"2px solid rgba(58,123,213,0.15)"}}>
        <div style={{width:"100%",height:"90px",background:"linear-gradient(135deg,#1a2a3a,#243b55)",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",position:"relative"}}>
          {nexo.avatar_url
            ? <img src={nexo.avatar_url} alt={nexo.titulo} style={{width:"100%",height:"100%",objectFit:"cover"}} />
            : <span style={{fontSize:"36px",opacity:0.5}}>👥</span>
          }
          {nexo.config?.tipo_acceso === "pago" && (
            <div style={{position:"absolute",top:"6px",right:"6px",background:"rgba(212,160,23,0.95)",borderRadius:"8px",padding:"2px 7px",fontSize:"9px",fontWeight:900,color:"#1a2a3a"}}>💰 500 BIT</div>
          )}
        </div>
        <div style={{padding:"8px 10px 10px"}}>
          <div style={{fontSize:"12px",fontWeight:800,color:"#1a2a3a",overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" as any,marginBottom:"4px"}}>
            {nexo.titulo}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
            <span style={{fontSize:"10px",color:"#9a9a9a",fontWeight:600}}>👥 {nexo.miembros_count||0}</span>
            {nexo.ciudad && <span style={{fontSize:"10px",color:"#9a9a9a",fontWeight:600}}>· {nexo.ciudad}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function TarjetaNexo({ nexo, color, onNavigate, esPrimero }: { nexo:Nexo; color:string; onNavigate:()=>void; esPrimero?:boolean }) {
  const SUBTIPO_EMOJIS: Record<string,string> = {
    emprendimiento:"🚀", curso:"🎓", consorcio:"🏢", deportivo:"⚽",
    estudio:"📚", venta:"🛒", artistas:"🎨", vecinos:"🏘️", generico:"✨",
  };
  const TIPO_EMOJIS: Record<string,string> = {
    grupo:"👥", empresa:"🏢", servicio:"🛠️", trabajo:"💼",
  };
  const emoji = nexo.subtipo ? (SUBTIPO_EMOJIS[nexo.subtipo]||"✨") : (TIPO_EMOJIS[nexo.tipo]||"✨");
  return (
    <div onClick={onNavigate} style={{background:"#fff",borderRadius:"16px",overflow:"hidden",boxShadow:"0 2px 10px rgba(0,0,0,0.07)",cursor:"pointer",display:"flex",alignItems:"stretch",border:esPrimero?`2px solid #ff6b00`:`2px solid ${color}20`,position:"relative"}}>
      {esPrimero && (
        <div style={{position:"absolute",top:"-6px",right:"-4px",zIndex:2,background:"linear-gradient(135deg,#ff6b00,#ff4500)",borderRadius:"8px",padding:"2px 7px",fontSize:"10px",fontWeight:900,color:"#fff",boxShadow:"0 2px 6px rgba(255,69,0,0.4)"}}>🔥</div>
      )}
      <div style={{width:"80px",flexShrink:0,background:`linear-gradient(135deg,${color}33,${color}11)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"32px",position:"relative",overflow:"hidden"}}>
        {nexo.avatar_url
          ? <img src={nexo.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} />
          : <span>{emoji}</span>
        }
        <div style={{position:"absolute",top:"6px",left:"6px",background:color,borderRadius:"20px",padding:"2px 7px",fontSize:"9px",fontWeight:900,color:"#fff",textTransform:"uppercase"}}>
          {nexo.tipo}
        </div>
      </div>
      <div style={{flex:1,padding:"12px 14px",minWidth:0}}>
        <div style={{fontSize:"14px",fontWeight:900,color:"#1a2a3a",marginBottom:"3px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
          {nexo.titulo}
        </div>
        {nexo.descripcion && (
          <div style={{fontSize:"12px",color:"#9a9a9a",fontWeight:600,marginBottom:"6px",overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" as any}}>
            {nexo.descripcion}
          </div>
        )}
        <div style={{display:"flex",gap:"8px",alignItems:"center",flexWrap:"wrap"}}>
          {nexo.ciudad && <span style={{fontSize:"11px",color:"#9a9a9a",fontWeight:600}}>📍 {nexo.ciudad}</span>}
          {nexo.tipo==="grupo" && <span style={{fontSize:"11px",color:"#9a9a9a",fontWeight:600}}>👥 {nexo.miembros_count||0} miembros</span>}
          {nexo.tipo==="grupo" && nexo.config?.tipo_acceso==="pago" && (
            <span style={{background:`${color}18`,color,borderRadius:"20px",padding:"2px 8px",fontSize:"10px",fontWeight:800}}>💰 500 BIT</span>
          )}
          {nexo.precio && <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"16px",color}}>${nexo.precio.toLocaleString("es-AR")}</span>}
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",paddingRight:"12px",color:`${color}80`,fontSize:"20px",flexShrink:0}}>›</div>
    </div>
  );
}

function SelUbi({value,placeholder,opciones,onChange}:{value:string;placeholder:string;opciones:string[];onChange:(v:string)=>void}) {
  const [open,setOpen]=useState(false);const [filtro,setFiltro]=useState("");const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{const h=(e:MouseEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node)){setOpen(false);setFiltro("");}};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[]);
  const lista=opciones.filter(o=>o.toLowerCase().includes(filtro.toLowerCase()));
  return(
    <div ref={ref} style={{flex:1,position:"relative",minWidth:0}}>
      <button onClick={()=>{setOpen(v=>!v);setFiltro("");}} style={{width:"100%",height:"42px",background:value?"#d4a017":"rgba(255,255,255,0.12)",border:`2px solid ${value?"#d4a017":"rgba(255,255,255,0.3)"}`,borderRadius:"12px",padding:"0 10px",fontSize:"12px",fontWeight:800,color:value?"#1a2a3a":"#fff",cursor:"pointer",fontFamily:"'Nunito',sans-serif",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"4px",overflow:"hidden"}}>
        <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{value||placeholder}</span>
        <span style={{fontSize:"10px",opacity:0.7,flexShrink:0}}>{open?"▲":"▼"}</span>
      </button>
      {open&&(
        <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,zIndex:300,background:"#fff",borderRadius:"12px",boxShadow:"0 8px 32px rgba(0,0,0,0.25)",border:"1px solid #e8e8e6",maxHeight:"260px",display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{padding:"8px",borderBottom:"1px solid #f0f0f0",flexShrink:0}}>
            <input autoFocus type="text" value={filtro} onChange={e=>setFiltro(e.target.value)} placeholder="Buscar..." style={{width:"100%",border:"2px solid #e8e8e6",borderRadius:"8px",padding:"7px 10px",fontSize:"13px",fontFamily:"'Nunito',sans-serif",outline:"none",boxSizing:"border-box",color:"#1a2a3a"}}/>
          </div>
          <div style={{overflowY:"auto",flex:1}}>
            {value&&<div onClick={()=>{onChange("");setOpen(false);setFiltro("");}} style={{padding:"10px 14px",fontSize:"12px",fontWeight:700,color:"#e74c3c",cursor:"pointer",borderBottom:"1px solid #f9f9f9"}}>✕ Limpiar</div>}
            {lista.length===0?<div style={{padding:"16px",textAlign:"center",fontSize:"13px",color:"#9a9a9a"}}>Sin resultados</div>
            :lista.map(o=><div key={o} onClick={()=>{onChange(o);setOpen(false);setFiltro("");}} style={{padding:"10px 14px",fontSize:"13px",fontWeight:o===value?800:600,color:o===value?"#d4a017":"#1a2a3a",background:o===value?"rgba(212,160,23,0.08)":"transparent",cursor:"pointer",borderLeft:o===value?"3px solid #d4a017":"3px solid transparent"}}>{o}</div>)}
          </div>
        </div>
      )}
    </div>
  );
}

const dItem=(activo:boolean):React.CSSProperties=>({display:"flex",alignItems:"center",gap:"12px",padding:"12px 14px",cursor:"pointer",background:activo?"rgba(212,160,23,0.08)":"transparent",borderLeft:activo?"3px solid #d4a017":"3px solid transparent"});
