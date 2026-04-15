"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const S = {
  card:  { background:"#fff", borderRadius:"16px", padding:"20px", boxShadow:"0 2px 12px rgba(0,0,0,0.07)", marginBottom:"14px" } as React.CSSProperties,
  input: { width:"100%", border:"2px solid #e8e8e6", borderRadius:"10px", padding:"10px 14px", fontSize:"13px", fontFamily:"'Nunito',sans-serif", color:"#2c2c2e", outline:"none", boxSizing:"border-box" as const } as React.CSSProperties,
  btn:   (c="#d4a017", disabled=false): React.CSSProperties => ({ background:`linear-gradient(135deg,${c},${c}cc)`, border:"none", borderRadius:"10px", padding:"10px 16px", fontSize:"13px", fontWeight:900, color:"#fff", cursor: disabled?"not-allowed":"pointer", fontFamily:"'Nunito',sans-serif", opacity: disabled?0.6:1, whiteSpace:"nowrap" }),
  label: { fontSize:"11px", fontWeight:800, color:"#666", textTransform:"uppercase" as const, letterSpacing:"1px", marginBottom:"5px", display:"block" } as React.CSSProperties,
  sect:  { fontSize:"11px", fontWeight:800, color:"#9a9a9a", textTransform:"uppercase" as const, letterSpacing:"1px", marginBottom:"12px" } as React.CSSProperties,
};

