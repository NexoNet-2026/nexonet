"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";

type TabAdmin = "sliders" | "miembros" | "descargas" | "info" | "config";

const SLIDER_EMOJIS: Record<string,string> = {
  galeria:"📸", videos:"🎬", documentos:"📄", descargas:"📥", productos:"🛒",
  novedades:"📢", proveedores:"🏭", faq:"❓", facturas:"🧾", calendario:"📅",
  equipo:"👤", servicios:"🛠️", portfolio:"🎨", testimonios:"💬", certificados:"🏅",
  mensajes:"💬", chat:"💬", personalizado:"✨",
};

const TIPO_COLORES: Record<string,string> = {
  anuncio:"#d4a017", empresa:"#c0392b", servicio:"#27ae60", trabajo:"#8e44ad", grupo:"#3a7bd5",
};

const SLIDERS_CATALOGO = [
  { tipo:"galeria",      emoji:"📸", titulo:"Galería de fotos",    desc:"Imágenes" },
  { tipo:"videos",       emoji:"🎬", titulo:"Videos",              desc:"Clips" },
  { tipo:"documentos",   emoji:"📄", titulo:"Documentos",          desc:"PDFs y archivos" },
  { tipo:"descargas",    emoji:"📥", titulo:"Descargas",           desc:"Gratis y de pago" },
  { tipo:"productos",    emoji:"🛒", titulo:"Productos",           desc:"Catálogo" },
  { tipo:"novedades",    emoji:"📢", titulo:"Novedades",           desc:"Anuncios" },
  { tipo:"proveedores",  emoji:"🏭", titulo:"Proveedores",         desc:"Nexos proveedor" },
  { tipo:"faq",          emoji:"❓", titulo:"Preguntas frecuentes",desc:"FAQ" },
  { tipo:"facturas",     emoji:"🧾", titulo:"Facturas",            desc:"Comprobantes" },
  { tipo:"calendario",   emoji:"📅", titulo:"Calendario",         desc:"Eventos" },
  { tipo:"equipo",       emoji:"👤", titulo:"Equipo / Miembros",   desc:"Perfiles" },
  { tipo:"servicios",    emoji:"🛠️", titulo:"Servicios",           desc:"Oferta" },
  { tipo:"portfolio",    emoji:"🎨", titulo:"Portfolio",           desc:"Trabajos" },
  { tipo:"testimonios",  emoji:"💬", titulo:"Testimonios",         desc:"Opiniones" },
  { tipo:"certificados", emoji:"🏅", titulo:"Certificados",        desc:"Títulos" },
  { tipo:"mensajes",     emoji:"💬", titulo:"Chat",                desc:"Mensajes internos" },
];

