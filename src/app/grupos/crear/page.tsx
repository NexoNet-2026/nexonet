"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

type Categoria    = { id:number; nombre:string; emoji:string };
type Subcategoria = { id:number; nombre:string; emoji:string; categoria_id:number };

const STEPS = ["tipo","categoria","datos","config"];

export default function CrearGrupo() {
  const router = useRouter();

  const [step,          setStep]          = useState(0);
  const [categorias,    setCategorias]    = useState<Categoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [session,       setSession]       = useState<any>(null);
  const [guardando,     setGuardando]     = useState(false);

  // Formulario
  const [tipo,        setTipo]        = useState<"abierto"|"cerrado">("abierto");
  const [catSel,      setCatSel]      = useState<Categoria|null>(null);
  const [subSel,      setSubSel]      = useState<Subcategoria|null>(null);
  const [nombre,      setNombre]      = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [ciudad,      setCiudad]      = useState("");
  const [provincia,   setProvincia]   = useState("");
  const [reglas,      setReglas]      = useState("");
  const [waLink,      setWaLink]      = useState("");
  const [links,       setLinks]       = useState("");
  const [imagen,      setImagen]      = useState<File|null>(null);
  const [imagenPrev,  setImagenPrev]  = useState("");
  const [canonGratis, setCanonGratis] = useState(true);
  const [verDetalle,  setVerDetalle]  = useState(false);
  const [miembrosInv, setMiembrosInv] = useState(false);

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session:s}})=>{
      if(!s){ router.push("/login"); return; }
      setSession(s);
    });
    Promise.all([
      supabase.from("grupo_categorias").select("id,nombre,emoji").eq("activo",true).order("orden"),
      supabase.from("grupo_subcategorias").select("id,nombre,emoji,categoria_id").eq("activo",true).order("orden"),
    ]).then(([{data:c},{data:s}])=>{ if(c) setCategorias(c); if(s) setSubcategorias(s); });
  },[]);

  const subsDeCat = catSel ? subcategorias.filter(s=>s.categoria_id===catSel.id) : [];
  const puedeAvanzar = [
    true,                              // step 0: tipo siempre ok
    catSel!==null,                     // step 1: necesita categoría
    nombre.trim().length>=3&&ciudad.trim().length>=2, // step 2: nombre+ciudad
    true,                              // step 3: config siempre ok
  ];

  const handleImagen = (e:React.ChangeEvent<HTMLInputElement>)=>{
    const f=e.target.files?.[0]; if(!f) return;
    setImagen(f); setImagenPrev(URL.createObjectURL(f));
  };

  const guardar = async()=>{
    if(!session||!catSel) return;
    setGuardando(true);

    let imagen_url = "";
    if(imagen){
      const ext = imagen.name.split(".").pop();
      const path = `grupos/${Date.now()}.${ext}`;
      const {error:upErr} = await supabase.storage.from("imagenes").upload(path,imagen,{upsert:true});
      if(!upErr){
        const {data:urlData} = supabase.storage.from("imagenes").getPublicUrl(path);
        imagen_url = urlData.publicUrl;
      }
    }

    const config = {
      ver_miembros_detalle:       verDetalle,
      pestanas_publicas:          ["info","publico"],
      miembros_pueden_invitar:    miembrosInv,
      canon_gratis_por_defecto:   canonGratis,
      residentes_campos_publicos: ["nombre","unidad","estado_cuota"],
    };

    const { data:grupo, error } = await supabase.from("grupos").insert({
      nombre,
      descripcion,
      ciudad,
      provincia,
      tipo,
      categoria_id:    catSel.id,
      subcategoria_id: subSel?.id||null,
      creador_id:      session.user.id,
      reglas,
      links:           links.split("\n").map(l=>l.trim()).filter(Boolean),
      whatsapp_link:   waLink||null,
      imagen:          imagen_url||null,
      config,
      activo:          true,
    }).select().single();

    if(error){ alert("Error al crear el grupo: "+error.message); setGuardando(false); return; }

    // Agregar creador como miembro admin
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

  const progreso = ((step+1)/STEPS.length)*100;

  return(
    <main style={{paddingTop:"95px",paddingBottom:"130px",background:"#f4f4f2",minHeight:"100vh",fontFamily:"'Nunito',sans-serif"}}>
      <Header/>

      {/* Header del formulario */}
      <div style={{background:"linear-gradient(135deg,#1a2a3a,#243b55)",padding:"14px 16px 16px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"12px"}}>
          {step>0&&<button onClick={()=>setStep(s=>s-1)} style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:"50%",width:"32px",height:"32px",color:"#fff",fontSize:"16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>←</button>}
          <div style={{flex:1}}>
            <div style={{fontSize:"10px",fontWeight:700,color:"#d4a017",letterSpacing:"2px",textTransform:"uppercase"}}>Paso {step+1} de {STEPS.length}</div>
            <div style={{fontSize:"17px",fontWeight:900,color:"#fff",marginTop:"2px"}}>
              {step===0&&"¿Qué tipo de grupo?"}
              {step===1&&"¿De qué categoría?"}
              {step===2&&"Datos del grupo"}
              {step===3&&"Configuración"}
            </div>
          </div>
        </div>
        {/* Barra de progreso */}
        <div style={{background:"rgba(255,255,255,0.15)",borderRadius:"20px",height:"5px"}}>
          <div style={{background:"linear-gradient(90deg,#d4a017,#f0c040)",borderRadius:"20px",height:"5px",width:`${progreso}%`,transition:"width .3s"}}/>
        </div>
      </div>

      <div style={{padding:"20px 16px"}}>

        {/* ── STEP 0: TIPO ── */}
        {step===0&&(
          <div>
            <div style={{fontSize:"13px",fontWeight:700,color:"#9a9a9a",marginBottom:"16px",lineHeight:1.5}}>
              Elegí el tipo de acceso para tu grupo.
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
              {[
                {v:"abierto",  icon:"🔓", titulo:"Grupo abierto",  desc:"Cualquier usuario puede unirse directamente"},
                {v:"cerrado",  icon:"🔒", titulo:"Grupo cerrado",  desc:"Los usuarios solicitan acceso y vos aprobás cada uno"},
              ].map(o=>(
                <button key={o.v} onClick={()=>setTipo(o.v as any)} style={{
                  background:tipo===o.v?"linear-gradient(135deg,#1a2a3a,#243b55)":"#fff",
                  border:`2px solid ${tipo===o.v?"#d4a017":"#e8e8e6"}`,
                  borderRadius:"16px",padding:"18px",textAlign:"left",cursor:"pointer",
                  boxShadow:tipo===o.v?"0 4px 16px rgba(26,42,58,0.25)":"0 2px 8px rgba(0,0,0,0.05)",
                  fontFamily:"'Nunito',sans-serif",
                }}>
                  <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                    <span style={{fontSize:"32px"}}>{o.icon}</span>
                    <div>
                      <div style={{fontSize:"16px",fontWeight:900,color:tipo===o.v?"#f0c040":"#1a2a3a",marginBottom:"4px"}}>{o.titulo}</div>
                      <div style={{fontSize:"12px",fontWeight:600,color:tipo===o.v?"#8a9aaa":"#9a9a9a"}}>{o.desc}</div>
                    </div>
                    {tipo===o.v&&<div style={{marginLeft:"auto",fontSize:"20px"}}>✅</div>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 1: CATEGORÍA ── */}
        {step===1&&(
          <div>
            <div style={{fontSize:"13px",fontWeight:700,color:"#9a9a9a",marginBottom:"16px"}}>
              Elegí la categoría y subcategoría de tu grupo.
            </div>
            {/* Categorías */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"16px"}}>
              {categorias.map(c=>(
                <button key={c.id} onClick={()=>{ setCatSel(c); setSubSel(null); }} style={{
                  background:catSel?.id===c.id?"linear-gradient(135deg,#1a2a3a,#243b55)":"#fff",
                  border:`2px solid ${catSel?.id===c.id?"#d4a017":"#e8e8e6"}`,
                  borderRadius:"14px",padding:"14px 10px",cursor:"pointer",textAlign:"center",
                  fontFamily:"'Nunito',sans-serif",
                }}>
                  <div style={{fontSize:"26px",marginBottom:"6px"}}>{c.emoji}</div>
                  <div style={{fontSize:"12px",fontWeight:900,color:catSel?.id===c.id?"#f0c040":"#1a2a3a"}}>{c.nombre}</div>
                </button>
              ))}
            </div>
            {/* Subcategorías */}
            {catSel&&subsDeCat.length>0&&(
              <div>
                <div style={{fontSize:"11px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase",letterSpacing:"1px",marginBottom:"10px"}}>Subcategoría de {catSel.nombre}</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:"8px"}}>
                  <button onClick={()=>setSubSel(null)} style={{
                    background:!subSel?"#1a2a3a":"#f4f4f2",
                    border:`2px solid ${!subSel?"#1a2a3a":"#e8e8e6"}`,
                    borderRadius:"20px",padding:"6px 14px",fontSize:"12px",fontWeight:800,
                    color:!subSel?"#d4a017":"#2c2c2e",cursor:"pointer",fontFamily:"'Nunito',sans-serif",
                  }}>Todas</button>
                  {subsDeCat.map(s=>(
                    <button key={s.id} onClick={()=>setSubSel(s)} style={{
                      background:subSel?.id===s.id?"#1a2a3a":"#f4f4f2",
                      border:`2px solid ${subSel?.id===s.id?"#1a2a3a":"#e8e8e6"}`,
                      borderRadius:"20px",padding:"6px 14px",fontSize:"12px",fontWeight:800,
                      color:subSel?.id===s.id?"#d4a017":"#2c2c2e",cursor:"pointer",fontFamily:"'Nunito',sans-serif",
                    }}>{s.emoji} {s.nombre}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: DATOS ── */}
        {step===2&&(
          <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
            {/* Imagen */}
            <div>
              <div style={{fontSize:"12px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:"8px"}}>Imagen del grupo</div>
              <label style={{cursor:"pointer"}}>
                <input type="file" accept="image/*" onChange={handleImagen} style={{display:"none"}}/>
                <div style={{width:"100%",height:"140px",background:imagenPrev?"transparent":"linear-gradient(135deg,#1a2a3a,#243b55)",borderRadius:"16px",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",border:"2px dashed #d4a017",position:"relative"}}>
                  {imagenPrev?<img src={imagenPrev} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{textAlign:"center"}}><div style={{fontSize:"32px",marginBottom:"8px"}}>📷</div><div style={{fontSize:"12px",fontWeight:700,color:"#d4a017"}}>Tap para elegir imagen</div></div>}
                  {imagenPrev&&<div style={{position:"absolute",bottom:"8px",right:"8px",background:"rgba(0,0,0,0.6)",borderRadius:"8px",padding:"4px 10px",fontSize:"11px",fontWeight:700,color:"#fff"}}>✏️ Cambiar</div>}
                </div>
              </label>
            </div>

            <Campo label="Nombre del grupo *" placeholder="Ej: Edificio Torres del Sol, Club Pádel Rosario..." value={nombre} onChange={setNombre} max={80}/>
            <Campo label="Descripción" placeholder="¿De qué trata el grupo? ¿A quién está dirigido?" value={descripcion} onChange={setDescripcion} rows={3}/>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
              <Campo label="Ciudad *" placeholder="Ej: Rosario" value={ciudad} onChange={setCiudad}/>
              <Campo label="Provincia" placeholder="Ej: Santa Fe" value={provincia} onChange={setProvincia}/>
            </div>

            <Campo label="Reglas del grupo" placeholder="Normas de convivencia, conducta esperada..." value={reglas} onChange={setReglas} rows={3}/>
            <Campo label="Link de WhatsApp (opcional)" placeholder="https://chat.whatsapp.com/..." value={waLink} onChange={setWaLink}/>
            <Campo label="Links útiles (uno por línea)" placeholder={"https://sitio.com\nhttps://otro.com"} value={links} onChange={setLinks} rows={3}/>
          </div>
        )}

        {/* ── STEP 3: CONFIGURACIÓN ── */}
        {step===3&&(
          <div>
            <div style={{fontSize:"13px",fontWeight:700,color:"#9a9a9a",marginBottom:"16px",lineHeight:1.5}}>
              Configurá los permisos por defecto. Podés cambiarlos después desde el panel de moderador.
            </div>

            {/* Resumen */}
            <div style={{background:"linear-gradient(135deg,#1a2a3a,#243b55)",borderRadius:"16px",padding:"16px",marginBottom:"16px"}}>
              <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"10px"}}>
                {catSel&&<span style={{fontSize:"24px"}}>{catSel.emoji}</span>}
                <div>
                  <div style={{fontSize:"16px",fontWeight:900,color:"#fff"}}>{nombre||"Tu grupo"}</div>
                  <div style={{fontSize:"11px",fontWeight:700,color:"#d4a017"}}>{tipo==="cerrado"?"🔒 Cerrado":"🔓 Abierto"} · {subSel?.nombre||catSel?.nombre||"—"} · {ciudad||"—"}</div>
                </div>
              </div>
            </div>

            <div style={{background:"#fff",borderRadius:"14px",padding:"16px",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
              <div style={{fontSize:"12px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:"12px"}}>Permisos iniciales</div>

              <TogleCfg
                label="BIT Grupo gratis al unirse"
                sub={canonGratis?"Los nuevos miembros no pagan los $500":"Cada miembro paga $500 para acceder al chat y anuncios"}
                val={canonGratis} onChange={setCanonGratis}
              />
              <TogleCfg
                label="Los miembros pueden ver el detalle de otros"
                sub="Rol, BIT activo, etc."
                val={verDetalle} onChange={setVerDetalle}
              />
              <TogleCfg
                label="Los miembros pueden invitar"
                sub="No solo el creador y moderadores"
                val={miembrosInv} onChange={setMiembrosInv}
              />
            </div>

            <div style={{background:"rgba(212,160,23,0.08)",border:"2px solid rgba(212,160,23,0.3)",borderRadius:"14px",padding:"14px",marginTop:"14px"}}>
              <div style={{fontSize:"12px",fontWeight:800,color:"#a07810",marginBottom:"4px"}}>👑 Vos sos el creador</div>
              <div style={{fontSize:"12px",fontWeight:600,color:"#555",lineHeight:1.5}}>Tendrás acceso a la pestaña de Moderador / Admin para gestionar miembros, invitaciones, permisos y todo el contenido del grupo.</div>
            </div>
          </div>
        )}

        {/* Botón avanzar / crear */}
        <div style={{marginTop:"24px"}}>
          {step<STEPS.length-1?(
            <button onClick={()=>setStep(s=>s+1)} disabled={!puedeAvanzar[step]} style={{
              width:"100%",background:puedeAvanzar[step]?"linear-gradient(135deg,#f0c040,#d4a017)":"#f0f0f0",
              border:"none",borderRadius:"14px",padding:"15px",fontSize:"15px",fontWeight:900,
              color:puedeAvanzar[step]?"#1a2a3a":"#bbb",cursor:puedeAvanzar[step]?"pointer":"not-allowed",
              fontFamily:"'Nunito',sans-serif",boxShadow:puedeAvanzar[step]?"0 4px 0 #a07810":"none",
            }}>Siguiente →</button>
          ):(
            <button onClick={guardar} disabled={guardando||!nombre.trim()||!catSel} style={{
              width:"100%",background:guardando?"#f0f0f0":"linear-gradient(135deg,#f0c040,#d4a017)",
              border:"none",borderRadius:"14px",padding:"15px",fontSize:"15px",fontWeight:900,
              color:guardando?"#bbb":"#1a2a3a",cursor:guardando?"not-allowed":"pointer",
              fontFamily:"'Nunito',sans-serif",boxShadow:guardando?"none":"0 4px 0 #a07810",
            }}>{guardando?"Creando grupo...":"✅ Crear grupo"}</button>
          )}
        </div>

      </div>
      <BottomNav/>
    </main>
  );
}

// ── Mini componentes ──────────────────────────────────────────────────────────
function Campo({label,placeholder,value,onChange,max,rows}:{label:string;placeholder:string;value:string;onChange:(v:string)=>void;max?:number;rows?:number}) {
  const style:React.CSSProperties={border:"2px solid #e8e8e8",borderRadius:"12px",padding:"12px 14px",fontSize:"14px",fontFamily:"'Nunito',sans-serif",outline:"none",color:"#1a2a3a",width:"100%",boxSizing:"border-box",background:"#fff",resize:"none"};
  return(
    <div>
      <div style={{fontSize:"12px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:"6px"}}>{label}</div>
      {rows
        ?<textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} maxLength={max||1000} style={style}/>
        :<input type="text" value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} maxLength={max||200} style={style}/>
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