export default function BotsAdmin() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<"crear"|"mensajes">("crear");
  const [toast, setToast] = useState("");

  // Crear
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<"grupo"|"servicio"|"empresa">("grupo");
  const [subtipo, setSubtipo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [fotos, setFotos] = useState<{url:string;thumbnail:string;autor:string}[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [seleccionando, setSeleccionando] = useState<"avatar"|"banner"|null>(null);
  const [generandoIA, setGenerandoIA] = useState(false);
  const [creando, setCreando] = useState(false);

  // Mensajes
  const [mensajes, setMensajes] = useState<any[]>([]);
  const [cargandoMsgs, setCargandoMsgs] = useState(false);
  const [respuestas, setRespuestas] = useState<Record<string,string>>({});
  const [enviandoId, setEnviandoId] = useState<string|null>(null);

  const showToast = (m:string) => { setToast(m); setTimeout(()=>setToast(""), 3500); };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push("/login"); return; }
      const { data: u } = await supabase.from("usuarios").select("es_admin_sistema").eq("id", session.user.id).single();
      if (!u?.es_admin_sistema) { router.push("/"); return; }
      setAuthed(true);
    });
  }, [router]);

  const cargarMensajes = useCallback(async () => {
    setCargandoMsgs(true);
    try {
      const r = await fetch("/api/admin/bot-mensajes");
      const d = await r.json();
      if (!r.ok || d.error) showToast("Error: " + (d.error || r.status));
      else setMensajes(d.mensajes || []);
    } catch (e:any) {
      showToast("Error: " + e.message);
    } finally { setCargandoMsgs(false); }
  }, []);

  useEffect(() => {
    if (authed && tab === "mensajes") cargarMensajes();
  }, [authed, tab, cargarMensajes]);

  const buscarFotos = async () => {
    if (!nombre.trim()) return showToast("Escribí un nombre primero");
    setBuscando(true);
    try {
      const r = await fetch(`/api/admin/pexels-buscar?q=${encodeURIComponent(nombre)}`);
      const d = await r.json();
      if (!r.ok || d.error) showToast("Error: " + (d.error || r.status));
      else setFotos(d.fotos || []);
    } catch (e:any) { showToast("Error: " + e.message); }
    finally { setBuscando(false); }
  };

  const seleccionarFoto = (url:string) => {
    if (seleccionando === "avatar") setAvatarUrl(url);
    else if (seleccionando === "banner") setBannerUrl(url);
    else return showToast("Elegí primero el slot: avatar o banner");
    setSeleccionando(null);
  };

  const generarIA = async () => {
    if (!nombre.trim()) return showToast("Escribí un nombre primero");
    setGenerandoIA(true);
    try {
      const r = await fetch("/api/admin/crear-bot/ia", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ nombre, tipo }),
      });
      const d = await r.json();
      if (!r.ok || d.error) showToast("Error: " + (d.error || r.status));
      else setDescripcion(d.descripcion || "");
    } catch (e:any) { showToast("Error: " + e.message); }
    finally { setGenerandoIA(false); }
  };

  const crearBot = async () => {
    if (!nombre.trim() || !tipo) return showToast("Faltan campos");
    if (!confirm(`¿Crear bot "${nombre}" como ${tipo}?`)) return;
    setCreando(true);
    try {
      const r = await fetch("/api/admin/crear-bot", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ nombre, tipo, subtipo, descripcion, avatar_url: avatarUrl, banner_url: bannerUrl }),
      });
      const d = await r.json();
      if (!r.ok || d.error) showToast("Error: " + (d.error || r.status));
      else {
        showToast(`✅ Bot creado: ${d.email}`);
        setNombre(""); setSubtipo(""); setDescripcion("");
        setAvatarUrl(""); setBannerUrl(""); setFotos([]);
      }
    } catch (e:any) { showToast("Error: " + e.message); }
    finally { setCreando(false); }
  };

  const responder = async (msg:any) => {
    const texto = respuestas[msg.id]?.trim();
    if (!texto) return showToast("Escribí una respuesta");
    setEnviandoId(msg.id);
    try {
      const r = await fetch("/api/admin/bot-mensajes", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ mensaje_id: msg.id, respuesta: texto, bot_id: msg.bot_id }),
      });
      const d = await r.json();
      if (!r.ok || d.error) showToast("Error: " + (d.error || r.status));
      else {
        showToast("Respuesta enviada");
        setRespuestas(p => ({ ...p, [msg.id]: "" }));
        cargarMensajes();
      }
    } catch (e:any) { showToast("Error: " + e.message); }
    finally { setEnviandoId(null); }
  };

  if (!authed) return <div style={{padding:"20px", fontFamily:"'Nunito',sans-serif"}}>Verificando acceso…</div>;

  const noRespondidos = mensajes.filter(m => !m.respondido).length;

  // Agrupar mensajes por bot
  const porBot: Record<string, { bot:any; items:any[] }> = {};
  for (const m of mensajes) {
    const k = m.bot_id || "sin-bot";
    if (!porBot[k]) porBot[k] = { bot: m.bot, items: [] };
    porBot[k].items.push(m);
  }

  return (
    <div style={{fontFamily:"'Nunito',sans-serif", padding:"20px", background:"#f6f5f2", minHeight:"100vh", maxWidth:"820px", margin:"0 auto"}}>
      <div style={{display:"flex", alignItems:"center", gap:"12px", marginBottom:"16px"}}>
        <button onClick={()=>router.push("/admin")} style={{...S.btn("#9a9a9a")}}>← Admin</button>
        <div style={{fontFamily:"'Bebas Neue',sans-serif", fontSize:"32px", color:"#1a2a3a", letterSpacing:"2px"}}>🤖 BOTS</div>
      </div>

      <div style={{display:"flex", gap:"8px", marginBottom:"16px"}}>
        <button onClick={()=>setTab("crear")} style={S.btn(tab==="crear"?"#d4a017":"#bbb")}>➕ Crear Bot</button>
        <button onClick={()=>setTab("mensajes")} style={S.btn(tab==="mensajes"?"#d4a017":"#bbb")}>
          💬 Mensajes {noRespondidos>0 && <span style={{background:"#e74c3c", borderRadius:"20px", padding:"1px 7px", fontSize:"10px", marginLeft:"6px"}}>{noRespondidos}</span>}
        </button>
      </div>

      {tab==="crear" && (
        <>
          <div style={S.card}>
            <div style={S.sect}>📝 Datos básicos</div>
            <label style={S.label}>Nombre del bot</label>
            <input style={S.input} value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Ej: Panaderos de Buenos Aires" />

            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginTop:"12px"}}>
              <div>
                <label style={S.label}>Tipo</label>
                <select style={S.input} value={tipo} onChange={e=>setTipo(e.target.value as any)}>
                  <option value="grupo">Grupo</option>
                  <option value="servicio">Servicio</option>
                  <option value="empresa">Empresa</option>
                </select>
              </div>
              <div>
                <label style={S.label}>Subtipo</label>
                <input style={S.input} value={subtipo} onChange={e=>setSubtipo(e.target.value)} placeholder="Ej: comunidad, rubro…" />
              </div>
            </div>
          </div>

          <div style={S.card}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px"}}>
              <div style={S.sect}>📸 Imágenes</div>
              <button onClick={buscarFotos} disabled={buscando} style={S.btn("#3a7bd5", buscando)}>{buscando?"Buscando…":"🔍 Buscar en Pexels"}</button>
            </div>

            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"4px"}}>
              <div>
                <label style={S.label}>Avatar {seleccionando==="avatar" && "(elegí ↓)"}</label>
                <div onClick={()=>setSeleccionando(seleccionando==="avatar"?null:"avatar")}
                  style={{border:"2px dashed "+(seleccionando==="avatar"?"#d4a017":"#e8e8e6"), borderRadius:"10px", height:"110px", cursor:"pointer", background: avatarUrl?`url(${avatarUrl}) center/cover`:"#f9f9f7", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"11px", color:"#9a9a9a", fontWeight:700}}>
                  {!avatarUrl && (seleccionando==="avatar"?"Elegí una foto":"Click para elegir")}
                </div>
              </div>
              <div>
                <label style={S.label}>Banner {seleccionando==="banner" && "(elegí ↓)"}</label>
                <div onClick={()=>setSeleccionando(seleccionando==="banner"?null:"banner")}
                  style={{border:"2px dashed "+(seleccionando==="banner"?"#d4a017":"#e8e8e6"), borderRadius:"10px", height:"110px", cursor:"pointer", background: bannerUrl?`url(${bannerUrl}) center/cover`:"#f9f9f7", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"11px", color:"#9a9a9a", fontWeight:700}}>
                  {!bannerUrl && (seleccionando==="banner"?"Elegí una foto":"Click para elegir")}
                </div>
              </div>
            </div>

            {fotos.length>0 && (
              <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"6px", marginTop:"14px"}}>
                {fotos.map((f,i)=>(
                  <div key={i} onClick={()=>seleccionarFoto(f.url)} title={f.autor}
                    style={{cursor:"pointer", height:"80px", borderRadius:"8px", background:`url(${f.thumbnail}) center/cover`, border:"3px solid "+((avatarUrl===f.url||bannerUrl===f.url)?"#d4a017":"transparent"), transition:"border .15s"}} />
                ))}
              </div>
            )}
          </div>

          <div style={S.card}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"8px"}}>
              <div style={S.sect}>📄 Descripción</div>
              <button onClick={generarIA} disabled={generandoIA} style={S.btn("#8e44ad", generandoIA)}>{generandoIA?"Generando…":"✨ Generar con IA"}</button>
            </div>
            <textarea style={{...S.input, minHeight:"130px", resize:"vertical" as const, fontFamily:"'Nunito',sans-serif"}}
              value={descripcion} onChange={e=>setDescripcion(e.target.value)}
              placeholder="Descripción del bot/nexo…" />
          </div>

          {(nombre||descripcion||avatarUrl||bannerUrl) && (
            <div style={S.card}>
              <div style={S.sect}>👁️ Preview</div>
              <div style={{border:"1px solid #e8e8e6", borderRadius:"12px", overflow:"hidden"}}>
                <div style={{height:"110px", background: bannerUrl?`url(${bannerUrl}) center/cover`:"linear-gradient(135deg,#1a2a3a,#243b55)"}} />
                <div style={{padding:"12px", display:"flex", gap:"10px"}}>
                  <div style={{width:"64px", height:"64px", borderRadius:"50%", background: avatarUrl?`url(${avatarUrl}) center/cover`:"linear-gradient(135deg,#d4a017,#f0c040)", border:"3px solid #fff", marginTop:"-34px", flexShrink:0, boxShadow:"0 2px 8px rgba(0,0,0,0.15)"}} />
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif", fontSize:"20px", color:"#1a2a3a", letterSpacing:"1px"}}>{nombre||"(sin nombre)"}</div>
                    <div style={{fontSize:"10px", fontWeight:800, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"1px"}}>{tipo}{subtipo?` · ${subtipo}`:""}</div>
                    <div style={{fontSize:"12px", color:"#555", marginTop:"8px", whiteSpace:"pre-wrap", lineHeight:1.5}}>{descripcion||"(sin descripción)"}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <button onClick={crearBot} disabled={creando || !nombre.trim()}
            style={{...S.btn("#27ae60", creando || !nombre.trim()), width:"100%", padding:"14px", fontSize:"15px"}}>
            {creando?"Creando…":"✅ Crear Bot"}
          </button>
        </>
      )}

      {tab==="mensajes" && (
        <>
          {cargandoMsgs ? (
            <div style={{...S.card, textAlign:"center", color:"#9a9a9a"}}>Cargando…</div>
          ) : mensajes.length===0 ? (
            <div style={{...S.card, textAlign:"center", color:"#9a9a9a"}}>Sin mensajes todavía</div>
          ) : (
            Object.entries(porBot).map(([botId, grupo]) => (
              <div key={botId} style={S.card}>
                <div style={{display:"flex", alignItems:"center", gap:"10px", marginBottom:"14px", paddingBottom:"10px", borderBottom:"1px solid #f0f0f0"}}>
                  <div style={{width:"42px", height:"42px", borderRadius:"50%", background: grupo.bot?.avatar_url?`url(${grupo.bot.avatar_url}) center/cover`:"linear-gradient(135deg,#d4a017,#f0c040)", flexShrink:0}} />
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontSize:"14px", fontWeight:900, color:"#1a2a3a"}}>{grupo.bot?.nombre_usuario || "(bot desconocido)"}</div>
                    <div style={{fontSize:"10px", fontWeight:700, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"0.5px"}}>{grupo.items.length} mensaje{grupo.items.length!==1?"s":""} · {grupo.items.filter((m:any)=>!m.respondido).length} pendiente{grupo.items.filter((m:any)=>!m.respondido).length!==1?"s":""}</div>
                  </div>
                </div>

                {grupo.items.map((m:any) => (
                  <div key={m.id} style={{borderLeft: m.respondido?"3px solid #27ae60":"3px solid #e74c3c", paddingLeft:"12px", marginBottom:"14px"}}>
                    <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"6px"}}>
                      <div style={{fontSize:"12px", fontWeight:800, color:"#1a2a3a"}}>👤 {m.usuario?.nombre_usuario || "—"}</div>
                      <div style={{fontSize:"10px", color:"#bbb", fontWeight:700}}>{new Date(m.created_at).toLocaleString("es-AR")}</div>
                    </div>
                    <div style={{background:"#f4f4f2", borderRadius:"10px", padding:"10px", fontSize:"13px", color:"#1a2a3a", marginBottom:"8px", whiteSpace:"pre-wrap"}}>{m.mensaje}</div>

                    {m.respondido ? (
                      <div style={{background:"rgba(39,174,96,0.08)", borderRadius:"10px", padding:"10px", fontSize:"12px", color:"#27ae60", whiteSpace:"pre-wrap"}}>↳ {m.respuesta}</div>
                    ) : (
                      <div style={{display:"flex", gap:"6px"}}>
                        <input style={S.input} value={respuestas[m.id]||""} onChange={e=>setRespuestas(p=>({...p,[m.id]:e.target.value}))} placeholder="Respuesta…" />
                        <button onClick={()=>responder(m)} disabled={enviandoId===m.id} style={S.btn("#27ae60", enviandoId===m.id)}>
                          {enviandoId===m.id?"…":"Enviar"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))
          )}
        </>
      )}

      {toast && (
        <div style={{position:"fixed", bottom:"20px", left:"50%", transform:"translateX(-50%)", background:"#1a2a3a", color:"#fff", padding:"12px 22px", borderRadius:"12px", zIndex:999, fontSize:"13px", fontWeight:700, boxShadow:"0 4px 16px rgba(0,0,0,0.25)"}}>{toast}</div>
      )}
    </div>
  );
}
