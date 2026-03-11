"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

type Categoria    = { id:number; nombre:string; emoji:string };
type Subcategoria = { id:number; nombre:string; emoji:string; categoria_id:number };

const MODELOS = [
  { v:"invitacion_gratis",  icon:"🎁", titulo:"Invitación — el grupo paga",    desc:"Vos invitás a cada miembro. Cuando aceptan te llega el link de pago. El miembro entra sin costo.",          badge:"👑 Vos pagás por cada miembro", color:"#d4a017" },
  { v:"invitacion_miembro", icon:"📨", titulo:"Invitación — el miembro paga",  desc:"Vos invitás. El invitado decide si acepta y paga los $500 para acceder al grupo.",                            badge:"💰 El invitado paga",            color:"#3a7bd5" },
  { v:"solicitud_libre",    icon:"🙋", titulo:"Solicitudes abiertas",          desc:"Cualquier usuario puede solicitar unirse. Vos aprobás o rechazás, y elegís quién paga en cada caso.",          badge:"⚙️ Vos decidís caso a caso",     color:"#00a884" },
];

export default function CrearGrupo() {
  const router = useRouter();
  const [step,          setStep]          = useState(0);
  const [categorias,    setCategorias]    = useState<Categoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [session,       setSession]       = useState<any>(null);
  const [guardando,     setGuardando]     = useState(false);

  const [modelo,      setModelo]      = useState("invitacion_gratis");
  const [catSel,      setCatSel]      = useState<Categoria|null>(null);
  const [subSel,      setSubSel]      = useState<Subcategoria|null>(null);
  const [nombre,      setNombre]      = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [direccion,   setDireccion]   = useState("");
  const [ciudad,      setCiudad]      = useState("");
  const [provincia,   setProvincia]   = useState("");
  const [lat,         setLat]         = useState<number|null>(null);
  const [lng,         setLng]         = useState<number|null>(null);
  const [geoLoading,  setGeoLoading]  = useState(false);
  const [reglas,      setReglas]      = useState("");
  const [waAdmin,     setWaAdmin]     = useState("");
  const [links,       setLinks]       = useState("");
  const [imagen,      setImagen]      = useState<File|null>(null);
  const [imagenPrev,  setImagenPrev]  = useState("");
  const [verDetalle,  setVerDetalle]  = useState(false);

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session:s}})=>{
      if(!s){ router.push("/login"); return; }
      setSession(s);
    });
    Promise.all([
      supabase.from("grupo_categorias").select("id,nombre,emoji").eq("activo",true).order("orden"),
      supabase.from("grupo_subcategorias").select("id,nombre,emoji,categoria_id").eq("activo",true).order("orden"),
    ]).then(([{data:c},{data:s}])=>{ 
      if(c) setCategorias(c); 
      if(s) setSubcategorias(s); 
    });
  },[]);

  const subsDeCat = catSel ? subcategorias.filter(s=>s.categoria_id===catSel.id) : [];

  const puedeAvanzar = [
    true,
    catSel!==null,
    nombre.trim().length>=3 && ciudad.trim().length>=2,
    true,
  ];

  // Geolocalizar dirección
  const geolocalizarDireccion = async()=>{
    if(!direccion.trim()&&!ciudad.trim()) return;
    setGeoLoading(true);
    const query = [direccion,ciudad,provincia,"Argentina"].filter(Boolean).join(", ");
    try{
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      const data = await res.json();
      if(data.length>0){
        setLat(parseFloat(data[0].lat));
        setLng(parseFloat(data[0].lon));
        // Auto-completar ciudad si estaba vacía
        if(!ciudad.trim()&&data[0].address?.city) setCiudad(data[0].address.city);
      } else {
        alert("No se encontró la dirección. Verificá los datos.");
      }
    } catch(e){ alert("Error al geolocalizar."); }
    setGeoLoading(false);
  };

  // GPS automático
  const usarGPS = ()=>{
    if(!navigator.geolocation){ alert("Tu dispositivo no soporta GPS."); return; }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(async(pos)=>{
      const { latitude:la, longitude:lo } = pos.coords;
      setLat(la); setLng(lo);
      try{
        const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${la}&lon=${lo}`);
        const data = await res.json();
        if(data.address){
          if(!ciudad.trim())    setCiudad(data.address.city||data.address.town||data.address.village||"");
          if(!provincia.trim()) setProvincia(data.address.state||"");
          if(!direccion.trim()) setDireccion(`${data.address.road||""} ${data.address.house_number||""}`.trim());
        }
      } catch(e){}
      setGeoLoading(false);
    },()=>{ alert("No se pudo obtener tu ubicación."); setGeoLoading(false); });
  };

  const handleImagen = (e:React.ChangeEvent<HTMLInputElement>)=>{
    const f=e.target.files?.[0]; if(!f) return;
    setImagen(f); setImagenPrev(URL.createObjectURL(f));
  };

  const guardar = async()=>{
    if(!session||!catSel) return;
    setGuardando(true);

    let imagen_url = "";
    if(imagen){
      const ext  = imagen.name.split(".").pop()||"jpg";
      const path = `grupos/${session.user.id}-${Date.now()}.${ext}`;
      const {error:upErr} = await supabase.storage.from("imagenes").upload(path,imagen,{upsert:true});
      if(!upErr){
        const {data:urlData} = supabase.storage.from("imagenes").getPublicUrl(path);
        imagen_url = urlData.publicUrl;
      }
    }

    const tipo   = modelo==="solicitud_libre" ? "abierto" : "cerrado";
    const config = {
      modelo_acceso:              modelo,
      ver_miembros_detalle:       verDetalle,
      pestanas_publicas:          ["info","publico"],
      miembros_pueden_invitar:    false,   // miembros pueden invitar pero SOLO el creador autoriza
      solo_creador_autoriza:      true,
      canon_gratis_por_defecto:   modelo==="invitacion_gratis",
      residentes_campos_publicos: ["nombre","unidad","estado_cuota"],
    };

    const { data:grupo, error } = await supabase.from("grupos").insert({
      nombre, descripcion, ciudad, provincia, tipo,
      categoria_id:    catSel.id,
      subcategoria_id: subSel?.id||null,
      creador_id:      session.user.id,
      reglas,
      lat:             lat||null,
      lng:             lng||null,
      links:           links.split("\n").map(l=>l.trim()).filter(Boolean),
      whatsapp_link:   waAdmin ? (waAdmin.startsWith("https")?waAdmin:`https://wa.me/${waAdmin.replace(/\D/g,"")}`) : null,
      imagen:          imagen_url||null,
      config,
      activo:          true,
    }).select().single();

    if(error){ alert("Error al crear el grupo: "+error.message); setGuardando(false); return; }

    await supabase.from("grupo_miembros").insert({
      grupo_id:    grupo.id,
      usuario_id:  session.user.id,
      rol:         "creador",
      estado:      "activo",
      canon_gratis:true,
      bits_grupo:  true,
    });

    router.push(`/grupos/${grupo.id}`);
  };

  const progreso    = ((step+1)/4)*100;
  const modeloSel   = MODELOS.find(m=>m.v===modelo)!;

  return(
    <main style={{paddingTop:"95px",paddingBottom:"130px",background:"#f4f4f2",minHeight:"100vh",fontFamily:"'Nunito',sans-serif"}}>
      <Header/>

      {/* Cabecera */}
      <div style={{background:"linear-gradient(135deg,#1a2a3a,#243b55)",padding:"14px 16px 16px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"12px"}}>
          {step>0&&<button onClick={()=>setStep(s=>s-1)} style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:"50%",width:"32px",height:"32px",color:"#fff",fontSize:"16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>←</button>}
          <div style={{flex:1}}>
            <div style={{fontSize:"10px",fontWeight:700,color:"#d4a017",letterSpacing:"2px",textTransform:"uppercase"}}>Paso {step+1} de 4</div>
            <div style={{fontSize:"17px",fontWeight:900,color:"#fff",marginTop:"2px"}}>
              {step===0&&"¿Cómo manejás el acceso?"}
              {step===1&&"¿De qué categoría?"}
              {step===2&&"Datos del grupo"}
              {step===3&&"Configuración final"}
            </div>
          </div>
        </div>
        <div style={{background:"rgba(255,255,255,0.15)",borderRadius:"20px",height:"5px"}}>
          <div style={{background:"linear-gradient(90deg,#d4a017,#f0c040)",borderRadius:"20px",height:"5px",width:`${progreso}%`,transition:"width .3s"}}/>
        </div>
      </div>

      <div style={{padding:"20px 16px"}}>

        {/* ── STEP 0: MODELO ── */}
        {step===0&&(
          <div>
            <div style={{fontSize:"13px",fontWeight:700,color:"#9a9a9a",marginBottom:"16px",lineHeight:1.5}}>
              Elegí cómo se incorporan los miembros y quién paga el acceso al grupo.
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
              {MODELOS.map(o=>(
                <button key={o.v} onClick={()=>setModelo(o.v)} style={{background:modelo===o.v?"linear-gradient(135deg,#1a2a3a,#243b55)":"#fff",border:`2px solid ${modelo===o.v?o.color:"#e8e8e6"}`,borderRadius:"16px",padding:"18px",textAlign:"left",cursor:"pointer",boxShadow:modelo===o.v?"0 4px 16px rgba(26,42,58,0.25)":"0 2px 8px rgba(0,0,0,0.05)",fontFamily:"'Nunito',sans-serif",width:"100%"}}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:"12px"}}>
                    <span style={{fontSize:"30px",flexShrink:0}}>{o.icon}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:"15px",fontWeight:900,color:modelo===o.v?"#f0c040":"#1a2a3a",marginBottom:"5px"}}>{o.titulo}</div>
                      <div style={{fontSize:"12px",fontWeight:600,color:modelo===o.v?"#8a9aaa":"#9a9a9a",lineHeight:1.5,marginBottom:"8px"}}>{o.desc}</div>
                      <span style={{background:`${o.color}22`,border:`1px solid ${o.color}`,borderRadius:"20px",padding:"3px 10px",fontSize:"11px",fontWeight:800,color:o.color}}>{o.badge}</span>
                    </div>
                    {modelo===o.v&&<span style={{fontSize:"20px"}}>✅</span>}
                  </div>
                </button>
              ))}
            </div>
            <div style={{background:"rgba(212,160,23,0.08)",border:"2px solid rgba(212,160,23,0.25)",borderRadius:"12px",padding:"12px 14px",marginTop:"14px"}}>
              <div style={{fontSize:"12px",fontWeight:800,color:"#a07810",marginBottom:"4px"}}>💳 Link de pago automático</div>
              <div style={{fontSize:"12px",fontWeight:600,color:"#555",lineHeight:1.5}}>Cuando un miembro acepta o es aprobado, se genera el link de pago de $500 automáticamente — hacia vos o hacia el miembro según lo que elegiste.</div>
            </div>
          </div>
        )}

        {/* ── STEP 1: CATEGORÍA ── */}
        {step===1&&(
          <div>
            <div style={{fontSize:"13px",fontWeight:700,color:"#9a9a9a",marginBottom:"16px"}}>Elegí la categoría y subcategoría de tu grupo.</div>
            {categorias.length===0?(
              <div style={{textAlign:"center",padding:"40px",color:"#9a9a9a"}}>
                <div style={{fontSize:"28px",marginBottom:"10px"}}>⏳</div>
                <div style={{fontSize:"13px",fontWeight:700}}>Cargando categorías...</div>
              </div>
            ):(
              <>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"16px"}}>
                  {categorias.map(c=>(
                    <button key={c.id} onClick={()=>{setCatSel(c);setSubSel(null);}} style={{background:catSel?.id===c.id?"linear-gradient(135deg,#1a2a3a,#243b55)":"#fff",border:`2px solid ${catSel?.id===c.id?"#d4a017":"#e8e8e6"}`,borderRadius:"14px",padding:"16px 10px",cursor:"pointer",textAlign:"center",fontFamily:"'Nunito',sans-serif",boxShadow:catSel?.id===c.id?"0 4px 12px rgba(26,42,58,0.2)":"0 2px 6px rgba(0,0,0,0.05)"}}>
                      <div style={{fontSize:"28px",marginBottom:"6px"}}>{c.emoji}</div>
                      <div style={{fontSize:"12px",fontWeight:900,color:catSel?.id===c.id?"#f0c040":"#1a2a3a"}}>{c.nombre}</div>
                    </button>
                  ))}
                </div>
                {catSel&&subsDeCat.length>0&&(
                  <div>
                    <div style={{fontSize:"11px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase",letterSpacing:"1px",marginBottom:"10px"}}>
                      Subcategoría de {catSel.nombre} <span style={{color:"#bbb",fontWeight:600}}>(opcional)</span>
                    </div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:"8px"}}>
                      <button onClick={()=>setSubSel(null)} style={{background:!subSel?"#1a2a3a":"#f4f4f2",border:`2px solid ${!subSel?"#1a2a3a":"#e8e8e6"}`,borderRadius:"20px",padding:"6px 14px",fontSize:"12px",fontWeight:800,color:!subSel?"#d4a017":"#2c2c2e",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>General</button>
                      {subsDeCat.map(s=>(
                        <button key={s.id} onClick={()=>setSubSel(s)} style={{background:subSel?.id===s.id?"#1a2a3a":"#f4f4f2",border:`2px solid ${subSel?.id===s.id?"#1a2a3a":"#e8e8e6"}`,borderRadius:"20px",padding:"6px 14px",fontSize:"12px",fontWeight:800,color:subSel?.id===s.id?"#d4a017":"#2c2c2e",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>{s.emoji} {s.nombre}</button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── STEP 2: DATOS ── */}
        {step===2&&(
          <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>

            {/* Foto — cámara + galería separados */}
            <div>
              <div style={lblStyle}>Imagen del grupo</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
                <label style={{cursor:"pointer"}}>
                  <input type="file" accept="image/*" capture="environment" onChange={handleImagen} style={{display:"none"}}/>
                  <div style={{background:"linear-gradient(135deg,#1a2a3a,#243b55)",borderRadius:"14px",padding:"16px",textAlign:"center",border:"2px dashed rgba(212,160,23,0.4)"}}>
                    <div style={{fontSize:"26px",marginBottom:"6px"}}>📷</div>
                    <div style={{fontSize:"11px",fontWeight:800,color:"#d4a017"}}>Cámara</div>
                  </div>
                </label>
                <label style={{cursor:"pointer"}}>
                  <input type="file" accept="image/*" onChange={handleImagen} style={{display:"none"}}/>
                  <div style={{background:"linear-gradient(135deg,#1a2a3a,#243b55)",borderRadius:"14px",padding:"16px",textAlign:"center",border:"2px dashed rgba(212,160,23,0.4)"}}>
                    <div style={{fontSize:"26px",marginBottom:"6px"}}>🖼️</div>
                    <div style={{fontSize:"11px",fontWeight:800,color:"#d4a017"}}>Galería</div>
                  </div>
                </label>
              </div>
              {imagenPrev&&(
                <div style={{marginTop:"8px",position:"relative",borderRadius:"14px",overflow:"hidden",height:"120px"}}>
                  <img src={imagenPrev} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  <button onClick={()=>{setImagen(null);setImagenPrev("");}} style={{position:"absolute",top:"6px",right:"6px",background:"rgba(0,0,0,0.6)",border:"none",borderRadius:"50%",width:"28px",height:"28px",color:"#fff",fontSize:"14px",cursor:"pointer"}}>✕</button>
                </div>
              )}
            </div>

            <Campo label="Nombre del grupo *" placeholder="Ej: Edificio Torres del Sol..." value={nombre} onChange={setNombre} max={80}/>
            <Campo label="Descripción" placeholder="¿De qué trata el grupo?" value={descripcion} onChange={setDescripcion} rows={3}/>

            {/* Dirección + geolocalización */}
            <div>
              <div style={lblStyle}>Ubicación</div>
              <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                <div style={{display:"flex",gap:"8px"}}>
                  <input type="text" value={direccion} onChange={e=>setDireccion(e.target.value)} placeholder="Dirección (opcional)" maxLength={120}
                    style={{...iStyle,flex:1}}/>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
                  <input type="text" value={ciudad} onChange={e=>setCiudad(e.target.value)} placeholder="Ciudad *" maxLength={60} style={iStyle}/>
                  <input type="text" value={provincia} onChange={e=>setProvincia(e.target.value)} placeholder="Provincia" maxLength={60} style={iStyle}/>
                </div>
                <div style={{display:"flex",gap:"8px"}}>
                  <button onClick={geolocalizarDireccion} disabled={geoLoading} style={{flex:1,background:"rgba(26,42,58,0.07)",border:"2px solid #e8e8e6",borderRadius:"12px",padding:"10px",fontSize:"12px",fontWeight:800,color:"#1a2a3a",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>
                    {geoLoading?"⏳ Buscando...":"🔍 Geolocalizar dirección"}
                  </button>
                  <button onClick={usarGPS} disabled={geoLoading} style={{flex:1,background:lat?"rgba(0,168,132,0.1)":"rgba(26,42,58,0.07)",border:`2px solid ${lat?"#00a884":"#e8e8e6"}`,borderRadius:"12px",padding:"10px",fontSize:"12px",fontWeight:800,color:lat?"#00a884":"#1a2a3a",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>
                    {lat?"📍 GPS ✅":"📍 Usar mi GPS"}
                  </button>
                </div>
                {lat&&lng&&<div style={{fontSize:"11px",fontWeight:700,color:"#00a884",textAlign:"center"}}>✅ Coordenadas: {lat.toFixed(4)}, {lng.toFixed(4)}</div>}
              </div>
            </div>

            <Campo label="Reglas del grupo (opcional)" placeholder="Normas de convivencia..." value={reglas} onChange={setReglas} rows={3}/>

            {/* WhatsApp del administrador */}
            <div>
              <div style={lblStyle}>WhatsApp del administrador</div>
              <div style={{position:"relative"}}>
                <span style={{position:"absolute",left:"12px",top:"50%",transform:"translateY(-50%)",fontSize:"16px",pointerEvents:"none"}}>📱</span>
                <input type="tel" value={waAdmin} onChange={e=>setWaAdmin(e.target.value)} placeholder="Número o link (ej: 3413001234)"
                  style={{...iStyle,paddingLeft:"36px"}}/>
              </div>
              <div style={{fontSize:"11px",color:"#9a9a9a",fontWeight:600,marginTop:"4px"}}>Los miembros del grupo podrán contactarte directamente</div>
            </div>

            <Campo label="Links útiles (uno por línea, opcional)" placeholder={"https://sitio.com\nhttps://otro.com"} value={links} onChange={setLinks} rows={2}/>
          </div>
        )}

        {/* ── STEP 3: CONFIG ── */}
        {step===3&&(
          <div>
            {/* Resumen */}
            <div style={{background:"linear-gradient(135deg,#1a2a3a,#243b55)",borderRadius:"16px",padding:"16px",marginBottom:"16px"}}>
              <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"10px"}}>
                {catSel&&<span style={{fontSize:"26px"}}>{catSel.emoji}</span>}
                <div>
                  <div style={{fontSize:"16px",fontWeight:900,color:"#fff"}}>{nombre}</div>
                  <div style={{fontSize:"11px",fontWeight:700,color:"#d4a017"}}>{subSel?.nombre||catSel?.nombre||"—"} · {ciudad}</div>
                </div>
              </div>
              <span style={{background:`${modeloSel.color}30`,border:`1px solid ${modeloSel.color}`,borderRadius:"20px",padding:"3px 12px",fontSize:"11px",fontWeight:800,color:modeloSel.color}}>
                {modeloSel.icon} {modeloSel.titulo}
              </span>
            </div>

            <div style={{background:"#fff",borderRadius:"14px",padding:"16px",boxShadow:"0 2px 8px rgba(0,0,0,0.06)",marginBottom:"12px"}}>
              <div style={{...lblStyle,marginBottom:"12px"}}>Permisos del grupo</div>
              <TogleCfg
                label="Los miembros ven el detalle de otros"
                sub="Nombre, rol, BIT activo, estado de cuota"
                val={verDetalle} onChange={setVerDetalle}
              />
              {/* Invitaciones siempre con autorización del creador */}
              <div style={{padding:"10px 0",borderBottom:"1px solid #f5f5f5"}}>
                <div style={{fontSize:"13px",fontWeight:800,color:"#1a2a3a"}}>📨 Los miembros pueden invitar personas</div>
                <div style={{fontSize:"11px",color:"#9a9a9a",fontWeight:600,marginTop:"2px",lineHeight:1.4}}>Pueden sugerir invitados, pero <strong>solo vos autorizás</strong> el ingreso final desde el Panel Admin.</div>
              </div>
            </div>

            <div style={{background:"rgba(212,160,23,0.08)",border:"2px solid rgba(212,160,23,0.3)",borderRadius:"14px",padding:"14px"}}>
              <div style={{fontSize:"12px",fontWeight:800,color:"#a07810",marginBottom:"4px"}}>👑 Sos el creador del grupo</div>
              <div style={{fontSize:"12px",fontWeight:600,color:"#555",lineHeight:1.5}}>Accedés al Panel Admin para gestionar miembros, aprobar solicitudes, invitar personas y configurar todos los permisos.</div>
            </div>
          </div>
        )}

        {/* Botón avanzar / crear */}
        <div style={{marginTop:"24px"}}>
          {step<3?(
            <button onClick={()=>setStep(s=>s+1)} disabled={!puedeAvanzar[step]} style={{width:"100%",background:puedeAvanzar[step]?"linear-gradient(135deg,#f0c040,#d4a017)":"#f0f0f0",border:"none",borderRadius:"14px",padding:"15px",fontSize:"15px",fontWeight:900,color:puedeAvanzar[step]?"#1a2a3a":"#bbb",cursor:puedeAvanzar[step]?"pointer":"not-allowed",fontFamily:"'Nunito',sans-serif",boxShadow:puedeAvanzar[step]?"0 4px 0 #a07810":"none"}}>
              Siguiente →
            </button>
          ):(
            <button onClick={guardar} disabled={guardando} style={{width:"100%",background:guardando?"#f0f0f0":"linear-gradient(135deg,#f0c040,#d4a017)",border:"none",borderRadius:"14px",padding:"15px",fontSize:"15px",fontWeight:900,color:guardando?"#bbb":"#1a2a3a",cursor:guardando?"not-allowed":"pointer",fontFamily:"'Nunito',sans-serif",boxShadow:guardando?"none":"0 4px 0 #a07810"}}>
              {guardando?"Creando grupo...":"✅ Crear grupo"}
            </button>
          )}
        </div>
      </div>
      <BottomNav/>
    </main>
  );
}

// ── Mini componentes ──────────────────────────────────────────────────────────
function Campo({label,placeholder,value,onChange,max,rows}:{label:string;placeholder:string;value:string;onChange:(v:string)=>void;max?:number;rows?:number}) {
  return(
    <div>
      <div style={lblStyle}>{label}</div>
      {rows
        ?<textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} maxLength={max||1000} style={{...iStyle,resize:"none"}}/>
        :<input    value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} maxLength={max||200} style={iStyle}/>
      }
    </div>
  );
}
function TogleCfg({label,sub,val,onChange}:{label:string;sub:string;val:boolean;onChange:(v:boolean)=>void}) {
  return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #f5f5f5"}}>
      <div style={{flex:1,paddingRight:"12px"}}>
        <div style={{fontSize:"13px",fontWeight:800,color:"#1a2a3a"}}>{label}</div>
        <div style={{fontSize:"11px",color:"#9a9a9a",fontWeight:600,marginTop:"2px",lineHeight:1.4}}>{sub}</div>
      </div>
      <button onClick={()=>onChange(!val)} style={{width:"44px",height:"24px",borderRadius:"12px",border:"none",background:val?"#d4a017":"#e0e0e0",position:"relative",cursor:"pointer",flexShrink:0}}>
        <div style={{width:"18px",height:"18px",borderRadius:"50%",background:"#fff",position:"absolute",top:"3px",left:val?"23px":"3px",transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
      </button>
    </div>
  );
}
const lblStyle:React.CSSProperties = {fontSize:"11px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:"6px"};
const iStyle:React.CSSProperties   = {border:"2px solid #e8e8e8",borderRadius:"12px",padding:"12px 14px",fontSize:"14px",fontFamily:"'Nunito',sans-serif",outline:"none",color:"#1a2a3a",width:"100%",boxSizing:"border-box",background:"#fff"};