export default function NexoAdminPage() {
  const router = useRouter();
  const params = useParams();
  const id     = params?.id as string;

  const [nexo,         setNexo]         = useState<any>(null);
  const [perfil,       setPerfil]       = useState<any>(null);
  const [tab,          setTab]          = useState<TabAdmin>("sliders");
  const [sliders,      setSliders]      = useState<any[]>([]);
  const [miembros,     setMiembros]     = useState<any[]>([]);
  const [descargas,    setDescargas]    = useState<any[]>([]);
  const [cargando,     setCargando]     = useState(true);
  const [guardando,    setGuardando]    = useState(false);
  const [subiendoImg,  setSubiendoImg]  = useState<string|null>(null);
  const [popupSlider,  setPopupSlider]  = useState(false);
  const [popupItem,    setPopupItem]    = useState<{slider:any}|null>(null);
  const [popupDescarga,setPopupDescarga]= useState(false);
  const [sliderItems,  setSliderItems]  = useState<Record<string,any[]>>({});
  const [sliderAbierto,setSliderAbierto]= useState<string|null>(null);
  const [customTitulo, setCustomTitulo] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const [formInfo, setFormInfo] = useState({
    titulo:"", descripcion:"", precio:"", ciudad:"", provincia:"",
    whatsapp:"", link_externo:"", banner_url:"", avatar_url:"",
  });
  const [formItem, setFormItem]   = useState({ titulo:"", descripcion:"", url:"", tipo:"imagen", precio_bits:"0" });
  const [formDesc, setFormDesc]   = useState({ titulo:"", descripcion:"", url:"", tipo_archivo:"pdf", precio_bits:"10" });

  useEffect(() => {
    const cargar = async () => {
      const { data:{ session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      const { data: u } = await supabase.from("usuarios").select("*").eq("id", session.user.id).single();
      setPerfil(u);

      const { data: n } = await supabase.from("nexos").select("*").eq("id", id).single();
      if (!n || n.usuario_id !== session.user.id) { router.push(`/nexo/${id}`); return; }
      setNexo(n);
      setFormInfo({ titulo:n.titulo||"", descripcion:n.descripcion||"", precio:n.precio||"", ciudad:n.ciudad||"", provincia:n.provincia||"", whatsapp:n.whatsapp||"", link_externo:n.link_externo||"", banner_url:n.banner_url||"", avatar_url:n.avatar_url||"" });

      const [{ data: sls }, { data: mbs }, { data: desc }] = await Promise.all([
        supabase.from("nexo_sliders").select("*").eq("nexo_id",id).order("orden"),
        supabase.from("nexo_miembros").select("*, usuarios(id,nombre_usuario,codigo,avatar_url,plan)").eq("nexo_id",id).order("created_at"),
        supabase.from("nexo_descargas").select("*").eq("nexo_id",id).order("created_at",{ascending:false}),
      ]);
      setSliders(sls||[]);
      setMiembros(mbs||[]);
      setDescargas(desc||[]);
      setCargando(false);
    };
    cargar();
  }, [id]);

  const colorNexo = TIPO_COLORES[nexo?.tipo] || "#d4a017";

  // ── SLIDERS ──
  const cargarItemsSlider = async (sliderId: string) => {
    if (sliderItems[sliderId]) return;
    const { data } = await supabase.from("nexo_slider_items").select("*").eq("slider_id",sliderId).order("orden");
    setSliderItems(prev => ({ ...prev, [sliderId]: data||[] }));
  };

  const toggleSlider = async (sliderId: string) => {
    if (sliderAbierto === sliderId) { setSliderAbierto(null); return; }
    setSliderAbierto(sliderId);
    await cargarItemsSlider(sliderId);
  };

  const moverSlider = async (idx: number, dir: -1|1) => {
    const arr = [...sliders];
    const dest = idx + dir;
    if (dest < 0 || dest >= arr.length) return;
    [arr[idx], arr[dest]] = [arr[dest], arr[idx]];
    const updated = arr.map((s,i) => ({ ...s, orden:i }));
    setSliders(updated);
    await Promise.all(updated.map(s => supabase.from("nexo_sliders").update({ orden:s.orden }).eq("id",s.id)));
  };

  const toggleActivoSlider = async (s: any) => {
    const nuevo = !s.activo;
    await supabase.from("nexo_sliders").update({ activo:nuevo }).eq("id",s.id);
    setSliders(prev => prev.map(x => x.id===s.id ? {...x,activo:nuevo} : x));
  };

  const renombrarSlider = async (s: any, titulo: string) => {
    await supabase.from("nexo_sliders").update({ titulo }).eq("id",s.id);
    setSliders(prev => prev.map(x => x.id===s.id ? {...x,titulo} : x));
  };

  const eliminarSlider = async (sliderId: string) => {
    if (!confirm("¿Eliminar este slider y todo su contenido?")) return;
    await supabase.from("nexo_slider_items").delete().eq("slider_id",sliderId);
    await supabase.from("nexo_sliders").delete().eq("id",sliderId);
    setSliders(prev => prev.filter(s=>s.id!==sliderId));
  };

  const agregarSlider = async (tipo: string, tituloCustom?: string) => {
    const cat = SLIDERS_CATALOGO.find(c=>c.tipo===tipo);
    const titulo = tituloCustom || cat?.titulo || tipo;
    const { data } = await supabase.from("nexo_sliders").insert({
      nexo_id:id, titulo, tipo, orden:sliders.length, activo:true
    }).select().single();
    if (data) setSliders(prev=>[...prev,data]);
    setPopupSlider(false);
    setCustomTitulo("");
  };

  // ── ITEMS ──
  const subirArchivoItem = async (e: React.ChangeEvent<HTMLInputElement>, campo="url") => {
    const file = e.target.files?.[0];
    if (!file || !perfil) return;
    setSubiendoImg("item");
    const ext  = file.name.split(".").pop();
    const path = `nexos/${id}/items/${Date.now()}.${ext}`;
    await supabase.storage.from("nexos").upload(path, file, { upsert:true });
    const { data } = supabase.storage.from("nexos").getPublicUrl(path);
    setFormItem(f => ({ ...f, url:data.publicUrl, tipo: detectarTipo(file.name) }));
    setSubiendoImg(null);
  };

  const subirArchivoDescarga = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !perfil) return;
    setSubiendoImg("desc");
    const ext  = file.name.split(".").pop();
    const path = `nexos/${id}/descargas/${Date.now()}.${ext}`;
    await supabase.storage.from("nexos").upload(path, file, { upsert:true });
    const { data } = supabase.storage.from("nexos").getPublicUrl(path);
    setFormDesc(f => ({ ...f, url:data.publicUrl, tipo_archivo:ext||"otro", titulo:f.titulo||file.name }));
    setSubiendoImg(null);
  };

  const detectarTipo = (nombre: string) => {
    const ext = nombre.split(".").pop()?.toLowerCase()||"";
    if (["jpg","jpeg","png","gif","webp"].includes(ext)) return "imagen";
    if (["mp4","webm","mov"].includes(ext)) return "video";
    if (ext==="pdf") return "pdf";
    if (["doc","docx"].includes(ext)) return "documento";
    return "archivo";
  };

  const agregarItem = async () => {
    if (!formItem.url || !popupItem) return;
    const { data } = await supabase.from("nexo_slider_items").insert({
      slider_id: popupItem.slider.id, nexo_id:id,
      titulo: formItem.titulo||null, descripcion:formItem.descripcion||null,
      url: formItem.url, tipo: formItem.tipo,
      precio_bits: parseInt(formItem.precio_bits)||0,
      orden: (sliderItems[popupItem.slider.id]||[]).length,
      publicado_por: perfil.id,
    }).select().single();
    if (data) {
      setSliderItems(prev => ({ ...prev, [popupItem.slider.id]: [...(prev[popupItem.slider.id]||[]), data] }));
    }
    setFormItem({ titulo:"", descripcion:"", url:"", tipo:"imagen", precio_bits:"0" });
    setPopupItem(null);
  };

  const eliminarItem = async (sliderId: string, itemId: string) => {
    if (!confirm("¿Eliminar este item?")) return;
    await supabase.from("nexo_slider_items").delete().eq("id",itemId);
    setSliderItems(prev => ({ ...prev, [sliderId]: (prev[sliderId]||[]).filter(i=>i.id!==itemId) }));
  };

  // ── DESCARGAS ──
  const agregarDescarga = async () => {
    if (!formDesc.url || !formDesc.titulo) return;
    const { data } = await supabase.from("nexo_descargas").insert({
      nexo_id:id, titulo:formDesc.titulo, descripcion:formDesc.descripcion||null,
      url:formDesc.url, precio_bits:parseInt(formDesc.precio_bits)||1,
      tipo_archivo:formDesc.tipo_archivo,
    }).select().single();
    if (data) setDescargas(prev=>[data,...prev]);
    setFormDesc({ titulo:"", descripcion:"", url:"", tipo_archivo:"pdf", precio_bits:"10" });
    setPopupDescarga(false);
  };

  const eliminarDescarga = async (descId: string) => {
    if (!confirm("¿Eliminar esta descarga?")) return;
    await supabase.from("nexo_descargas").delete().eq("id",descId);
    setDescargas(prev=>prev.filter(d=>d.id!==descId));
  };

  // ── MIEMBROS ──
  const accionMiembro = async (mId: string, accion: string) => {
    const updates: Record<string,any> = {
      aprobar:    { estado:"activo" },
      expulsar:   { estado:"expulsado" },
      bloquear:   { estado:"bloqueado" },
      hacer_mod:  { rol:"moderador" },
      quitar_mod: { rol:"miembro" },
    };
    if (accion==="silenciar") {
      const m = miembros.find(x=>x.id===mId);
      await supabase.from("nexo_miembros").update({ silenciado:!m?.silenciado }).eq("id",mId);
      setMiembros(prev=>prev.map(x=>x.id===mId?{...x,silenciado:!x.silenciado}:x));
      return;
    }
    if (!updates[accion]) return;
    if (["expulsar","bloquear"].includes(accion) && !confirm(`¿${accion} a este miembro?`)) return;
    await supabase.from("nexo_miembros").update(updates[accion]).eq("id",mId);
    if (["expulsar","bloquear"].includes(accion)) {
      setMiembros(prev=>prev.filter(x=>x.id!==mId));
    } else {
      setMiembros(prev=>prev.map(x=>x.id===mId?{...x,...updates[accion]}:x));
    }
  };

  // ── INFO ──
  const guardarInfo = async () => {
    setGuardando(true);
    await supabase.from("nexos").update({
      titulo:       formInfo.titulo,
      descripcion:  formInfo.descripcion||null,
      precio:       formInfo.precio?parseFloat(formInfo.precio):null,
      ciudad:       formInfo.ciudad||null,
      provincia:    formInfo.provincia||null,
      whatsapp:     formInfo.whatsapp||null,
      link_externo: formInfo.link_externo||null,
      banner_url:   formInfo.banner_url||null,
      avatar_url:   formInfo.avatar_url||null,
    }).eq("id",id);
    setGuardando(false);
    alert("✅ Guardado");
  };

  const subirImagenInfo = async (e: React.ChangeEvent<HTMLInputElement>, campo:"banner_url"|"avatar_url") => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendoImg(campo);
    const path = `nexos/${id}/${campo}_${Date.now()}.${file.name.split(".").pop()}`;
    await supabase.storage.from("nexos").upload(path, file, { upsert:true });
    const { data } = supabase.storage.from("nexos").getPublicUrl(path);
    const url = `${data.publicUrl}?t=${Date.now()}`;
    setFormInfo(f=>({...f,[campo]:url}));
    setSubiendoImg(null);
  };

  if (cargando) return <main style={{ paddingTop:"95px", textAlign:"center", color:"#9a9a9a", fontFamily:"'Nunito',sans-serif" }}>Cargando panel...</main>;

  const pendientes = miembros.filter(m=>m.estado==="pendiente");
  const activos    = miembros.filter(m=>m.estado==="activo");
  const TABS: {key:TabAdmin;emoji:string;label:string;badge?:number}[] = [
    { key:"sliders",   emoji:"📋", label:"Sliders"  },
    { key:"descargas", emoji:"📥", label:"Descargas" },
    { key:"miembros",  emoji:"👥", label:"Miembros", badge:pendientes.length||undefined },
    { key:"info",      emoji:"✏️", label:"Info"     },
    { key:"config",    emoji:"⚙️", label:"Config"   },
  ];

  return (
    <main style={{ paddingTop:"0", paddingBottom:"100px", background:"#f4f4f2", minHeight:"100vh", fontFamily:"'Nunito',sans-serif" }}>
      <Header />

      {/* HERO */}
      <div style={{ position:"relative", background: formInfo.banner_url?`url(${formInfo.banner_url}) center/cover no-repeat`:`linear-gradient(135deg,#1a2a3a,#2d4a6a)`, paddingTop:"95px", minHeight:"170px" }}>
        {formInfo.banner_url && <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.55)" }} />}
        <div style={{ position:"relative", zIndex:1, padding:"12px 16px 16px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"12px" }}>
            <button onClick={()=>router.push(`/nexo/${id}`)}
              style={{ background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:"10px", padding:"7px 13px", color:"#fff", fontSize:"13px", fontWeight:700, cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>← Volver</button>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"20px", color:colorNexo, letterSpacing:"1px" }}>Panel Admin</div>
            <div style={{ marginLeft:"auto", background:`${colorNexo}cc`, borderRadius:"20px", padding:"4px 12px", fontSize:"11px", fontWeight:900, color:"#fff" }}>👑 Creador</div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
            <div style={{ position:"relative" }}>
              <div style={{ width:"62px", height:"62px", borderRadius:"16px", overflow:"hidden", border:`3px solid ${colorNexo}60`, background:"#1a2a3a", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"26px" }}>
                {formInfo.avatar_url ? <img src={formInfo.avatar_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : "✨"}
              </div>
              <label style={{ position:"absolute", bottom:"-6px", right:"-6px", width:"24px", height:"24px", borderRadius:"50%", background:colorNexo, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", border:"2px solid #1a2a3a", fontSize:"11px" }}>
                {subiendoImg==="avatar_url"?"⏳":"📷"}
                <input type="file" accept="image/*" onChange={e=>subirImagenInfo(e,"avatar_url")} style={{ display:"none" }} />
              </label>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"22px", color:"#fff", letterSpacing:"1px", lineHeight:1 }}>{nexo?.titulo}</div>
              <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.5)", fontWeight:600, marginTop:"3px" }}>
                {activos.length} miembros · {sliders.length} sliders · {descargas.length} descargas
              </div>
            </div>
            <label style={{ background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:"10px", padding:"8px 11px", color:"rgba(255,255,255,0.7)", fontSize:"11px", fontWeight:700, cursor:"pointer", flexShrink:0, textAlign:"center" }}>
              {subiendoImg==="banner_url"?"⏳":"🖼️ Banner"}
              <input type="file" accept="image/*" onChange={e=>subirImagenInfo(e,"banner_url")} style={{ display:"none" }} />
            </label>
          </div>
        </div>
      </div>

      {/* TAB BAR */}
      <div style={{ position:"sticky", top:"60px", zIndex:100, background:"#1a2a3a", boxShadow:"0 2px 12px rgba(0,0,0,0.25)", display:"flex", overflowX:"auto", scrollbarWidth:"none" }}>
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)}
            style={{ flex:"0 0 auto", minWidth:"70px", background:"none", border:"none", cursor:"pointer", padding:"10px 6px 6px", display:"flex", flexDirection:"column", alignItems:"center", gap:"3px", borderBottom:tab===t.key?`3px solid ${colorNexo}`:"3px solid transparent", position:"relative" }}>
            <span style={{ fontSize:"17px" }}>{t.emoji}</span>
            {t.badge && <span style={{ position:"absolute", top:"5px", right:"6px", background:"#e74c3c", color:"#fff", borderRadius:"20px", fontSize:"9px", fontWeight:900, padding:"1px 5px" }}>{t.badge}</span>}
            <span style={{ fontSize:"9px", fontWeight:800, color:tab===t.key?colorNexo:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.5px" }}>{t.label}</span>
          </button>
        ))}
      </div>

      <div style={{ padding:"14px", maxWidth:"600px", margin:"0 auto" }}>

        {/* ══ SLIDERS ══ */}
        {tab==="sliders" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"4px" }}>
              <div style={{ fontSize:"11px", fontWeight:800, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"1px" }}>{sliders.length} sliders</div>
              <button onClick={()=>setPopupSlider(true)}
                style={{ background:`${colorNexo}18`, border:`2px solid ${colorNexo}40`, borderRadius:"10px", padding:"7px 14px", fontSize:"12px", fontWeight:900, color:colorNexo, cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
                ➕ Agregar slider
              </button>
            </div>

            {sliders.map((s, i) => (
              <div key={s.id} style={{ background:"#fff", borderRadius:"16px", overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,0.06)", border:`2px solid ${s.activo?"transparent":"#f0f0f0"}`, opacity:s.activo?1:0.6 }}>
                <div style={{ padding:"14px 16px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                    <span style={{ fontSize:"22px", flexShrink:0 }}>{SLIDER_EMOJIS[s.tipo]||"📋"}</span>
                    <input type="text" value={s.titulo}
                      onChange={e=>setSliders(prev=>prev.map(x=>x.id===s.id?{...x,titulo:e.target.value}:x))}
                      onBlur={e=>renombrarSlider(s,e.target.value)}
                      style={{ flex:1, border:"none", outline:"none", fontSize:"14px", fontWeight:800, color:"#1a2a3a", fontFamily:"'Nunito',sans-serif", background:"none" }} />
                    <span style={{ fontSize:"10px", color:"#9a9a9a", fontWeight:600, textTransform:"uppercase", flexShrink:0 }}>{s.tipo}</span>
                  </div>
                  <div style={{ display:"flex", gap:"6px", marginTop:"10px", flexWrap:"wrap" }}>
                    <MiniBtn emoji="↑"  onClick={()=>moverSlider(i,-1)} disabled={i===0} />
                    <MiniBtn emoji="↓"  onClick={()=>moverSlider(i,1)}  disabled={i===sliders.length-1} />
                    <MiniBtn emoji={s.activo?"👁️":"🙈"} onClick={()=>toggleActivoSlider(s)} color="#8e44ad" label={s.activo?"Visible":"Oculto"} />
                    <button onClick={()=>{ setPopupItem({slider:s}); toggleSlider(s.id); }}
                      style={{ background:`${colorNexo}18`, border:`1px solid ${colorNexo}40`, borderRadius:"8px", padding:"5px 12px", fontSize:"11px", fontWeight:800, color:colorNexo, cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
                      ➕ Agregar contenido
                    </button>
                    <button onClick={()=>toggleSlider(s.id)}
                      style={{ background:"rgba(58,123,213,0.1)", border:"1px solid rgba(58,123,213,0.25)", borderRadius:"8px", padding:"5px 12px", fontSize:"11px", fontWeight:800, color:"#3a7bd5", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
                      {sliderAbierto===s.id?"▲ Cerrar":"▼ Ver items"}
                    </button>
                    <MiniBtn emoji="🗑️" onClick={()=>eliminarSlider(s.id)} color="#e74c3c" />
                  </div>
                </div>

                {/* ITEMS DEL SLIDER */}
                {sliderAbierto===s.id && (
                  <div style={{ borderTop:"1px solid #f4f4f2", background:"#fafafa", padding:"12px 14px" }}>
                    {!(sliderItems[s.id]?.length) ? (
                      <div style={{ textAlign:"center", padding:"20px", color:"#bbb", fontSize:"13px", fontWeight:600 }}>Sin contenido todavía</div>
                    ) : (
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
                        {(sliderItems[s.id]||[]).map((item:any)=>(
                          <div key={item.id} style={{ background:"#fff", borderRadius:"12px", overflow:"hidden", border:"1px solid #f0f0f0", position:"relative" }}>
                            <div style={{ height:"80px", background:"linear-gradient(135deg,#1a2a3a,#243b55)", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
                              {item.tipo==="imagen" && <img src={item.url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />}
                              {item.tipo==="video"  && <video src={item.url} style={{ width:"100%", height:"100%", objectFit:"cover" }} />}
                              {(!["imagen","video"].includes(item.tipo)) && <span style={{ fontSize:"28px", opacity:0.5 }}>📄</span>}
                            </div>
                            <div style={{ padding:"8px 10px" }}>
                              <div style={{ fontSize:"11px", fontWeight:800, color:"#1a2a3a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.titulo||"Sin título"}</div>
                            </div>
                            <button onClick={()=>eliminarItem(s.id, item.id)}
                              style={{ position:"absolute", top:"4px", right:"4px", background:"rgba(231,76,60,0.85)", border:"none", borderRadius:"6px", width:"22px", height:"22px", fontSize:"11px", cursor:"pointer", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center" }}>🗑️</button>
                          </div>
                        ))}
                      </div>
                    )}
                    <button onClick={()=>setPopupItem({slider:s})}
                      style={{ width:"100%", marginTop:"10px", background:"rgba(212,160,23,0.08)", border:"2px dashed rgba(212,160,23,0.4)", borderRadius:"10px", padding:"10px", fontSize:"12px", fontWeight:800, color:"#d4a017", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
                      ➕ Agregar al slider
                    </button>
                  </div>
                )}
              </div>
            ))}

            {sliders.length===0 && (
              <div style={{ textAlign:"center", padding:"40px", background:"#fff", borderRadius:"16px" }}>
                <div style={{ fontSize:"40px", marginBottom:"12px" }}>📋</div>
                <div style={{ fontSize:"15px", fontWeight:900, color:"#1a2a3a" }}>Sin sliders todavía</div>
                <div style={{ fontSize:"12px", color:"#9a9a9a", fontWeight:600, marginTop:"4px" }}>Agregá el primero con el botón de arriba</div>
              </div>
            )}
          </div>
        )}

        {/* ══ DESCARGAS ══ */}
        {tab==="descargas" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ fontSize:"11px", fontWeight:800, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"1px" }}>{descargas.length} archivos</div>
              <button onClick={()=>setPopupDescarga(true)}
                style={{ background:"rgba(22,160,133,0.1)", border:"2px solid rgba(22,160,133,0.35)", borderRadius:"10px", padding:"7px 14px", fontSize:"12px", fontWeight:900, color:"#16a085", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
                ➕ Agregar descarga
              </button>
            </div>

            <div style={{ background:"rgba(22,160,133,0.08)", border:"2px dashed rgba(22,160,133,0.3)", borderRadius:"14px", padding:"12px 14px" }}>
              <div style={{ fontSize:"11px", fontWeight:800, color:"#16a085", marginBottom:"3px" }}>💡 BIT Descarga</div>
              <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600, lineHeight:1.6 }}>
                Cuando un miembro paga para descargar: vos recibís el <strong style={{ color:"#16a085" }}>80%</strong> y NexoNet retiene el <strong>20%</strong>.
              </div>
            </div>

            {descargas.map((d:any) => (
              <div key={d.id} style={{ background:"#fff", borderRadius:"16px", overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
                <div style={{ height:"100px", background:"linear-gradient(135deg,#1a2a3a,#243b55)", display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
                  <span style={{ fontSize:"44px", opacity:0.4 }}>{d.tipo_archivo==="pdf"?"📕":d.tipo_archivo==="video"?"🎬":d.tipo_archivo==="imagen"?"🖼️":"📄"}</span>
                  <div style={{ position:"absolute", top:"8px", left:"8px", background: d.precio_bits===0?"rgba(39,174,96,0.9)":"rgba(212,160,23,0.9)", borderRadius:"8px", padding:"3px 10px", fontSize:"11px", fontWeight:900, color:d.precio_bits===0?"#fff":"#1a2a3a" }}>
                    {d.precio_bits===0?"GRATIS":`${d.precio_bits} BIT`}
                  </div>
                  <div style={{ position:"absolute", top:"8px", right:"8px", background:"rgba(0,0,0,0.5)", borderRadius:"8px", padding:"3px 10px", fontSize:"10px", fontWeight:700, color:"#fff" }}>
                    📥 {d.descargas||0}
                  </div>
                </div>
                <div style={{ padding:"12px 14px", display:"flex", alignItems:"center", gap:"10px" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:"14px", fontWeight:900, color:"#1a2a3a", marginBottom:"2px" }}>{d.titulo}</div>
                    {d.descripcion && <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600 }}>{d.descripcion}</div>}
                    <div style={{ fontSize:"11px", color:"#27ae60", fontWeight:800, marginTop:"4px" }}>
                      💰 {Math.floor((d.precio_bits||0)*0.8)} BIT para vos por descarga
                    </div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
                    <a href={d.url} target="_blank" rel="noopener noreferrer"
                      style={{ background:"rgba(58,123,213,0.1)", border:"1px solid rgba(58,123,213,0.25)", borderRadius:"8px", padding:"6px 10px", fontSize:"11px", fontWeight:800, color:"#3a7bd5", textDecoration:"none", textAlign:"center" }}>↗️ Ver</a>
                    <button onClick={()=>eliminarDescarga(d.id)}
                      style={{ background:"rgba(231,76,60,0.1)", border:"1px solid rgba(231,76,60,0.25)", borderRadius:"8px", padding:"6px 10px", fontSize:"11px", fontWeight:800, color:"#e74c3c", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>🗑️</button>
                  </div>
                </div>
              </div>
            ))}
            {descargas.length===0 && <EmptyCard emoji="📥" texto="Sin descargas todavía" sub="Subí archivos gratuitos o de pago" />}
          </div>
        )}

        {/* ══ MIEMBROS ══ */}
        {tab==="miembros" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
            {pendientes.length > 0 && (
              <div>
                <SecHeader label={`⏳ Pendientes (${pendientes.length})`} color="#e67e22" />
                {pendientes.map(m=><TarjetaMiembro key={m.id} m={m} onAccion={accionMiembro} showAprobar />)}
              </div>
            )}
            <div>
              <SecHeader label={`✅ Activos (${activos.length})`} color="#27ae60" />
              {activos.map(m=><TarjetaMiembro key={m.id} m={m} onAccion={accionMiembro} />)}
              {activos.length===0 && <EmptyCard emoji="👥" texto="Sin miembros activos" sub="" />}
            </div>
          </div>
        )}

        {/* ══ INFO ══ */}
        {tab==="info" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
            <Caja titulo="✏️ Información">
              <Campo label="Título"      valor={formInfo.titulo}      onChange={v=>setFormInfo(f=>({...f,titulo:v}))} />
              <CampoTA label="Descripción" valor={formInfo.descripcion} onChange={v=>setFormInfo(f=>({...f,descripcion:v}))} />
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
                <Campo label="Ciudad"    valor={formInfo.ciudad}    onChange={v=>setFormInfo(f=>({...f,ciudad:v}))} />
                <Campo label="Provincia" valor={formInfo.provincia} onChange={v=>setFormInfo(f=>({...f,provincia:v}))} />
              </div>
              <Campo label="WhatsApp"    valor={formInfo.whatsapp}    onChange={v=>setFormInfo(f=>({...f,whatsapp:v}))} />
              <Campo label="Link externo" valor={formInfo.link_externo} onChange={v=>setFormInfo(f=>({...f,link_externo:v}))} />
              {nexo?.tipo!=="grupo" && <Campo label="Precio" valor={String(formInfo.precio)} onChange={v=>setFormInfo(f=>({...f,precio:v}))} tipo="number" />}
            </Caja>
            <button onClick={guardarInfo} disabled={guardando}
              style={{ width:"100%", background:`linear-gradient(135deg,${colorNexo}cc,${colorNexo})`, border:"none", borderRadius:"12px", padding:"14px", fontSize:"15px", fontWeight:900, color:"#fff", cursor:"pointer", fontFamily:"'Nunito',sans-serif", boxShadow:`0 4px 0 ${colorNexo}88` }}>
              {guardando?"Guardando...":"💾 Guardar cambios"}
            </button>
          </div>
        )}

        {/* ══ CONFIG ══ */}
        {tab==="config" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
            <Caja titulo="⚙️ Permisos">
              {[
                { k:"permitir_mensajes", l:"💬 Chat activo",         d:"Los miembros pueden escribir" },
                { k:"permitir_adjuntos", l:"📎 Adjuntos en chat",    d:"Miembros pueden enviar archivos" },
                { k:"permitir_links",    l:"🔗 Links en chat",       d:"Miembros pueden compartir URLs" },
                { k:"solo_admins",       l:"🛡️ Solo admins publican",d:"Solo admins pueden escribir" },
              ].map(op=>{
                const val = nexo?.config?.[op.k] ?? true;
                return (
                  <div key={op.k} onClick={async()=>{
                    const nuevo = !val;
                    const config = {...(nexo.config||{}),[op.k]:nuevo};
                    await supabase.from("nexos").update({config}).eq("id",id);
                    setNexo((n:any)=>({...n,config}));
                  }} style={{ display:"flex", alignItems:"center", gap:"12px", padding:"13px 0", borderBottom:"1px solid #f4f4f2", cursor:"pointer" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:"13px", fontWeight:900, color:"#1a2a3a" }}>{op.l}</div>
                      <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600 }}>{op.d}</div>
                    </div>
                    <div style={{ width:"46px", height:"26px", borderRadius:"13px", background:val?"#27ae60":"#d0d0d0", position:"relative", flexShrink:0, transition:"background .2s" }}>
                      <div style={{ position:"absolute", top:"3px", left:val?"23px":"3px", width:"20px", height:"20px", borderRadius:"50%", background:"#fff", boxShadow:"0 1px 4px rgba(0,0,0,0.2)", transition:"left .2s" }} />
                    </div>
                  </div>
                );
              })}
            </Caja>

            <div style={{ background:"linear-gradient(135deg,#2c1a1a,#4a2020)", borderRadius:"16px", padding:"18px", border:"2px solid rgba(231,76,60,0.3)" }}>
              <div style={{ fontSize:"13px", fontWeight:900, color:"#e74c3c", marginBottom:"6px" }}>⚠️ Zona peligrosa</div>
              <div style={{ fontSize:"12px", color:"#e88a8a", fontWeight:600, marginBottom:"16px" }}>Esta acción elimina el nexo, sus sliders, miembros y mensajes permanentemente.</div>
              <button onClick={async()=>{
                if (!confirm("¿Eliminar este Nexo definitivamente?")) return;
                await supabase.from("nexo_mensajes").delete().eq("nexo_id",id);
                await supabase.from("nexo_miembros").delete().eq("nexo_id",id);
                await supabase.from("nexo_slider_items").delete().eq("nexo_id",id);
                await supabase.from("nexo_sliders").delete().eq("nexo_id",id);
                await supabase.from("nexo_descargas_pagos").delete().eq("nexo_id",id);
                await supabase.from("nexo_descargas").delete().eq("nexo_id",id);
                await supabase.from("nexos").delete().eq("id",id);
                router.push("/publicar");
              }} style={{ width:"100%", background:"rgba(231,76,60,0.18)", border:"2px solid rgba(231,76,60,0.45)", borderRadius:"12px", padding:"13px", fontSize:"13px", fontWeight:900, color:"#e74c3c", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
                🗑️ Eliminar Nexo definitivamente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* POPUP AGREGAR SLIDER */}
      {popupSlider && (
        <div style={{ position:"fixed", inset:0, zIndex:500, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"flex-end" }} onClick={()=>setPopupSlider(false)}>
          <div style={{ width:"100%", background:"#fff", borderRadius:"24px 24px 0 0", padding:"22px 18px 44px", maxHeight:"80vh", overflowY:"auto", fontFamily:"'Nunito',sans-serif" }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"20px", color:"#1a2a3a", letterSpacing:"1px", marginBottom:"14px" }}>➕ Tipo de slider</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px", marginBottom:"14px" }}>
              {SLIDERS_CATALOGO.map(c=>{
                const existe = sliders.some(s=>s.tipo===c.tipo);
                return (
                  <button key={c.tipo} onClick={()=>!existe&&agregarSlider(c.tipo)} disabled={existe}
                    style={{ background:existe?"#f9f9f9":"#fff", border:`2px solid ${existe?"#e8e8e6":`${colorNexo}40`}`, borderRadius:"12px", padding:"11px 10px", cursor:existe?"default":"pointer", display:"flex", gap:"8px", alignItems:"center", opacity:existe?0.4:1, fontFamily:"'Nunito',sans-serif" }}>
                    <span style={{ fontSize:"20px" }}>{c.emoji}</span>
                    <div style={{ textAlign:"left" }}>
                      <div style={{ fontSize:"12px", fontWeight:800, color:"#1a2a3a" }}>{c.titulo}</div>
                      <div style={{ fontSize:"9px", color:"#9a9a9a", fontWeight:600 }}>{existe?"Ya existe":c.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div style={{ borderTop:"2px solid #f0f0f0", paddingTop:"12px" }}>
              <div style={{ fontSize:"11px", fontWeight:800, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"8px" }}>✨ Personalizado</div>
              <div style={{ display:"flex", gap:"8px" }}>
                <input type="text" value={customTitulo} onChange={e=>setCustomTitulo(e.target.value)} placeholder="Nombre libre..." style={{ flex:1, border:"2px solid #e8e8e6", borderRadius:"10px", padding:"10px 14px", fontSize:"13px", fontFamily:"'Nunito',sans-serif", outline:"none" }} />
                <button onClick={()=>agregarSlider("personalizado",customTitulo)} disabled={!customTitulo.trim()}
                  style={{ background:`linear-gradient(135deg,${colorNexo}cc,${colorNexo})`, border:"none", borderRadius:"10px", padding:"10px 16px", fontSize:"13px", fontWeight:900, color:"#fff", cursor:"pointer", fontFamily:"'Nunito',sans-serif", opacity:customTitulo.trim()?1:0.5 }}>
                  ➕
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POPUP AGREGAR ITEM */}
      {popupItem && (
        <div style={{ position:"fixed", inset:0, zIndex:500, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"flex-end" }} onClick={()=>setPopupItem(null)}>
          <div style={{ width:"100%", background:"#fff", borderRadius:"24px 24px 0 0", padding:"22px 18px 44px", maxHeight:"85vh", overflowY:"auto", fontFamily:"'Nunito',sans-serif" }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"20px", color:"#1a2a3a", letterSpacing:"1px", marginBottom:"16px" }}>
              ➕ Agregar a "{popupItem.slider.titulo}"
            </div>
            <label style={{ display:"block", width:"100%", background:`${colorNexo}10`, border:`2px dashed ${colorNexo}50`, borderRadius:"14px", padding:"20px", textAlign:"center", cursor:"pointer", marginBottom:"14px" }}>
              <div style={{ fontSize:"36px", marginBottom:"8px" }}>{subiendoImg==="item"?"⏳":"📁"}</div>
              <div style={{ fontSize:"13px", fontWeight:800, color:colorNexo }}>{subiendoImg==="item"?"Subiendo...":"Subir archivo"}</div>
              <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600, marginTop:"3px" }}>imagen, video, PDF, doc — máx 50MB</div>
              <input type="file" onChange={subirArchivoItem} style={{ display:"none" }} />
            </label>
            {formItem.url && (
              <div style={{ background:"#f4f4f2", borderRadius:"10px", padding:"10px 12px", fontSize:"12px", fontWeight:700, color:"#27ae60", marginBottom:"12px", wordBreak:"break-all" }}>✅ {formItem.url.split("/").pop()?.split("?")[0]}</div>
            )}
            <Campo label="Título (opcional)" valor={formItem.titulo} onChange={v=>setFormItem(f=>({...f,titulo:v}))} />
            <CampoTA label="Descripción (opcional)" valor={formItem.descripcion} onChange={v=>setFormItem(f=>({...f,descripcion:v}))} />
            <button onClick={agregarItem} disabled={!formItem.url||subiendoImg==="item"}
              style={{ width:"100%", background:`linear-gradient(135deg,${colorNexo}cc,${colorNexo})`, border:"none", borderRadius:"12px", padding:"14px", fontSize:"15px", fontWeight:900, color:"#fff", cursor:"pointer", fontFamily:"'Nunito',sans-serif", opacity:formItem.url?1:0.5, boxShadow:`0 4px 0 ${colorNexo}88` }}>
              ✅ Agregar al slider
            </button>
          </div>
        </div>
      )}

      {/* POPUP AGREGAR DESCARGA */}
      {popupDescarga && (
        <div style={{ position:"fixed", inset:0, zIndex:500, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"flex-end" }} onClick={()=>setPopupDescarga(false)}>
          <div style={{ width:"100%", background:"#fff", borderRadius:"24px 24px 0 0", padding:"22px 18px 44px", maxHeight:"85vh", overflowY:"auto", fontFamily:"'Nunito',sans-serif" }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"20px", color:"#1a2a3a", letterSpacing:"1px", marginBottom:"16px" }}>📥 Nueva descarga</div>
            <label style={{ display:"block", width:"100%", background:"rgba(22,160,133,0.08)", border:"2px dashed rgba(22,160,133,0.4)", borderRadius:"14px", padding:"20px", textAlign:"center", cursor:"pointer", marginBottom:"14px" }}>
              <div style={{ fontSize:"36px", marginBottom:"8px" }}>{subiendoImg==="desc"?"⏳":"📁"}</div>
              <div style={{ fontSize:"13px", fontWeight:800, color:"#16a085" }}>{subiendoImg==="desc"?"Subiendo...":"Subir archivo"}</div>
              <input type="file" onChange={subirArchivoDescarga} style={{ display:"none" }} />
            </label>
            {formDesc.url && <div style={{ background:"#f4f4f2", borderRadius:"10px", padding:"10px 12px", fontSize:"12px", fontWeight:700, color:"#27ae60", marginBottom:"12px" }}>✅ Archivo listo</div>}
            <Campo label="Título *" valor={formDesc.titulo} onChange={v=>setFormDesc(f=>({...f,titulo:v}))} />
            <CampoTA label="Descripción" valor={formDesc.descripcion} onChange={v=>setFormDesc(f=>({...f,descripcion:v}))} />
            <div style={{ marginBottom:"12px" }}>
              <label style={LS}>Precio en BIT (0 = gratis)</label>
              <input type="number" min="0" value={formDesc.precio_bits} onChange={e=>setFormDesc(f=>({...f,precio_bits:e.target.value}))} style={IS} />
            </div>
            {parseInt(formDesc.precio_bits)>0 && (
              <div style={{ background:"rgba(22,160,133,0.08)", borderRadius:"10px", padding:"10px 14px", marginBottom:"12px", fontSize:"12px", fontWeight:700, color:"#16a085" }}>
                Por cada descarga recibís: <strong>{Math.floor(parseInt(formDesc.precio_bits)*0.8)} BIT</strong> (80%)
              </div>
            )}
            <button onClick={agregarDescarga} disabled={!formDesc.url||!formDesc.titulo}
              style={{ width:"100%", background:"linear-gradient(135deg,#16a085,#1abc9c)", border:"none", borderRadius:"12px", padding:"14px", fontSize:"15px", fontWeight:900, color:"#fff", cursor:"pointer", fontFamily:"'Nunito',sans-serif", opacity:formDesc.url&&formDesc.titulo?1:0.5, boxShadow:"0 4px 0 #0e6b59" }}>
              ✅ Publicar descarga
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function TarjetaMiembro({ m, onAccion, showAprobar }: { m:any; onAccion:(id:string,acc:string)=>void; showAprobar?:boolean }) {
  const [exp, setExp] = useState(false);
  const rolColors: Record<string,string> = { creador:"#d4a017", moderador:"#3a7bd5", miembro:"#27ae60" };
  const c = rolColors[m.rol]||"#27ae60";
  return (
    <div style={{ background:"#fff", borderRadius:"14px", marginBottom:"8px", overflow:"hidden", boxShadow:"0 2px 6px rgba(0,0,0,0.05)" }}>
      <div style={{ padding:"12px 14px", display:"flex", alignItems:"center", gap:"10px", cursor:"pointer" }} onClick={()=>setExp(e=>!e)}>
        <div style={{ width:"40px", height:"40px", borderRadius:"50%", background:"linear-gradient(135deg,#1a2a3a,#243b55)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"17px", overflow:"hidden", flexShrink:0 }}>
          {m.usuarios?.avatar_url?<img src={m.usuarios.avatar_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />:"👤"}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:"13px", fontWeight:900, color:"#1a2a3a" }}>{m.usuarios?.nombre_usuario||"---"}</div>
          <div style={{ fontSize:"10px", color:"#9a9a9a", fontWeight:600 }}>{m.usuarios?.codigo}</div>
        </div>
        <div style={{ display:"flex", gap:"5px", alignItems:"center" }}>
          {m.silenciado&&<span style={{ fontSize:"12px" }}>🔇</span>}
          <span style={{ background:`${c}18`, color:c, borderRadius:"20px", padding:"2px 9px", fontSize:"9px", fontWeight:900 }}>
            {m.rol==="creador"?"👑 Creador":m.rol==="moderador"?"🛡️ Mod":"✅ Miembro"}
          </span>
          <span style={{ fontSize:"14px", color:"#d4a017", transform:exp?"rotate(90deg)":"none", transition:"transform .2s", display:"inline-block" }}>›</span>
        </div>
      </div>
      {exp && (
        <div style={{ borderTop:"1px solid #f4f4f2", padding:"10px 14px", background:"#fafafa", display:"flex", flexWrap:"wrap", gap:"6px" }}>
          {showAprobar    && <AccBtn label="✅ Aprobar"     color="#27ae60" onClick={()=>onAccion(m.id,"aprobar")} />}
          {m.rol==="miembro" && <AccBtn label="🛡️ Hacer mod" color="#3a7bd5" onClick={()=>onAccion(m.id,"hacer_mod")} />}
          {m.rol==="moderador"&&<AccBtn label="⬇️ Quitar mod" color="#7f8c8d" onClick={()=>onAccion(m.id,"quitar_mod")} />}
          <AccBtn label={m.silenciado?"🔊 Activar":"🔇 Silenciar"} color="#e67e22" onClick={()=>onAccion(m.id,"silenciar")} />
          {m.estado==="activo"&&<AccBtn label="🚫 Expulsar" color="#e74c3c" onClick={()=>onAccion(m.id,"expulsar")} />}
          <AccBtn label="⛔ Bloquear" color="#c0392b" onClick={()=>onAccion(m.id,"bloquear")} />
        </div>
      )}
    </div>
  );
}

function AccBtn({ label, color, onClick }: { label:string; color:string; onClick:()=>void }) {
  return <button onClick={onClick} style={{ background:`${color}15`, border:`1px solid ${color}40`, borderRadius:"8px", padding:"6px 11px", fontSize:"11px", fontWeight:800, color, cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>{label}</button>;
}
function MiniBtn({ emoji, onClick, disabled, color="#9a9a9a", label }: { emoji:string; onClick:()=>void; disabled?:boolean; color?:string; label?:string }) {
  return (
    <button onClick={onClick} disabled={disabled} title={label}
      style={{ background:`${color}15`, border:`1px solid ${color}30`, borderRadius:"8px", minWidth:"30px", height:"30px", padding:"0 8px", fontSize:"11px", cursor:disabled?"default":"pointer", opacity:disabled?0.3:1, display:"flex", alignItems:"center", justifyContent:"center", gap:"4px", fontFamily:"'Nunito',sans-serif" }}>
      {emoji}{label&&<span style={{ fontSize:"9px", fontWeight:800, color }}>{label}</span>}
    </button>
  );
}
function Caja({ titulo, children }: { titulo:string; children:React.ReactNode }) {
  return <div style={{ background:"#fff", borderRadius:"16px", padding:"18px", boxShadow:"0 2px 10px rgba(0,0,0,0.06)" }}><div style={{ fontSize:"11px", fontWeight:900, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"14px" }}>{titulo}</div>{children}</div>;
}
function Campo({ label, valor, onChange, tipo="text" }: { label:string; valor:string; onChange:(v:string)=>void; tipo?:string }) {
  return <div style={{ marginBottom:"12px" }}><label style={LS}>{label}</label><input type={tipo} value={valor} onChange={e=>onChange(e.target.value)} style={IS} /></div>;
}
function CampoTA({ label, valor, onChange }: { label:string; valor:string; onChange:(v:string)=>void }) {
  return <div style={{ marginBottom:"12px" }}><label style={LS}>{label}</label><textarea value={valor} onChange={e=>onChange(e.target.value)} rows={3} style={{...IS,resize:"vertical"} as any} /></div>;
}
function SecHeader({ label, color }: { label:string; color:string }) {
  return <div style={{ fontSize:"11px", fontWeight:800, color, textTransform:"uppercase", letterSpacing:"1px", marginBottom:"8px", paddingLeft:"4px" }}>{label}</div>;
}
function EmptyCard({ emoji, texto, sub }: { emoji:string; texto:string; sub:string }) {
  return <div style={{ textAlign:"center", padding:"40px 20px", background:"#fff", borderRadius:"16px" }}><div style={{ fontSize:"40px", marginBottom:"10px" }}>{emoji}</div><div style={{ fontSize:"15px", fontWeight:900, color:"#1a2a3a", marginBottom:"4px" }}>{texto}</div><div style={{ fontSize:"12px", color:"#9a9a9a", fontWeight:600 }}>{sub}</div></div>;
}
const LS: React.CSSProperties = { display:"block", fontSize:"11px", fontWeight:800, color:"#666", textTransform:"uppercase" as const, letterSpacing:"1px", marginBottom:"6px" };
const IS: React.CSSProperties = { width:"100%", border:"2px solid #e8e8e6", borderRadius:"10px", padding:"11px 14px", fontSize:"14px", fontFamily:"'Nunito',sans-serif", color:"#2c2c2e", outline:"none", boxSizing:"border-box" as const };
