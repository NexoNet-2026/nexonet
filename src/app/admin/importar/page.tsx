'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { supabase } from '@/lib/supabase';

const IS: React.CSSProperties = { width:'100%', border:'2px solid #e8e8e6', borderRadius:'12px', padding:'12px 14px', fontSize:'14px', fontFamily:"'Nunito',sans-serif", color:'#1a2a3a', outline:'none', boxSizing:'border-box', background:'#fff' };
const L = ({children}:{children:React.ReactNode}) => <div style={{fontSize:'11px',fontWeight:800,color:'#9a9a9a',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'6px',marginTop:'12px'}}>{children}</div>;

export default function ImportarPage() {
  const router = useRouter();
  const [bots, setBots] = useState<any[]>([]);
  const [rubros, setRubros] = useState<any[]>([]);
  const [subrubros, setSubrubros] = useState<any[]>([]);
  const [form, setForm] = useState({ url:'', titulo:'', descripcion:'', precio:'', moneda:'ARS', rubro_id:'', subrubro_id:'', bot_id:'', ciudad:'', provincia:'', imagen:'' });
  const [preview, setPreview] = useState<{titulo:string;descripcion:string;imagen:string;precio:string}|null>(null);
  const [scrapeando, setScrapeando] = useState(false);
  const [publicando, setPublicando] = useState(false);

  useEffect(() => {
    supabase.from('usuarios').select('id,nombre_usuario,nombre,ciudad,provincia').eq('es_bot',true).then(({data})=>setBots(data||[]));
    supabase.from('rubros').select('id,nombre').order('orden').then(({data})=>setRubros(data||[]));
    supabase.from('subrubros').select('id,nombre,rubro_id').order('nombre').then(({data})=>setSubrubros(data||[]));
  }, []);

  const F = (k:string, v:string) => setForm(f=>({...f,[k]:v}));
  const subsDe = form.rubro_id ? subrubros.filter(s=>String(s.rubro_id)===form.rubro_id) : [];

  const convertir = async () => {
    if (!form.url.trim()) { alert('Pegá una URL primero'); return; }
    setScrapeando(true);
    try {
      const res = await fetch('/api/admin/scrape-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: form.url }),
      });
      const data = await res.json();
      if (data.error) { alert('Error: ' + data.error); setScrapeando(false); return; }
      setPreview({ titulo: data.titulo||'', descripcion: data.descripcion||'', imagen: data.imagen||'', precio: data.precio||'' });
      setForm(f=>({ ...f, titulo: data.titulo||'', descripcion: data.descripcion||'', precio: data.precio||'', imagen: data.imagen||'' }));
    } catch(e:any) { alert('Error: '+e.message); }
    setScrapeando(false);
  };

  const publicar = async () => {
    if (!form.titulo.trim()||!form.bot_id) { alert('Falta título y usuario'); return; }
    setPublicando(true);
    const bot = bots.find(b=>b.id===form.bot_id);
    const imgs = form.imagen ? [form.imagen] : [];
    const { error } = await supabase.from('anuncios').insert({
      usuario_id: form.bot_id,
      titulo: form.titulo,
      descripcion: form.descripcion||null,
      precio: form.precio ? parseFloat(form.precio) : null,
      moneda: form.moneda,
      ciudad: form.ciudad || bot?.ciudad || null,
      provincia: form.provincia || bot?.provincia || null,
      subrubro_id: form.subrubro_id ? parseInt(form.subrubro_id) : null,
      imagenes: imgs.length>0 ? imgs : null,
      avatar_url: imgs[0]||null,
      link_externo: form.url||null,
      estado: 'activo',
      fuente: 'nexonet',
      fecha_vencimiento: new Date(Date.now()+30*24*60*60*1000).toISOString(),
    });
    setPublicando(false);
    if (error) { alert('Error: '+error.message); return; }
    alert('✅ Anuncio publicado');
    setForm({ url:'', titulo:'', descripcion:'', precio:'', moneda:'ARS', rubro_id:'', subrubro_id:'', bot_id:form.bot_id, ciudad:'', provincia:'', imagen:'' });
    setPreview(null);
  };

  return (
    <main style={{paddingTop:'95px',paddingBottom:'130px',background:'#f4f4f2',minHeight:'100vh',fontFamily:"'Nunito',sans-serif"}}>
      <Header/>
      <div style={{padding:'16px',maxWidth:'600px',margin:'0 auto'}}>
        <button onClick={()=>router.back()} style={{background:'rgba(26,42,58,0.08)',border:'1px solid rgba(26,42,58,0.2)',borderRadius:'10px',padding:'7px 13px',color:'#1a2a3a',fontSize:'13px',fontWeight:700,cursor:'pointer',fontFamily:"'Nunito',sans-serif",marginBottom:'14px'}}>← Volver</button>

        <div style={{background:'#fff',borderRadius:'16px',padding:'20px',boxShadow:'0 2px 10px rgba(0,0,0,0.06)'}}>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:'24px',color:'#1a2a3a',letterSpacing:'1px',marginBottom:'4px'}}>📥 Importar anuncio afiliado</div>
          <div style={{fontSize:'12px',color:'#9a9a9a',fontWeight:600,marginBottom:'16px'}}>Pegá un link de ML, Amazon u otra plataforma y convertilo en tarjeta NexoNet</div>

          <L>🔗 URL del producto</L>
          <div style={{display:'flex',gap:'8px'}}>
            <input value={form.url} onChange={e=>F('url',e.target.value)} placeholder='https://articulo.mercadolibre.com.ar/...' style={{...IS,flex:1}}/>
            <button onClick={convertir} disabled={scrapeando||!form.url.trim()}
              style={{background:scrapeando||!form.url.trim()?'#ccc':'linear-gradient(135deg,#1a2a3a,#243b55)',border:'none',borderRadius:'12px',padding:'0 16px',fontSize:'13px',fontWeight:900,color:'#fff',cursor:scrapeando||!form.url.trim()?'not-allowed':'pointer',fontFamily:"'Nunito',sans-serif",whiteSpace:'nowrap',flexShrink:0}}>
              {scrapeando?'⏳ Leyendo...':'⚡ Convertir'}
            </button>
          </div>

          {preview && (
            <div style={{marginTop:'16px',border:'2px solid #e8e8e6',borderRadius:'14px',overflow:'hidden',background:'#fff',boxShadow:'0 4px 16px rgba(0,0,0,0.08)'}}>
              <div style={{fontSize:'10px',fontWeight:800,color:'#9a9a9a',textTransform:'uppercase',letterSpacing:'1px',padding:'10px 14px 6px',background:'#f9f9f7'}}>👁️ Vista previa de la tarjeta</div>
              {preview.imagen && (
                <div style={{width:'100%',height:'200px',overflow:'hidden',background:'#f0f0ee'}}>
                  <img src={preview.imagen} alt={preview.titulo} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>{(e.target as HTMLImageElement).style.display='none'}}/>
                </div>
              )}
              <div style={{padding:'14px'}}>
                <div style={{fontSize:'15px',fontWeight:900,color:'#1a2a3a',marginBottom:'6px',lineHeight:1.3}}>{preview.titulo}</div>
                {preview.descripcion && <div style={{fontSize:'12px',color:'#666',fontWeight:600,lineHeight:1.5,marginBottom:'8px',display:'-webkit-box',WebkitLineClamp:3,WebkitBoxOrient:'vertical' as any,overflow:'hidden'}}>{preview.descripcion}</div>}
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  {preview.precio && <div style={{fontSize:'16px',fontWeight:900,color:'#27ae60'}}>$ {parseFloat(preview.precio).toLocaleString('es-AR')}</div>}
                  <div style={{fontSize:'10px',fontWeight:700,color:'#3a7bd5',background:'rgba(58,123,213,0.1)',borderRadius:'8px',padding:'3px 8px'}}>🔗 Redirige a origen</div>
                </div>
              </div>
            </div>
          )}

          {preview && (
            <>
              <L>📝 Título</L>
              <input value={form.titulo} onChange={e=>F('titulo',e.target.value)} style={IS}/>

              <L>📋 Descripción</L>
              <textarea value={form.descripcion} onChange={e=>F('descripcion',e.target.value)} rows={3} style={{...IS,resize:'vertical'}}/>

              <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:'8px',marginTop:'4px'}}>
                <div><L>💰 Precio</L><input type='number' value={form.precio} onChange={e=>F('precio',e.target.value)} style={IS}/></div>
                <div><L>Moneda</L><select value={form.moneda} onChange={e=>F('moneda',e.target.value)} style={IS}><option value='ARS'>ARS</option><option value='USD'>USD</option></select></div>
              </div>

              <L>🖼️ URL imagen</L>
              <input value={form.imagen} onChange={e=>F('imagen',e.target.value)} style={IS}/>

              <L>👤 Usuario que publica</L>
              <select value={form.bot_id} onChange={e=>F('bot_id',e.target.value)} style={IS}>
                <option value=''>— Seleccionar bot —</option>
                {bots.map(b=><option key={b.id} value={b.id}>🤖 {b.nombre_usuario} ({b.nombre})</option>)}
              </select>

              <L>📂 Rubro</L>
              <select value={form.rubro_id} onChange={e=>{F('rubro_id',e.target.value);F('subrubro_id','');}} style={IS}>
                <option value=''>— Rubro —</option>
                {rubros.map(r=><option key={r.id} value={r.id}>{r.nombre}</option>)}
              </select>
              {subsDe.length>0 && (<><L>📁 Subrubro</L><select value={form.subrubro_id} onChange={e=>F('subrubro_id',e.target.value)} style={IS}><option value=''>— Subrubro —</option>{subsDe.map(s=><option key={s.id} value={s.id}>{s.nombre}</option>)}</select></>)}

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <div><L>🏙️ Ciudad</L><input value={form.ciudad} onChange={e=>F('ciudad',e.target.value)} placeholder='Rosario' style={IS}/></div>
                <div><L>🗺️ Provincia</L><input value={form.provincia} onChange={e=>F('provincia',e.target.value)} placeholder='Santa Fe' style={IS}/></div>
              </div>

              <button onClick={publicar} disabled={publicando||!form.bot_id||!form.titulo.trim()}
                style={{width:'100%',marginTop:'16px',background:publicando||!form.bot_id||!form.titulo.trim()?'#ccc':'linear-gradient(135deg,#27ae60,#1e8449)',border:'none',borderRadius:'12px',padding:'14px',fontSize:'15px',fontWeight:900,color:'#fff',cursor:publicando?'not-allowed':'pointer',fontFamily:"'Nunito',sans-serif",boxShadow:'0 3px 0 #155a2e'}}>
                {publicando?'⏳ Publicando...':'📤 Publicar en NexoNet'}
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
