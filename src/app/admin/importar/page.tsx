'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { supabase } from '@/lib/supabase';

const IS: React.CSSProperties = { width:'100%', border:'2px solid #e8e8e6', borderRadius:'12px', padding:'12px 14px', fontSize:'14px', fontFamily:"'Nunito',sans-serif", color:'#1a2a3a', outline:'none', boxSizing:'border-box', background:'#fff' };
const L = ({children}:{children:React.ReactNode}) => <div style={{fontSize:'11px',fontWeight:800,color:'#9a9a9a',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'6px',marginTop:'12px'}}>{children}</div>;

const CATEGORIAS_RG = [
  { id:'autos', label:'🚗 Autos', rbrId:'107' },
  { id:'utilitarios', label:'🚐 Utilitarios', rbrId:'110' },
  { id:'camionetas', label:'🛻 Camionetas', rbrId:'109' },
  { id:'camiones', label:'🚛 Camiones y Grúas', rbrId:'111' },
  { id:'motos', label:'🏍️ Motos', rbrId:'108' },
  { id:'clasicos', label:'🏎️ Clásicos', rbrId:'113' },
  { id:'embarcaciones', label:'⛵ Embarcaciones', rbrId:'114' },
  { id:'planes', label:'💳 Planes de Ahorro', rbrId:'116' },
  { id:'telefonia', label:'📱 Telefonía', rbrId:'118' },
  { id:'electronica', label:'💻 Electrónica', rbrId:'119' },
  { id:'hogar', label:'🏠 Hogar', rbrId:'121' },
  { id:'deportes', label:'⚽ Deportes', rbrId:'123' },
  { id:'herramientas', label:'🔧 Herramientas', rbrId:'126' },
  { id:'otros', label:'📦 Otros', rbrId:'127' },
];

type AnuncioRG = { url: string; titulo: string; precio: string; imagen: string; seleccionado: boolean; estado: 'pendiente'|'scrapeando'|'listo'|'error'|'publicado'; error?: string; };

