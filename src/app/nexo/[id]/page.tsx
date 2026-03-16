"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

const TIPO_COLORES: Record<string,string> = {
  anuncio:"#d4a017", empresa:"#c0392b", servicio:"#27ae60", trabajo:"#8e44ad", grupo:"#3a7bd5",
};
const TIPO_EMOJIS: Record<string,string> = {
  anuncio:"📣", empresa:"🏢", servicio:"🛠️", trabajo:"💼", grupo:"👥",
};
const SUBTIPO_EMOJIS: Record<string,string> = {
  emprendimiento:"🚀", curso:"🎓", consorcio:"🏢", deportivo:"⚽",
  estudio:"📚", venta:"🛒", artistas:"🎨", vecinos:"🏘️", generico:"✨",
};

export default function NexoPage() {
  const router = useRouter();
  const params = useParams();
  const id     = params?.id as string;

  const [nexo,      setNexo]      = useState<any>(null);
  const [sliders,   setSliders]   = useState<any[]>([]);
  const [items,     setItems]     = useState<Record<string,any[]>>({});
  const [miembros,  setMiembros]  = useState<any[]>([]);
  const [mensajes,  setMensajes]  = useState<any[]>([]);
  const [perfil,    setPerfil]    = useState<any>(null);
  const [miMiembro, setMiMiembro] = useState<any>(null);
  const [tabActiva, setTabActiva] = useState<string>("");
  const [texto,     setTexto]     = useState("");
  const [enviando,  setEnviando]  = useState(false);
  const [cargando,  setCargando]  = useState(true);
  const [visor,     setVisor]     = useState<any>(null);
  const [pagandoDescarga, setPagandoDescarga] = useState<string|null>(null);
  const [descargasPagadas, setDescargasPagadas] = useState<Set<string>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);
  const tabBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cargar = async () => {
      const { data:{ session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      const { data: u } = userId ? await supabase.from("usuarios").select("*").eq("id",userId).single() : { data:null };
      setPerfil(u);

      const { data: n } = await supabase.from("nexos")
        .select("*, usuarios(id,nombre_usuario,codigo,avatar_url,plan)")
        .eq("id", id).single();
      setNexo(n);

      const { data: sls } = await supabase.from("nexo_sliders")
        .select("*").eq("nexo_id", id).eq("activo",true).order("orden");
      setSliders(sls || []);
      if (sls?.length) setTabActiva(sls[0].id);

      if (userId) {
        const { data: mm } = await supabase.from("nexo_miembros")
          .select("*").eq("nexo_id",id).eq("usuario_id",userId).single();
        setMiMiembro(mm);

        // Descargas pagadas por este usuario
        const { data: pagos } = await supabase.from("nexo_descargas_pagos")
          .select("descarga_id").eq("nexo_id",id).eq("comprador_id",userId);
        setDescargasPagadas(new Set((pagos||[]).map((p:any)=>p.descarga_id)));
      }

      const { data: mbs } = await supabase.from("nexo_miembros")
        .select("*, usuarios(id,nombre_usuario,codigo,avatar_url,plan)")
        .eq("nexo_id",id).eq("estado","activo").order("created_at");
      setMiembros(mbs||[]);

      setCargando(false);
    };
    cargar();
  }, [id]);

  // Cargar items al cambiar de tab
  useEffect(() => {
    if (!tabActiva) return;
    const slider = sliders.find(s => s.id === tabActiva);
    if (!slider) return;
    if (items[tabActiva]) return; // ya cargados

    const cargarItems = async () => {
      if (slider.tipo === "mensajes" || slider.tipo === "chat") {
        const { data } = await supabase.from("nexo_mensajes")
          .select("*, usuarios(nombre_usuario,codigo,avatar_url,plan)")
          .eq("nexo_id",id).order("created_at", { ascending:true }).limit(100);
        setMensajes(data||[]);
      } else {
        const { data } = await supabase.from("nexo_slider_items")
          .select("*").eq("slider_id",tabActiva).order("orden");
        setItems(prev => ({ ...prev, [tabActiva]: data||[] }));
      }
    };
    cargarItems();
  }, [tabActiva]);

  useEffect(() => {
    if (sliders.find(s=>s.id===tabActiva)?.tipo === "mensajes") {
      setTimeout(()=>bottomRef.current?.scrollIntoView({behavior:"smooth"}),100);
    }
  }, [mensajes.length, tabActiva]);

  const esAdmin   = nexo?.usuario_id === perfil?.id ||
                    miMiembro?.rol === "moderador" || miMiembro?.rol === "creador";
  const esMiembro = miMiembro?.estado === "activo";
  const colorNexo = TIPO_COLORES[nexo?.tipo] || "#d4a017";
  const emojiNexo = nexo?.subtipo ? SUBTIPO_EMOJIS[nexo.subtipo] : TIPO_EMOJIS[nexo?.tipo] || "✨";

  const unirse = async () => {
    if (!perfil) { router.push("/login"); return; }
    const acceso = nexo?.config?.tipo_acceso || "libre";

    if (acceso === "pago") {
      const bitsTotal = Math.max(0,(perfil.bits||0)) + Math.max(0,(perfil.bits_free||0)) + Math.max(0,(perfil.bits_promo||0));
      if (bitsTotal < 500) { alert("Necesitás 500 BIT para unirte a este grupo"); return; }
      // Descontar 500 BIT
      await supabase.from("usuarios").update({ bits: Math.max(0,(perfil.bits||0)-500) }).eq("id",perfil.id);
    }

    const estado = acceso === "aprobacion" ? "pendiente" : "activo";
    const { data: mm } = await supabase.from("nexo_miembros")
      .insert({ nexo_id:id, usuario_id:perfil.id, rol:"miembro", estado, bits_pagados: acceso==="pago"?500:0 })
      .select().single();
    setMiMiembro(mm);
    if (estado === "activo") setMiembros(prev => [...prev, {...mm, usuarios:perfil}]);
  };

  const enviarMensaje = async () => {
    if (!texto.trim() || !perfil || enviando) return;
    setEnviando(true);
    const { data: nuevo } = await supabase.from("nexo_mensajes")
      .insert({ nexo_id:id, usuario_id:perfil.id, texto:texto.trim() })
      .select("*, usuarios(nombre_usuario,codigo,avatar_url,plan)").single();
    if (nuevo) setMensajes(prev=>[...prev,nuevo]);
    setTexto("");
    setEnviando(false);
  };

  const pagarDescarga = async (descarga: any) => {
    if (!perfil) { router.push("/login"); return; }
    const bitsTotal = Math.max(0,(perfil.bits||0)) + Math.max(0,(perfil.bits_free||0)) + Math.max(0,(perfil.bits_promo||0));
    if (bitsTotal < descarga.precio_bits) {
      alert(`Necesitás ${descarga.precio_bits} BIT para descargar este archivo`);
      return;
    }
    setPagandoDescarga(descarga.id);
    const bitsAdmin   = Math.floor(descarga.precio_bits * 0.8);
    const bitsNexonet = descarga.precio_bits - bitsAdmin;

    // Descontar del comprador
    await supabase.from("usuarios").update({ bits: Math.max(0,(perfil.bits||0) - descarga.precio_bits) }).eq("id",perfil.id);
    // Acreditar BIT Promotor al admin del nexo (80%)
    const { data: adminData } = await supabase.from("usuarios").select("bits_promo,bits_promotor_total").eq("id", nexo.usuario_id).single();
    await supabase.from("usuarios").update({
      bits_promo:          ((adminData as any)?.bits_promo          || 0) + bitsAdmin,
      bits_promotor_total: ((adminData as any)?.bits_promotor_total || 0) + bitsAdmin,
    }).eq("id", nexo.usuario_id);
    // Registrar pago
    await supabase.from("nexo_descargas_pagos").insert({
      descarga_id:descarga.id, nexo_id:id, comprador_id:perfil.id,
      admin_id:nexo.usuario_id, bits_pagados:descarga.precio_bits, bits_admin:bitsAdmin, bits_nexonet:bitsNexonet,
    });
    // Incrementar contador
    await supabase.from("nexo_descargas").update({ descargas:(descarga.descargas||0)+1 }).eq("id",descarga.id);

    setDescargasPagadas(prev => new Set([...prev, descarga.id]));
    setPagandoDescarga(null);
    // Abrir el archivo
    window.open(descarga.url, "_blank");
  };

  if (cargando) return <main style={{ paddingTop:"80px", textAlign:"center", color:"#9a9a9a", fontFamily:"'Nunito',sans-serif" }}>Cargando...</main>;
  if (!nexo)    return <main style={{ paddingTop:"80px", textAlign:"center", color:"#9a9a9a", fontFamily:"'Nunito',sans-serif" }}>Nexo no encontrado</main>;

  const sliderActual = sliders.find(s=>s.id===tabActiva);
  const esChat       = sliderActual?.tipo === "mensajes" || sliderActual?.tipo === "chat";

  return (
    <main style={{ paddingTop:"0", paddingBottom:"90px", background:"#f4f4f2", minHeight:"100vh", fontFamily:"'Nunito',sans-serif" }}>
      <Header />

      {/* HERO CON BANNER */}
      <div style={{ position:"relative", minHeight:"200px", background: nexo.banner_url ? `url(${nexo.banner_url}) center/cover no-repeat` : `linear-gradient(135deg,#1a2a3a,#243b55)`, paddingTop:"95px" }}>
        {nexo.banner_url && <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.52)" }} />}
        <div style={{ position:"relative", zIndex:1, padding:"16px 16px 20px" }}>
          <div style={{ display:"flex", alignItems:"flex-end", gap:"14px" }}>
            <div style={{ width:"72px", height:"72px", borderRadius:"18px", overflow:"hidden", flexShrink:0, border:`3px solid ${colorNexo}60`, background:"#1a2a3a", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"30px" }}>
              {nexo.avatar_url ? <img src={nexo.avatar_url} alt={nexo.titulo} style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : emojiNexo}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:"11px", fontWeight:700, color:"rgba(255,255,255,0.55)", marginBottom:"2px", textTransform:"uppercase", letterSpacing:"1px" }}>
                {TIPO_EMOJIS[nexo.tipo]} {nexo.tipo}{nexo.subtipo?` · ${nexo.subtipo}`:""}
              </div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"26px", color:"#fff", letterSpacing:"1px", lineHeight:1.1 }}>{nexo.titulo}</div>
              <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.65)", fontWeight:600, marginTop:"4px", display:"flex", gap:"12px", flexWrap:"wrap" }}>
                {nexo.ciudad && <span>📍 {nexo.ciudad}</span>}
                {nexo.precio && <span style={{ color:colorNexo, fontWeight:800 }}>$ {parseFloat(nexo.precio).toLocaleString("es-AR")} {nexo.moneda}</span>}
                {nexo.tipo==="grupo" && <span>👥 {miembros.length} miembro{miembros.length!==1?"s":""}</span>}
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"6px", flexShrink:0 }}>
              {esAdmin && (
                <button onClick={()=>router.push(`/nexo/${id}/admin`)}
                  style={{ background:`${colorNexo}cc`, border:"none", borderRadius:"10px", padding:"8px 12px", fontSize:"12px", fontWeight:900, color:nexo.tipo==="anuncio"?"#1a2a3a":"#fff", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
                  ⚙️ Admin
                </button>
              )}
              {!esAdmin && !miMiembro && nexo.tipo==="grupo" && (
                <button onClick={unirse}
                  style={{ background:`${colorNexo}cc`, border:"none", borderRadius:"10px", padding:"8px 12px", fontSize:"12px", fontWeight:900, color:"#fff", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
                  {nexo.config?.tipo_acceso==="pago"?"💰 Unirse (500 BIT)":nexo.config?.tipo_acceso==="aprobacion"?"⏳ Solicitar ingreso":"👥 Unirse"}
                </button>
              )}
              {miMiembro?.estado==="pendiente" && <div style={{ background:"rgba(230,126,34,0.2)", border:"1px solid rgba(230,126,34,0.4)", borderRadius:"10px", padding:"7px 12px", fontSize:"11px", fontWeight:800, color:"#e67e22" }}>⏳ Pendiente</div>}
            </div>
          </div>
        </div>
      </div>

      {/* TAB BAR SLIDER */}
      <div ref={tabBarRef} style={{ position:"sticky", top:"60px", zIndex:100, background:"#1a2a3a", boxShadow:"0 3px 14px rgba(0,0,0,0.28)", overflowX:"auto", scrollbarWidth:"none", display:"flex" }}>
        {sliders.map(s => (
          <button key={s.id} onClick={()=>setTabActiva(s.id)}
            style={{ flex:"0 0 auto", minWidth:"72px", background:"none", border:"none", cursor:"pointer",
                     padding:"10px 8px 6px", display:"flex", flexDirection:"column", alignItems:"center", gap:"3px",
                     borderBottom: tabActiva===s.id ? `3px solid ${colorNexo}` : "3px solid transparent" }}>
            <span style={{ fontSize:"17px" }}>{SLIDER_EMOJIS[s.tipo]||"📋"}</span>
            <span style={{ fontSize:"9px", fontWeight:800, color: tabActiva===s.id ? colorNexo : "rgba(255,255,255,0.45)", textTransform:"uppercase", letterSpacing:"0.5px", whiteSpace:"nowrap" }}>
              {s.titulo.length > 8 ? s.titulo.slice(0,7)+"…" : s.titulo}
            </span>
          </button>
        ))}
      </div>

      {/* CONTENIDO DEL SLIDER */}
      <div style={{ padding: esChat ? "0" : "14px", maxWidth:"600px", margin:"0 auto" }}>
        {sliderActual && <SliderContenido
          slider={sliderActual}
          items={items[tabActiva]||[]}
          mensajes={mensajes}
          perfil={perfil}
          nexo={nexo}
          esAdmin={esAdmin}
          esMiembro={esMiembro || nexo.usuario_id===perfil?.id}
          descargasPagadas={descargasPagadas}
          pagandoDescarga={pagandoDescarga}
          miembros={miembros}
          texto={texto}
          setTexto={setTexto}
          enviando={enviando}
          onEnviar={enviarMensaje}
          onVisor={setVisor}
          onPagarDescarga={pagarDescarga}
          bottomRef={bottomRef}
          colorNexo={colorNexo}
        />}
      </div>

      {/* VISOR */}
      {visor && (
        <div style={{ position:"fixed", inset:0, zIndex:600, background:"rgba(0,0,0,0.94)", display:"flex", alignItems:"center", justifyContent:"center" }}
          onClick={()=>setVisor(null)}>
          <button onClick={()=>setVisor(null)} style={{ position:"absolute", top:"16px", right:"16px", background:"rgba(255,255,255,0.15)", border:"none", borderRadius:"50%", width:"44px", height:"44px", fontSize:"20px", color:"#fff", cursor:"pointer" }}>✕</button>
          <div onClick={e=>e.stopPropagation()} style={{ maxWidth:"92vw", maxHeight:"85vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
            {visor.tipo==="imagen" && <img src={visor.url} alt="" style={{ maxWidth:"92vw", maxHeight:"82vh", borderRadius:"12px", objectFit:"contain" }} />}
            {visor.tipo==="video"  && <video src={visor.url} controls autoPlay style={{ maxWidth:"92vw", maxHeight:"82vh", borderRadius:"12px" }} />}
            {visor.tipo==="pdf"    && <iframe src={visor.url} style={{ width:"88vw", height:"80vh", borderRadius:"12px", border:"none" }} />}
            {(!visor.tipo||visor.tipo==="documento"||visor.tipo==="archivo") && (
              <div style={{ background:"rgba(255,255,255,0.1)", borderRadius:"16px", padding:"40px", textAlign:"center" }}>
                <div style={{ fontSize:"64px", marginBottom:"16px" }}>📄</div>
                <div style={{ fontSize:"14px", fontWeight:700, color:"#fff", marginBottom:"20px" }}>{visor.titulo||visor.url?.split("/").pop()}</div>
                <a href={visor.url} target="_blank" rel="noopener noreferrer" style={{ background:"linear-gradient(135deg,#d4a017,#f0c040)", borderRadius:"12px", padding:"12px 24px", fontSize:"14px", fontWeight:900, color:"#1a2a3a", textDecoration:"none" }}>📥 Descargar</a>
              </div>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}

const SLIDER_EMOJIS: Record<string,string> = {
  galeria:"📸", videos:"🎬", documentos:"📄", descargas:"📥", productos:"🛒",
  novedades:"📢", proveedores:"🏭", faq:"❓", facturas:"🧾", calendario:"📅",
  equipo:"👤", servicios:"🛠️", portfolio:"🎨", testimonios:"💬", certificados:"🏅",
  mensajes:"💬", chat:"💬", personalizado:"✨",
};

function SliderContenido({ slider, items, mensajes, perfil, nexo, esAdmin, esMiembro, descargasPagadas, pagandoDescarga, miembros, texto, setTexto, enviando, onEnviar, onVisor, onPagarDescarga, bottomRef, colorNexo }: any) {
  const tipo = slider.tipo;

  // CHAT
  if (tipo==="mensajes"||tipo==="chat") {
    return (
      <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 230px)" }}>
        <div style={{ flex:1, overflowY:"auto", padding:"12px 14px", display:"flex", flexDirection:"column", gap:"8px" }}>
          {mensajes.length===0 && (
            <div style={{ textAlign:"center", padding:"50px 20px", color:"#9a9a9a" }}>
              <div style={{ fontSize:"40px", marginBottom:"12px" }}>💬</div>
              <div style={{ fontWeight:800, color:"#1a2a3a" }}>Sin mensajes todavía</div>
              <div style={{ fontSize:"12px", marginTop:"4px", fontWeight:600 }}>Sé el primero en escribir</div>
            </div>
          )}
          {mensajes.map((m:any)=>{
            const esMio = m.usuario_id===perfil?.id;
            return (
              <div key={m.id} style={{ display:"flex", flexDirection:esMio?"row-reverse":"row", alignItems:"flex-end", gap:"8px" }}>
                {!esMio && (
                  <div style={{ width:"30px", height:"30px", borderRadius:"50%", background:"linear-gradient(135deg,#1a2a3a,#243b55)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"13px", flexShrink:0, overflow:"hidden" }}>
                    {m.usuarios?.avatar_url ? <img src={m.usuarios.avatar_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : "👤"}
                  </div>
                )}
                <div style={{ maxWidth:"72%", display:"flex", flexDirection:"column", alignItems:esMio?"flex-end":"flex-start" }}>
                  {!esMio && <div style={{ fontSize:"10px", fontWeight:800, color:colorNexo, marginBottom:"2px", marginLeft:"4px" }}>{m.usuarios?.nombre_usuario}</div>}
                  <div style={{ background:esMio?`linear-gradient(135deg,${colorNexo}cc,${colorNexo})`:"#fff", borderRadius:esMio?"16px 4px 16px 16px":"4px 16px 16px 16px", padding:"10px 14px", boxShadow:"0 2px 8px rgba(0,0,0,0.08)" }}>
                    {m.texto && <div style={{ fontSize:"14px", fontWeight:600, color:esMio?"#fff":"#2c2c2e", lineHeight:1.5 }}>{m.texto}</div>}
                  </div>
                  <div style={{ fontSize:"10px", color:"#bbb", fontWeight:600, marginTop:"3px", marginLeft:"4px", marginRight:"4px" }}>
                    {new Date(m.created_at).toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"})}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        {(esMiembro||esAdmin) && (
          <div style={{ padding:"10px 14px", background:"#fff", borderTop:"1px solid #e8e8e6", display:"flex", gap:"8px", alignItems:"flex-end" }}>
            <textarea value={texto} onChange={e=>setTexto(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();onEnviar();} }}
              placeholder="Escribí un mensaje..." rows={1}
              style={{ flex:1, border:"2px solid #e8e8e6", borderRadius:"14px", padding:"10px 14px", fontSize:"14px", fontFamily:"'Nunito',sans-serif", outline:"none", resize:"none" }} />
            <button onClick={onEnviar} disabled={enviando||!texto.trim()}
              style={{ width:"44px", height:"44px", borderRadius:"50%", background:texto.trim()?`linear-gradient(135deg,${colorNexo}cc,${colorNexo})`:"#f4f4f2", border:"none", cursor:texto.trim()?"pointer":"default", fontSize:"18px", flexShrink:0 }}>
              {enviando?"⏳":"➤"}
            </button>
          </div>
        )}
        {!esMiembro && !esAdmin && (
          <div style={{ padding:"14px", background:"#fff8e0", textAlign:"center", fontSize:"13px", fontWeight:700, color:"#d4a017", borderTop:"1px solid #f0e0b0" }}>
            🔒 Unite al grupo para escribir
          </div>
        )}
      </div>
    );
  }

  // DESCARGAS
  if (tipo==="descargas") {
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
        {items.length===0 && <EmptySlider emoji="📥" texto="Sin archivos todavía" sub="El administrador puede agregar descargas desde el panel admin" />}
        {items.map((item:any)=>{
          const gratis      = !item.precio_bits || item.precio_bits===0;
          const yaPago      = descargasPagadas.has(item.id);
          const procesando  = pagandoDescarga===item.id;
          return (
            <div key={item.id} style={{ background:"#fff", borderRadius:"16px", overflow:"hidden", boxShadow:"0 2px 10px rgba(0,0,0,0.07)" }}>
              <div style={{ height:"120px", background:"linear-gradient(135deg,#1a2a3a,#243b55)", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden" }}>
                {item.tipo==="imagen" && item.url && <img src={item.url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />}
                {item.tipo==="video"  && item.url && <><video src={item.url} style={{ width:"100%", height:"100%", objectFit:"cover" }} /><div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"40px" }}>▶️</div></>}
                {(!item.tipo||item.tipo==="pdf"||item.tipo==="documento") && <span style={{ fontSize:"52px", opacity:0.4 }}>{item.tipo==="pdf"?"📕":"📄"}</span>}
                <div style={{ position:"absolute", top:"8px", right:"8px", background:gratis?"rgba(39,174,96,0.92)":"rgba(212,160,23,0.92)", borderRadius:"8px", padding:"4px 10px", fontSize:"11px", fontWeight:900, color:gratis?"#fff":"#1a2a3a" }}>
                  {gratis?"GRATIS":`${item.precio_bits} BIT`}
                </div>
              </div>
              <div style={{ padding:"14px 16px" }}>
                <div style={{ fontSize:"14px", fontWeight:900, color:"#1a2a3a", marginBottom:"4px" }}>{item.titulo||"Archivo"}</div>
                {item.descripcion && <div style={{ fontSize:"12px", color:"#9a9a9a", fontWeight:600, marginBottom:"10px", lineHeight:1.5 }}>{item.descripcion}</div>}
                <div style={{ display:"flex", gap:"8px", alignItems:"center", marginBottom:"12px" }}>
                  {item.tipo && <span style={{ background:"#f0f0f0", borderRadius:"6px", padding:"2px 8px", fontSize:"10px", fontWeight:800, color:"#666", textTransform:"uppercase" }}>{item.tipo}</span>}
                  <span style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600 }}>📥 {item.descargas||0} descargas</span>
                </div>
                {gratis || yaPago ? (
                  <a href={item.url} target="_blank" rel="noopener noreferrer"
                    style={{ display:"block", textAlign:"center", background:"linear-gradient(135deg,#27ae60,#1e8449)", borderRadius:"12px", padding:"12px", fontSize:"14px", fontWeight:900, color:"#fff", textDecoration:"none", boxShadow:"0 3px 0 #155a2e" }}>
                    📥 {yaPago?"Descargar de nuevo":"Descargar gratis"}
                  </a>
                ) : (esMiembro||esAdmin) ? (
                  <button onClick={()=>onPagarDescarga(item)} disabled={!!procesando}
                    style={{ width:"100%", background:`linear-gradient(135deg,${colorNexo}cc,${colorNexo})`, border:"none", borderRadius:"12px", padding:"12px", fontSize:"14px", fontWeight:900, color:"#fff", cursor:"pointer", fontFamily:"'Nunito',sans-serif", boxShadow:`0 3px 0 ${colorNexo}88` }}>
                    {procesando?"⏳ Procesando...`":`💰 Pagar ${item.precio_bits} BIT y descargar`}
                  </button>
                ) : (
                  <div style={{ textAlign:"center", fontSize:"13px", fontWeight:700, color:"#9a9a9a", padding:"10px", background:"#f4f4f2", borderRadius:"12px" }}>
                    🔒 Unite al grupo para descargar
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // MIEMBROS
  if (tipo==="equipo") {
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
        <div style={{ fontSize:"11px", fontWeight:800, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"4px" }}>
          {miembros.length} miembro{miembros.length!==1?"s":""}
        </div>
        {miembros.map((m:any)=>(
          <div key={m.id} style={{ background:"#fff", borderRadius:"14px", padding:"14px 16px", display:"flex", alignItems:"center", gap:"12px" }}>
            <div style={{ width:"44px", height:"44px", borderRadius:"50%", background:"linear-gradient(135deg,#1a2a3a,#243b55)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px", overflow:"hidden", flexShrink:0 }}>
              {m.usuarios?.avatar_url ? <img src={m.usuarios.avatar_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : "👤"}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:"14px", fontWeight:900, color:"#1a2a3a" }}>{m.usuarios?.nombre_usuario||"---"}</div>
              <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600 }}>{m.usuarios?.codigo}</div>
            </div>
            <RolBadge rol={m.rol} color={colorNexo} />
          </div>
        ))}
        {miembros.length===0 && <EmptySlider emoji="👥" texto="Sin miembros todavía" sub="" />}
      </div>
    );
  }

  // GENÉRICO — galería, videos, docs, productos, novedades, etc.
  return (
    <div>
      {items.length===0 && <EmptySlider emoji={SLIDER_EMOJIS[tipo]||"📋"} texto={`Sin contenido en "${slider.titulo}"`} sub={esAdmin?"Agregá contenido desde el panel admin":"Todavía no hay contenido"} />}
      {(tipo==="galeria"||tipo==="portfolio") && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
          {items.map((item:any)=>(
            <div key={item.id} onClick={()=>onVisor({...item, tipo:"imagen"})} style={{ borderRadius:"14px", overflow:"hidden", cursor:"pointer", background:"#1a2a3a", aspectRatio:"1", display:"flex", alignItems:"center", justifyContent:"center" }}>
              {item.url ? <img src={item.url} alt={item.titulo||""} style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <span style={{ fontSize:"36px", opacity:0.4 }}>📸</span>}
            </div>
          ))}
        </div>
      )}
      {tipo==="videos" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
          {items.map((item:any)=>(
            <div key={item.id} style={{ background:"#fff", borderRadius:"16px", overflow:"hidden", boxShadow:"0 2px 10px rgba(0,0,0,0.07)" }}>
              <div style={{ position:"relative", background:"#000", cursor:"pointer" }} onClick={()=>onVisor({...item,tipo:"video"})}>
                <video src={item.url} style={{ width:"100%", maxHeight:"200px", objectFit:"cover", display:"block" }} />
                <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.35)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"48px" }}>▶️</div>
              </div>
              {item.titulo && <div style={{ padding:"12px 14px", fontSize:"14px", fontWeight:800, color:"#1a2a3a" }}>{item.titulo}</div>}
              {item.descripcion && <div style={{ padding:"0 14px 12px", fontSize:"12px", color:"#9a9a9a", fontWeight:600 }}>{item.descripcion}</div>}
            </div>
          ))}
        </div>
      )}
      {(tipo==="documentos"||tipo==="facturas"||tipo==="certificados") && (
        <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
          {items.map((item:any)=>(
            <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration:"none" }}>
              <div style={{ background:"#fff", borderRadius:"14px", padding:"14px 16px", display:"flex", gap:"14px", alignItems:"center", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
                <div style={{ width:"44px", height:"44px", borderRadius:"12px", background:"rgba(212,160,23,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"22px", flexShrink:0 }}>📄</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:"14px", fontWeight:900, color:"#1a2a3a" }}>{item.titulo||"Documento"}</div>
                  <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600 }}>{item.descripcion||""}</div>
                </div>
                <span style={{ fontSize:"18px", color:"#3a7bd5" }}>↗️</span>
              </div>
            </a>
          ))}
        </div>
      )}
      {(tipo==="productos"||tipo==="servicios") && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
          {items.map((item:any)=>(
            <div key={item.id} style={{ background:"#fff", borderRadius:"16px", overflow:"hidden", boxShadow:"0 2px 10px rgba(0,0,0,0.07)" }}>
              <div style={{ height:"110px", background:"linear-gradient(135deg,#1a2a3a,#243b55)", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
                {item.url ? <img src={item.url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <span style={{ fontSize:"36px", opacity:0.4 }}>{SLIDER_EMOJIS[tipo]}</span>}
              </div>
              <div style={{ padding:"10px 12px" }}>
                <div style={{ fontSize:"13px", fontWeight:900, color:"#1a2a3a", marginBottom:"3px" }}>{item.titulo||"Item"}</div>
                {item.precio_bits ? <div style={{ fontSize:"12px", fontWeight:800, color:colorNexo }}>$ {item.precio_bits?.toLocaleString()}</div> : null}
              </div>
            </div>
          ))}
        </div>
      )}
      {(tipo==="novedades"||tipo==="faq"||tipo==="testimonios"||tipo==="personalizado"||tipo==="calendario"||tipo==="proveedores") && (
        <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
          {items.map((item:any)=>(
            <div key={item.id} style={{ background:"#fff", borderRadius:"14px", padding:"16px", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
              {item.miniatura_url && <img src={item.miniatura_url} alt="" style={{ width:"100%", maxHeight:"160px", objectFit:"cover", borderRadius:"10px", marginBottom:"10px" }} />}
              {item.titulo && <div style={{ fontSize:"14px", fontWeight:900, color:"#1a2a3a", marginBottom:"6px" }}>{item.titulo}</div>}
              {item.descripcion && <div style={{ fontSize:"13px", color:"#555", fontWeight:600, lineHeight:1.6 }}>{item.descripcion}</div>}
              {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ display:"inline-block", marginTop:"8px", fontSize:"12px", fontWeight:700, color:colorNexo, textDecoration:"none" }}>🔗 Ver más</a>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RolBadge({ rol, color }: { rol:string; color:string }) {
  const map: Record<string,{bg:string;c:string;l:string}> = {
    creador:   { bg:color,                     c:"#fff", l:"👑 Creador"  },
    moderador: { bg:"rgba(58,123,213,0.15)",   c:"#3a7bd5", l:"🛡️ Mod"  },
    miembro:   { bg:"rgba(39,174,96,0.12)",    c:"#27ae60", l:"✅ Miembro"},
  };
  const s = map[rol]||map.miembro;
  return <span style={{ background:s.bg, color:s.c, borderRadius:"20px", padding:"3px 10px", fontSize:"10px", fontWeight:900 }}>{s.l}</span>;
}

function EmptySlider({ emoji, texto, sub }: { emoji:string; texto:string; sub:string }) {
  return (
    <div style={{ textAlign:"center", padding:"50px 20px", background:"#fff", borderRadius:"16px" }}>
      <div style={{ fontSize:"48px", marginBottom:"12px" }}>{emoji}</div>
      <div style={{ fontSize:"15px", fontWeight:900, color:"#1a2a3a", marginBottom:"6px" }}>{texto}</div>
      {sub && <div style={{ fontSize:"12px", color:"#9a9a9a", fontWeight:600 }}>{sub}</div>}
    </div>
  );
}
