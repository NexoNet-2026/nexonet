"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";

const IS: React.CSSProperties = { width:"100%", border:"2px solid #e8e8e6", borderRadius:"12px", padding:"12px 14px", fontSize:"14px", fontFamily:"'Nunito',sans-serif", color:"#1a2a3a", outline:"none", boxSizing:"border-box", background:"#fff" };
const L = ({children}:{children:React.ReactNode}) => <div style={{fontSize:"11px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:"6px",marginTop:"12px"}}>{children}</div>;

export default function ImportarPage() {
  const router = useRouter();
  const [bots, setBots] = useState<any[]>([]);
  const [rubros, setRubros] = useState<any[]>([]);
  const [subrubros, setSubrubros] = useState<any[]>([]);
  const [form, setForm] = useState({ url:"", titulo:"", descripcion:"", precio:"", moneda:"ARS", rubro_id:"", subrubro_id:"", bot_id:"", ciudad:"", provincia:"", imagenes:"" });
  const [reescrito, setReescrito] = useState<{titulo:string;descripcion:string}|null>(null);
  const [reescribiendo, setReescribiendo] = useState(false);
  const [publicando, setPublicando] = useState(false);

  useEffect(() => {
    supabase.from("usuarios").select("id,nombre_usuario,nombre,ciudad,provincia").eq("es_bot",true).then(({data})=>setBots(data||[]));
    supabase.from("rubros").select("id,nombre").order("orden").then(({data})=>setRubros(data||[]));
    supabase.from("subrubros").select("id,nombre,rubro_id").order("nombre").then(({data})=>setSubrubros(data||[]));
  }, []);

  const F = (k:string, v:string) => setForm(f=>({...f,[k]:v}));
  const subsDe = form.rubro_id ? subrubros.filter(s=>String(s.rubro_id)===form.rubro_id) : [];

  const reescribir = async () => {
    if (!form.titulo.trim()) { alert("Escribí el título original"); return; }
    setReescribiendo(true);
    try {
      const apiKey = prompt("API Key de Anthropic:");
      if (!apiKey) { setReescribiendo(false); return; }
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json", "x-api-key":apiKey, "anthropic-version":"2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:1000,
          messages:[{role:"user",content:`Reescribí este anuncio de forma completamente original, manteniendo la información clave (precio, características técnicas, estado) pero con palabras y estructura totalmente distintas. No copies frases del original. Escribí en español argentino informal.\n\nTítulo original: ${form.titulo}\nDescripción original: ${form.descripcion}\n\nRespondé SOLO con JSON: {"titulo": "...", "descripcion": "..."}`}]
        })
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || "";
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        setReescrito(parsed);
      } else {
        alert("No se pudo parsear la respuesta de IA");
      }
    } catch(e:any) { alert("Error: "+e.message); }
    setReescribiendo(false);
  };

  const publicar = async () => {
    const titulo = reescrito?.titulo || form.titulo;
    const descripcion = reescrito?.descripcion || form.descripcion;
    if (!titulo.trim()||!form.bot_id) { alert("Falta título y usuario"); return; }
    setPublicando(true);
    const bot = bots.find(b=>b.id===form.bot_id);
    const imgs = form.imagenes.split("\n").map(s=>s.trim()).filter(Boolean);
    const { error } = await supabase.from("anuncios").insert({
      usuario_id: form.bot_id, titulo, descripcion: descripcion||null,
      precio: form.precio ? parseFloat(form.precio) : null, moneda: form.moneda,
      ciudad: form.ciudad || bot?.ciudad || null, provincia: form.provincia || bot?.provincia || null,
      subrubro_id: form.subrubro_id ? parseInt(form.subrubro_id) : null,
      imagenes: imgs.length>0 ? imgs : null, avatar_url: imgs[0]||null,
      estado:"activo", fuente:"nexonet",
      fecha_vencimiento: new Date(Date.now()+30*24*60*60*1000).toISOString(),
    });
    setPublicando(false);
    if (error) { alert("Error: "+error.message); return; }
    alert("✅ Anuncio publicado");
    setForm({url:"",titulo:"",descripcion:"",precio:"",moneda:"ARS",rubro_id:"",subrubro_id:"",bot_id:form.bot_id,ciudad:"",provincia:"",imagenes:""});
    setReescrito(null);
  };

  return (
    <main style={{paddingTop:"95px",paddingBottom:"130px",background:"#f4f4f2",minHeight:"100vh",fontFamily:"'Nunito',sans-serif"}}>
      <Header/>
      <div style={{padding:"16px",maxWidth:"600px",margin:"0 auto"}}>
        <button onClick={()=>router.back()} style={{background:"rgba(26,42,58,0.08)",border:"1px solid rgba(26,42,58,0.2)",borderRadius:"10px",padding:"7px 13px",color:"#1a2a3a",fontSize:"13px",fontWeight:700,cursor:"pointer",fontFamily:"'Nunito',sans-serif",marginBottom:"14px"}}>← Volver</button>

        <div style={{background:"#fff",borderRadius:"16px",padding:"20px",boxShadow:"0 2px 10px rgba(0,0,0,0.06)"}}>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"24px",color:"#1a2a3a",letterSpacing:"1px",marginBottom:"4px"}}>📥 Importar anuncio</div>
          <div style={{fontSize:"12px",color:"#9a9a9a",fontWeight:600,marginBottom:"16px"}}>Copiar de otra plataforma + reescribir con IA</div>

          <L>👤 Usuario que publica</L>
          <select value={form.bot_id} onChange={e=>F("bot_id",e.target.value)} style={{...IS,marginBottom:"0"}}>
            <option value="">— Seleccionar bot —</option>
            {bots.map(b=><option key={b.id} value={b.id}>🤖 {b.nombre_usuario} ({b.nombre})</option>)}
          </select>

          <L>🔗 URL original (referencia)</L>
          <input value={form.url} onChange={e=>F("url",e.target.value)} placeholder="https://mercadolibre.com.ar/..." style={IS}/>

          <L>📝 Título original *</L>
          <input value={form.titulo} onChange={e=>F("titulo",e.target.value)} placeholder="Copiar título del anuncio original" style={IS}/>

          <L>📋 Descripción original</L>
          <textarea value={form.descripcion} onChange={e=>F("descripcion",e.target.value)} placeholder="Copiar descripción..." rows={4} style={{...IS,resize:"vertical"}}/>

          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:"8px",marginTop:"12px"}}>
            <div><L>💰 Precio</L><input type="number" value={form.precio} onChange={e=>F("precio",e.target.value)} placeholder="0" style={IS}/></div>
            <div><L>Moneda</L><select value={form.moneda} onChange={e=>F("moneda",e.target.value)} style={IS}><option value="ARS">ARS</option><option value="USD">USD</option></select></div>
          </div>

          <L>📂 Rubro</L>
          <select value={form.rubro_id} onChange={e=>{F("rubro_id",e.target.value);F("subrubro_id","");}} style={IS}>
            <option value="">— Rubro —</option>
            {rubros.map(r=><option key={r.id} value={r.id}>{r.nombre}</option>)}
          </select>
          {subsDe.length>0 && (<><L>📁 Subrubro</L><select value={form.subrubro_id} onChange={e=>F("subrubro_id",e.target.value)} style={IS}><option value="">— Subrubro —</option>{subsDe.map(s=><option key={s.id} value={s.id}>{s.nombre}</option>)}</select></>)}

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
            <div><L>🏙️ Ciudad</L><input value={form.ciudad} onChange={e=>F("ciudad",e.target.value)} placeholder="Rosario" style={IS}/></div>
            <div><L>🗺️ Provincia</L><input value={form.provincia} onChange={e=>F("provincia",e.target.value)} placeholder="Santa Fe" style={IS}/></div>
          </div>

          <L>🖼️ URLs de imágenes (una por línea)</L>
          <textarea value={form.imagenes} onChange={e=>F("imagenes",e.target.value)} placeholder={"https://img1.jpg\nhttps://img2.jpg"} rows={3} style={{...IS,resize:"vertical"}}/>

          {/* Botón reescribir */}
          <div style={{display:"flex",gap:"8px",marginTop:"16px"}}>
            <button onClick={reescribir} disabled={reescribiendo||!form.titulo.trim()}
              style={{flex:1,background:"linear-gradient(135deg,#8e44ad,#6c3483)",border:"none",borderRadius:"12px",padding:"14px",fontSize:"14px",fontWeight:900,color:"#fff",cursor:"pointer",fontFamily:"'Nunito',sans-serif",opacity:reescribiendo?0.6:1}}>
              {reescribiendo?"⏳ Reescribiendo...":"✨ Reescribir con IA"}
            </button>
          </div>

          {/* Resultado reescrito */}
          {reescrito && (
            <div style={{marginTop:"16px",background:"rgba(142,68,173,0.06)",border:"1px solid rgba(142,68,173,0.2)",borderRadius:"12px",padding:"14px"}}>
              <div style={{fontSize:"11px",fontWeight:800,color:"#8e44ad",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:"8px"}}>✨ Resultado IA</div>
              <L>Título reescrito</L>
              <input value={reescrito.titulo} onChange={e=>setReescrito({...reescrito,titulo:e.target.value})} style={IS}/>
              <L>Descripción reescrita</L>
              <textarea value={reescrito.descripcion} onChange={e=>setReescrito({...reescrito,descripcion:e.target.value})} rows={4} style={{...IS,resize:"vertical"}}/>
            </div>
          )}

          {/* Publicar */}
          <button onClick={publicar} disabled={publicando||!form.bot_id||!(reescrito?.titulo||form.titulo).trim()}
            style={{width:"100%",marginTop:"16px",background:"linear-gradient(135deg,#27ae60,#1e8449)",border:"none",borderRadius:"12px",padding:"14px",fontSize:"15px",fontWeight:900,color:"#fff",cursor:"pointer",fontFamily:"'Nunito',sans-serif",boxShadow:"0 3px 0 #155a2e",opacity:publicando?0.6:1}}>
            {publicando?"⏳ Publicando...":"📤 Publicar en NexoNet"}
          </button>
        </div>
      </div>
    </main>
  );
}