export default function ImportarPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'rg'|'manual'>('rg');

  // RosarioGarage state
  const [bots, setBots] = useState<any[]>([]);
  const [rubros, setRubros] = useState<any[]>([]);
  const [subrubros, setSubrubros] = useState<any[]>([]);
  const [botId, setBotId] = useState('');
  const [rubroId, setRubroId] = useState('');
  const [subrubroId, setSubrubroId] = useState('');
  const [categoria, setCategoria] = useState('autos');
  const [marca, setMarca] = useState('');
  const [marcas, setMarcas] = useState<{id:string;nombre:string}[]>([]);
  const [precioDes, setPrecioDes] = useState('');
  const [precioHas, setPrecioHas] = useState('');
  const [yearDes, setYearDes] = useState('');
  const [yearHas, setYearHas] = useState('');
  const [anuncios, setAnuncios] = useState<AnuncioRG[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(0);
  const [buscando, setBuscando] = useState(false);
  const [scrapeando, setScrapeando] = useState(false);
  const [publicando, setPublicando] = useState(false);
  const [progreso, setProgreso] = useState(0);

  // Manual state
  const [formManual, setFormManual] = useState({ url:'', titulo:'', descripcion:'', precio:'', moneda:'ARS', rubro_id:'', subrubro_id:'', bot_id:'', ciudad:'', provincia:'', imagen:'' });
  const [previewManual, setPreviewManual] = useState<any>(null);
  const [scrapeandoManual, setScrapeandoManual] = useState(false);
  const [publicandoManual, setPublicandoManual] = useState(false);

  useEffect(() => {
    supabase.from('usuarios').select('id,nombre_usuario,nombre,ciudad,provincia').eq('es_bot',true).then(({data})=>{
      setBots(data||[]);
      const rg = (data||[]).find(b=>b.nombre_usuario==='RosarioGarage');
      if (rg) setBotId(rg.id);
    });
    supabase.from('rubros').select('id,nombre').order('orden').then(({data})=>setRubros(data||[]));
    supabase.from('subrubros').select('id,nombre,rubro_id').order('nombre').then(({data})=>setSubrubros(data||[]));
  }, []);

  const subsDe = rubroId ? subrubros.filter(s=>String(s.rubro_id)===rubroId) : [];

  const buscar = async (pag = 0) => {
    setBuscando(true);
    if (pag === 0) setAnuncios([]);
    const res = await fetch('/api/admin/rg-buscar', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ categoria, marca, precio_desde:precioDes, precio_hasta:precioHas, year_desde:yearDes, year_hasta:yearHas, pagina:pag }),
    });
    const data = await res.json();
    if (data.error) { alert('Error: '+data.error); setBuscando(false); return; }
    setTotal(data.total);
    setPagina(pag);
    if (data.marcas?.length > 0 && marcas.length === 0) setMarcas(data.marcas);
    const nuevos: AnuncioRG[] = data.links.map((l:any) => ({ url:l.url, titulo:'', precio:'', imagen:'', seleccionado:true, estado:'pendiente' as const }));
    setAnuncios(prev => pag === 0 ? nuevos : [...prev, ...nuevos]);
    setBuscando(false);

    // Scrapear automáticamente los datos de cada anuncio
    setScrapeando(true);
    const urls = nuevos.map(a=>a.url);
    const res2 = await fetch('/api/admin/rg-scrape-lote', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ urls }),
    });
    const data2 = await res2.json();
    if (data2.resultados) {
      setAnuncios(prev => {
        const updated = [...prev];
        data2.resultados.forEach((r:any) => {
          const idx = updated.findIndex(a=>a.url===r.url);
          if (idx>=0) updated[idx] = { ...updated[idx], titulo:r.titulo, precio:r.precio, imagen:r.imagen, estado:r.error?'error':'listo', error:r.error };
        });
        return updated;
      });
    }
    setScrapeando(false);
  };

  const publicarSeleccionados = async () => {
    const seleccionados = anuncios.filter(a=>a.seleccionado && a.estado==='listo' && a.titulo);
    if (!botId) { alert('Seleccioná un bot'); return; }
    if (seleccionados.length === 0) { alert('No hay anuncios listos para publicar'); return; }
    setPublicando(true);
    setProgreso(0);
    for (let i = 0; i < seleccionados.length; i++) {
      const a = seleccionados[i];
      const imgs = a.imagen ? [a.imagen] : [];
      const bot = bots.find(b=>b.id===botId);
      await supabase.from('anuncios').insert({
        usuario_id: botId,
        titulo: a.titulo,
        precio: a.precio ? parseFloat(a.precio) : null,
        moneda: 'ARS',
        ciudad: bot?.ciudad || 'Rosario',
        provincia: bot?.provincia || 'Santa Fe',
        subrubro_id: subrubroId ? parseInt(subrubroId) : null,
        imagenes: imgs.length > 0 ? imgs : null,
        avatar_url: imgs[0] || null,
        link_externo: a.url,
        estado: 'activo',
        fuente: 'nexonet',
        fecha_vencimiento: new Date(Date.now()+30*24*60*60*1000).toISOString(),
      });
      setAnuncios(prev => prev.map(x => x.url===a.url ? {...x, estado:'publicado' as const} : x));
      setProgreso(Math.round(((i+1)/seleccionados.length)*100));
    }
    setPublicando(false);
    alert(`✅ ${seleccionados.length} anuncios publicados`);
  };

  // Manual tab functions
  const FM = (k:string, v:string) => setFormManual(f=>({...f,[k]:v}));
  const convertirManual = async () => {
    if (!formManual.url.trim()) { alert('Pegá una URL'); return; }
    setScrapeandoManual(true);
    const res = await fetch('/api/admin/scrape-url', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ url: formManual.url }) });
    const data = await res.json();
    if (data.error) { alert('Error: '+data.error); setScrapeandoManual(false); return; }
    setPreviewManual(data);
    setFormManual(f=>({...f, titulo:data.titulo||'', precio:data.precio||'', imagen:data.imagen||''}));
    setScrapeandoManual(false);
  };
  const publicarManual = async () => {
    if (!formManual.titulo.trim()||!formManual.bot_id) { alert('Falta título y usuario'); return; }
    setPublicandoManual(true);
    const bot = bots.find(b=>b.id===formManual.bot_id);
    const imgs = formManual.imagen ? [formManual.imagen] : [];
    const { error } = await supabase.from('anuncios').insert({
      usuario_id: formManual.bot_id, titulo: formManual.titulo, descripcion: formManual.descripcion||null,
      precio: formManual.precio ? parseFloat(formManual.precio) : null, moneda: formManual.moneda,
      ciudad: formManual.ciudad || bot?.ciudad || null, provincia: formManual.provincia || bot?.provincia || null,
      subrubro_id: formManual.subrubro_id ? parseInt(formManual.subrubro_id) : null,
      imagenes: imgs.length>0 ? imgs : null, avatar_url: imgs[0]||null,
      link_externo: formManual.url||null, estado:'activo', fuente:'nexonet',
      fecha_vencimiento: new Date(Date.now()+30*24*60*60*1000).toISOString(),
    });
    setPublicandoManual(false);
    if (error) { alert('Error: '+error.message); return; }
    alert('✅ Anuncio publicado');
    setFormManual({url:'',titulo:'',descripcion:'',precio:'',moneda:'ARS',rubro_id:'',subrubro_id:'',bot_id:formManual.bot_id,ciudad:'',provincia:'',imagen:''});
    setPreviewManual(null);
  };

  const seleccionados = anuncios.filter(a=>a.seleccionado && a.estado==='listo').length;

  return (
    <main style={{paddingTop:'95px',paddingBottom:'130px',background:'#f4f4f2',minHeight:'100vh',fontFamily:"'Nunito',sans-serif"}}>
      <Header/>
      <div style={{padding:'16px',maxWidth:'900px',margin:'0 auto'}}>
        <button onClick={()=>router.back()} style={{background:'rgba(26,42,58,0.08)',border:'1px solid rgba(26,42,58,0.2)',borderRadius:'10px',padding:'7px 13px',color:'#1a2a3a',fontSize:'13px',fontWeight:700,cursor:'pointer',fontFamily:"'Nunito',sans-serif",marginBottom:'14px'}}>← Volver</button>

        {/* TABS */}
        <div style={{display:'flex',gap:'8px',marginBottom:'20px'}}>
          {[{id:'rg',label:'🚗 RosarioGarage'},{id:'manual',label:'🔗 Manual / URL'}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id as any)}
              style={{background:tab===t.id?'linear-gradient(135deg,#1a2a3a,#243b55)':'#fff',border:tab===t.id?'none':'2px solid #e8e8e6',borderRadius:'12px',padding:'10px 18px',fontSize:'13px',fontWeight:800,color:tab===t.id?'#d4a017':'#1a2a3a',cursor:'pointer',fontFamily:"'Nunito',sans-serif"}}>
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB ROSARIO GARAGE */}
        {tab==='rg' && (
          <div style={{background:'#fff',borderRadius:'16px',padding:'20px',boxShadow:'0 2px 10px rgba(0,0,0,0.06)'}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:'24px',color:'#1a2a3a',letterSpacing:'1px',marginBottom:'4px'}}>🚗 Importar desde RosarioGarage</div>
            <div style={{fontSize:'12px',color:'#9a9a9a',fontWeight:600,marginBottom:'16px'}}>Buscá anuncios con filtros y publicalos en masa</div>

            {/* Filtros */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
              <div>
                <L>Categoría</L>
                <select value={categoria} onChange={e=>setCategoria(e.target.value)} style={IS}>
                  {CATEGORIAS_RG.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <L>Marca (opcional)</L>
                <select value={marca} onChange={e=>setMarca(e.target.value)} style={IS}>
                  <option value=''>— Todas las marcas —</option>
                  {marcas.map(m=><option key={m.id} value={m.id}>{m.nombre}</option>)}
                </select>
              </div>
              <div>
                <L>Precio desde</L>
                <input value={precioDes} onChange={e=>setPrecioDes(e.target.value)} placeholder='0' style={IS}/>
              </div>
              <div>
                <L>Precio hasta</L>
                <input value={precioHas} onChange={e=>setPrecioHas(e.target.value)} placeholder='Sin límite' style={IS}/>
              </div>
              <div>
                <L>Año desde</L>
                <input value={yearDes} onChange={e=>setYearDes(e.target.value)} placeholder='2010' style={IS}/>
              </div>
              <div>
                <L>Año hasta</L>
                <input value={yearHas} onChange={e=>setYearHas(e.target.value)} placeholder='2025' style={IS}/>
              </div>
            </div>

            {/* Config publicación */}
            <div style={{marginTop:'16px',background:'#f9f9f7',borderRadius:'12px',padding:'14px'}}>
              <div style={{fontSize:'11px',fontWeight:800,color:'#9a9a9a',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'10px'}}>⚙️ Configuración de publicación</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'10px'}}>
                <div>
                  <L>Bot que publica</L>
                  <select value={botId} onChange={e=>setBotId(e.target.value)} style={IS}>
                    <option value=''>— Seleccionar —</option>
                    {bots.map(b=><option key={b.id} value={b.id}>🤖 {b.nombre_usuario}</option>)}
                  </select>
                </div>
                <div>
                  <L>Rubro NexoNet</L>
                  <select value={rubroId} onChange={e=>{setRubroId(e.target.value);setSubrubroId('');}} style={IS}>
                    <option value=''>— Rubro —</option>
                    {rubros.map(r=><option key={r.id} value={r.id}>{r.nombre}</option>)}
                  </select>
                </div>
                {subsDe.length>0 && (
                  <div>
                    <L>Subrubro</L>
                    <select value={subrubroId} onChange={e=>setSubrubroId(e.target.value)} style={IS}>
                      <option value=''>— Subrubro —</option>
                      {subsDe.map(s=><option key={s.id} value={s.id}>{s.nombre}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Botón buscar */}
            <button onClick={()=>buscar(0)} disabled={buscando||scrapeando}
              style={{width:'100%',marginTop:'16px',background:buscando||scrapeando?'#ccc':'linear-gradient(135deg,#e67e22,#d35400)',border:'none',borderRadius:'12px',padding:'14px',fontSize:'15px',fontWeight:900,color:'#fff',cursor:buscando||scrapeando?'not-allowed':'pointer',fontFamily:"'Nunito',sans-serif",boxShadow:'0 3px 0 #a04000'}}>
              {buscando?'⏳ Buscando...':scrapeando?'⏳ Obteniendo datos...':'🔍 Buscar anuncios'}
            </button>

            {/* Resultados */}
            {anuncios.length > 0 && (
              <div style={{marginTop:'20px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
                  <div style={{fontSize:'13px',fontWeight:800,color:'#1a2a3a'}}>
                    {total} anuncios encontrados — {seleccionados} seleccionados
                    {scrapeando && <span style={{color:'#e67e22',marginLeft:'8px'}}>⏳ Cargando datos...</span>}
                  </div>
                  <div style={{display:'flex',gap:'8px'}}>
                    <button onClick={()=>setAnuncios(prev=>prev.map(a=>({...a,seleccionado:true})))}
                      style={{background:'#f0f0f0',border:'none',borderRadius:'8px',padding:'5px 10px',fontSize:'11px',fontWeight:800,cursor:'pointer'}}>
                      ✅ Todos
                    </button>
                    <button onClick={()=>setAnuncios(prev=>prev.map(a=>({...a,seleccionado:false})))}
                      style={{background:'#f0f0f0',border:'none',borderRadius:'8px',padding:'5px 10px',fontSize:'11px',fontWeight:800,cursor:'pointer'}}>
                      ☐ Ninguno
                    </button>
                  </div>
                </div>

                {/* Tabla */}
                <div style={{display:'flex',flexDirection:'column',gap:'8px',maxHeight:'500px',overflowY:'auto'}}>
                  {anuncios.map((a,i)=>(
                    <div key={i} onClick={()=>a.estado!=='publicado'&&setAnuncios(prev=>prev.map((x,j)=>j===i?{...x,seleccionado:!x.seleccionado}:x))}
                      style={{display:'flex',alignItems:'center',gap:'10px',background:a.estado==='publicado'?'rgba(39,174,96,0.06)':a.seleccionado?'rgba(212,160,23,0.04)':'#fafafa',border:`2px solid ${a.estado==='publicado'?'#27ae60':a.seleccionado?'rgba(212,160,23,0.3)':'#e8e8e6'}`,borderRadius:'12px',padding:'10px',cursor:a.estado==='publicado'?'default':'pointer'}}>
                      <input type='checkbox' checked={a.seleccionado} readOnly style={{flexShrink:0,width:'16px',height:'16px',accentColor:'#d4a017'}}/>
                      {a.imagen
                        ? <img src={a.imagen} alt='' style={{width:'56px',height:'42px',objectFit:'cover',borderRadius:'8px',flexShrink:0}}/>
                        : <div style={{width:'56px',height:'42px',background:'#f0f0ee',borderRadius:'8px',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px'}}>{a.estado==='scrapeando'?'⏳':'🚗'}</div>
                      }
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:'12px',fontWeight:800,color:'#1a2a3a',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                          {a.titulo||'Cargando...'}
                        </div>
                        <div style={{fontSize:'11px',color:'#9a9a9a',fontWeight:600,marginTop:'2px'}}>
                          {a.precio?'$ '+Number(a.precio).toLocaleString('es-AR'):'Sin precio'}
                        </div>
                      </div>
                      <div style={{flexShrink:0}}>
                        {a.estado==='publicado'&&<span style={{fontSize:'11px',fontWeight:800,color:'#27ae60'}}>✅ Publicado</span>}
                        {a.estado==='error'&&<span style={{fontSize:'11px',fontWeight:800,color:'#e74c3c'}}>❌ Error</span>}
                        {a.estado==='pendiente'&&<span style={{fontSize:'11px',fontWeight:800,color:'#9a9a9a'}}>⏳</span>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Cargar más */}
                {anuncios.length < total && (
                  <button onClick={()=>buscar(pagina+1)} disabled={buscando||scrapeando}
                    style={{width:'100%',marginTop:'10px',background:'rgba(26,42,58,0.06)',border:'2px solid rgba(26,42,58,0.15)',borderRadius:'12px',padding:'12px',fontSize:'13px',fontWeight:800,color:'#1a2a3a',cursor:'pointer'}}>
                    ⬇️ Cargar más ({anuncios.length} de {total})
                  </button>
                )}

                {/* Publicar */}
                <button onClick={publicarSeleccionados} disabled={publicando||seleccionados===0||!botId}
                  style={{width:'100%',marginTop:'12px',background:publicando||seleccionados===0||!botId?'#ccc':'linear-gradient(135deg,#27ae60,#1e8449)',border:'none',borderRadius:'12px',padding:'14px',fontSize:'15px',fontWeight:900,color:'#fff',cursor:publicando||seleccionados===0||!botId?'not-allowed':'pointer',fontFamily:"'Nunito',sans-serif",boxShadow:'0 3px 0 #155a2e'}}>
                  {publicando?`⏳ Publicando... ${progreso}%`:`📤 Publicar ${seleccionados} anuncios en NexoNet`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB MANUAL */}
        {tab==='manual' && (
          <div style={{background:'#fff',borderRadius:'16px',padding:'20px',boxShadow:'0 2px 10px rgba(0,0,0,0.06)'}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:'24px',color:'#1a2a3a',letterSpacing:'1px',marginBottom:'4px'}}>🔗 Importar URL manual</div>
            <div style={{fontSize:'12px',color:'#9a9a9a',fontWeight:600,marginBottom:'16px'}}>Pegá un link de cualquier plataforma y convertilo en tarjeta NexoNet</div>
            <L>URL del producto</L>
            <div style={{display:'flex',gap:'8px'}}>
              <input value={formManual.url} onChange={e=>FM('url',e.target.value)} placeholder='https://...' style={{...IS,flex:1}}/>
              <button onClick={convertirManual} disabled={scrapeandoManual||!formManual.url.trim()}
                style={{background:scrapeandoManual?'#ccc':'linear-gradient(135deg,#1a2a3a,#243b55)',border:'none',borderRadius:'12px',padding:'0 16px',fontSize:'13px',fontWeight:900,color:'#fff',cursor:'pointer',whiteSpace:'nowrap',flexShrink:0}}>
                {scrapeandoManual?'⏳':'⚡ Convertir'}
              </button>
            </div>
            {previewManual && (<>
              {previewManual.imagen && <img src={previewManual.imagen} alt='' style={{width:'100%',height:'200px',objectFit:'cover',borderRadius:'12px',marginTop:'12px'}}/>}
              <L>Título</L><input value={formManual.titulo} onChange={e=>FM('titulo',e.target.value)} style={IS}/>
              <L>Descripción</L><textarea value={formManual.descripcion} onChange={e=>FM('descripcion',e.target.value)} rows={3} style={{...IS,resize:'vertical' as any}}/>
              <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:'8px',marginTop:'4px'}}>
                <div><L>Precio</L><input type='number' value={formManual.precio} onChange={e=>FM('precio',e.target.value)} style={IS}/></div>
                <div><L>Moneda</L><select value={formManual.moneda} onChange={e=>FM('moneda',e.target.value)} style={IS}><option value='ARS'>ARS</option><option value='USD'>USD</option></select></div>
              </div>
              <L>URL imagen</L><input value={formManual.imagen} onChange={e=>FM('imagen',e.target.value)} style={IS}/>
              <L>Bot que publica</L>
              <select value={formManual.bot_id} onChange={e=>FM('bot_id',e.target.value)} style={IS}>
                <option value=''>— Seleccionar bot —</option>
                {bots.map(b=><option key={b.id} value={b.id}>🤖 {b.nombre_usuario}</option>)}
              </select>
              <L>Rubro</L>
              <select value={formManual.rubro_id} onChange={e=>{FM('rubro_id',e.target.value);FM('subrubro_id','');}} style={IS}>
                <option value=''>— Rubro —</option>
                {rubros.map(r=><option key={r.id} value={r.id}>{r.nombre}</option>)}
              </select>
              {formManual.rubro_id && subrubros.filter(s=>String(s.rubro_id)===formManual.rubro_id).length>0 && (<>
                <L>Subrubro</L>
                <select value={formManual.subrubro_id} onChange={e=>FM('subrubro_id',e.target.value)} style={IS}>
                  <option value=''>— Subrubro —</option>
                  {subrubros.filter(s=>String(s.rubro_id)===formManual.rubro_id).map(s=><option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </>)}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <div><L>Ciudad</L><input value={formManual.ciudad} onChange={e=>FM('ciudad',e.target.value)} placeholder='Rosario' style={IS}/></div>
                <div><L>Provincia</L><input value={formManual.provincia} onChange={e=>FM('provincia',e.target.value)} placeholder='Santa Fe' style={IS}/></div>
              </div>
              <button onClick={publicarManual} disabled={publicandoManual||!formManual.bot_id||!formManual.titulo.trim()}
                style={{width:'100%',marginTop:'16px',background:publicandoManual?'#ccc':'linear-gradient(135deg,#27ae60,#1e8449)',border:'none',borderRadius:'12px',padding:'14px',fontSize:'15px',fontWeight:900,color:'#fff',cursor:'pointer',fontFamily:"'Nunito',sans-serif",boxShadow:'0 3px 0 #155a2e'}}>
                {publicandoManual?'⏳ Publicando...':'📤 Publicar en NexoNet'}
              </button>
            </>)}
          </div>
        )}
      </div>
    </main>
  );
}
