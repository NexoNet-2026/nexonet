'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'

type Rubro = { id: number; nombre: string; orden: number }
type Subrubro = { id: number; rubro_id: number; nombre: string }
type Filtro = { id: number; filtro_id: number; subrubro_id: number; nombre: string; tipo: string; obligatorio: boolean; orden: number }
type Opcion = { id: number; filtro_id: number; subrubro_id: number; opcion: string }

const CAMPOS_FIJOS = ['precio', 'descripcion', 'descripción', 'precio de venta', 'titulo', 'título', 'moneda', 'moneda de publicación', 'tipo de moneda']

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px',
  background: 'rgba(0,0,0,0.3)',
  border: '1px solid rgba(0,210,255,0.25)',
  borderRadius: '10px', color: 'white',
  fontSize: '14px', fontFamily: "'Nunito',sans-serif",
  fontWeight: 600, outline: 'none', boxSizing: 'border-box',
}

const selectStyle: React.CSSProperties = {
  width: '100%', padding: '12px 36px 12px 14px',
  background: 'rgba(0,0,0,0.3)',
  border: '1px solid rgba(0,210,255,0.25)',
  borderRadius: '10px', color: 'white',
  fontSize: '14px', fontFamily: "'Nunito',sans-serif",
  fontWeight: 600, outline: 'none', cursor: 'pointer',
  appearance: 'none', WebkitAppearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2300D2FF' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center',
  boxSizing: 'border-box',
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(0,210,255,0.2)',
  borderRadius: '16px', padding: '16px',
  display: 'flex', flexDirection: 'column', gap: '12px',
}

const labelStyle: React.CSSProperties = {
  fontSize: '12px', color: 'rgba(255,255,255,0.45)',
  marginBottom: '5px', fontWeight: 700, display: 'block',
}

const sectionTitle: React.CSSProperties = {
  fontSize: '13px', fontWeight: 800, color: '#00D2FF',
  letterSpacing: '0.5px', marginBottom: '4px',
}

const btnPrimary = (active: boolean): React.CSSProperties => ({
  flex: 2, padding: '14px',
  background: active ? 'rgba(0,180,255,0.25)' : 'rgba(255,255,255,0.05)',
  backdropFilter: 'blur(12px)',
  border: active ? '1px solid rgba(0,210,255,0.6)' : '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  color: active ? 'white' : 'rgba(255,255,255,0.2)',
  fontSize: '14px', fontWeight: 800,
  cursor: active ? 'pointer' : 'not-allowed',
  fontFamily: "'Nunito',sans-serif",
  boxShadow: active ? '0 0 16px rgba(0,180,255,0.2)' : 'none',
  transition: 'all 0.2s ease',
})

const btnSecondary: React.CSSProperties = {
  flex: 1, padding: '14px',
  background: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '12px', color: 'rgba(255,255,255,0.6)',
  fontSize: '14px', fontWeight: 700,
  cursor: 'pointer', fontFamily: "'Nunito',sans-serif",
}

// Componente simple para cada fila del resumen — evita el problema de TypeScript con arrays
function FilaResumen({ label, valor }: { label: string; valor: string }) {
  return (
    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
      <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 700 }}>{label}: </span>{valor}
    </div>
  )
}

function PublicarContent() {
  const searchParams = useSearchParams()
  const subrubroIdParam = searchParams.get('subrubro_id')
  const rubroIdParam = searchParams.get('rubro_id')

  const [paso, setPaso] = useState(subrubroIdParam ? 2 : 1)
  const [rubros, setRubros] = useState<Rubro[]>([])
  const [subrubros, setSubrubros] = useState<Subrubro[]>([])
  const [filtros, setFiltros] = useState<Filtro[]>([])
  const [opciones, setOpciones] = useState<Opcion[]>([])

  const [rubroId, setRubroId] = useState<number | null>(rubroIdParam ? Number(rubroIdParam) : null)
  const [subrubroId, setSubrubroId] = useState<number | null>(subrubroIdParam ? Number(subrubroIdParam) : null)
  const [rubroNombre, setRubroNombre] = useState('')
  const [subrubroNombre, setSubrubroNombre] = useState('')

  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [precio, setPrecio] = useState('')
  const [moneda, setMoneda] = useState('ARS')
  const [ciudad, setCiudad] = useState('Roldán')
  const [provincia, setProvincia] = useState('Santa Fe')
  const [valoresFiltros, setValoresFiltros] = useState<Record<string, string>>({})
  const [imagenes, setImagenes] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [publicando, setPublicando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)

  useEffect(() => {
    supabase.from('rubros').select('*').order('orden').then(({ data }) => { if (data) setRubros(data) })
  }, [])

  useEffect(() => {
    if (subrubroIdParam) {
      const id = Number(subrubroIdParam)
      supabase.from('subrubros').select('*').eq('id', id).single().then(({ data }) => {
        if (data) {
          setSubrubroNombre(data.nombre)
          setRubroId(data.rubro_id)
          supabase.from('rubros').select('*').eq('id', data.rubro_id).single().then(({ data: r }) => { if (r) setRubroNombre(r.nombre) })
          supabase.from('subrubros').select('*').eq('rubro_id', data.rubro_id).then(({ data: subs }) => { if (subs) setSubrubros(subs) })
        }
      })
    }
  }, [subrubroIdParam])

  useEffect(() => {
    if (rubroId && !subrubroIdParam) {
      setSubrubroId(null)
      supabase.from('subrubros').select('*').eq('rubro_id', rubroId).then(({ data }) => { if (data) setSubrubros(data) })
      const r = rubros.find(r => r.id === rubroId)
      if (r) setRubroNombre(r.nombre)
    }
  }, [rubroId])

  useEffect(() => {
    if (subrubroId) {
      supabase.from('filtros').select('*').eq('subrubro_id', subrubroId).order('orden').then(({ data }) => {
        if (data) setFiltros(data.filter((f: Filtro) => !CAMPOS_FIJOS.includes(f.nombre.toLowerCase().trim())))
      })
      supabase.from('opciones_filtro').select('*').eq('subrubro_id', subrubroId).then(({ data }) => { if (data) setOpciones(data) })
      const s = subrubros.find(s => s.id === subrubroId)
      if (s) setSubrubroNombre(s.nombre)
    }
  }, [subrubroId])

  const opcionesDeFiltro = (filtro_id: number) => opciones.filter(o => o.filtro_id === filtro_id)
  const esBooleanField = (nombre: string) => ['permuta','financiaci','negociable','entrega'].some(k => nombre.toLowerCase().includes(k))

  const handleImagenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const nuevas = [...imagenes, ...files].slice(0, 3)
    setImagenes(nuevas)
    setPreviews(nuevas.map(f => URL.createObjectURL(f)))
  }

  const eliminarImagen = (index: number) => {
    const nuevas = imagenes.filter((_, i) => i !== index)
    setImagenes(nuevas)
    setPreviews(nuevas.map(f => URL.createObjectURL(f)))
  }

  const handlePublicar = async () => {
    setPublicando(true); setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const urlsImagenes: string[] = []
      for (const img of imagenes) {
        const nombre = `${Date.now()}_${img.name.replace(/\s/g, '_')}`
        const { error: uploadError } = await supabase.storage.from('Imagenes').upload(nombre, img)
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('Imagenes').getPublicUrl(nombre)
          urlsImagenes.push(urlData.publicUrl)
        }
      }
      const { error } = await supabase.from('anuncios').insert({
        titulo, descripcion, precio: precio ? parseFloat(precio) : null,
        moneda, ciudad, provincia, subrubro_id: subrubroId,
        usuario_id: user?.id || null, imagenes: urlsImagenes, estado: 'activo',
      })
      if (error) setError('Error al publicar. Intentá de nuevo.')
      else setExito(true)
    } catch { setError('Error inesperado. Intentá de nuevo.') }
    setPublicando(false)
  }

  if (exito) return (
    <div style={{ fontFamily:"'Nunito',sans-serif", maxWidth:'430px', margin:'0 auto', minHeight:'100vh', position:'relative' }}>
      <div style={{ position:'fixed', top:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:'430px', height:'100vh', backgroundImage:"url('/fondo_pantallas.png')", backgroundSize:'100% 100%', zIndex:0 }} />
      <div style={{ position:'fixed', top:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:'430px', height:'100vh', background:'rgba(5,13,26,0.75)', zIndex:1 }} />
      <div style={{ position:'relative', zIndex:2, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', padding:'40px 24px', textAlign:'center' }}>
        <div style={{ fontSize:'80px', marginBottom:'20px' }}>🎉</div>
        <div style={{ fontSize:'26px', fontWeight:900, color:'white', marginBottom:'8px' }}>¡Anuncio publicado!</div>
        <div style={{ fontSize:'14px', color:'rgba(255,255,255,0.5)', marginBottom:'32px' }}>Tu anuncio ya está visible en NexoNet</div>
        <a href={subrubroIdParam ? `/anuncios?subrubro_id=${subrubroIdParam}` : '/'} style={{ background:'rgba(0,180,255,0.25)', border:'1px solid rgba(0,210,255,0.6)', color:'white', padding:'14px 28px', borderRadius:'12px', fontWeight:800, textDecoration:'none', fontSize:'15px' }}>← Volver</a>
      </div>
    </div>
  )

  return (
    <div style={{ fontFamily:"'Nunito',sans-serif", maxWidth:'430px', margin:'0 auto', minHeight:'100vh', position:'relative' }}>
      <div style={{ position:'fixed', top:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:'430px', height:'100vh', backgroundImage:"url('/fondo_pantallas.png')", backgroundSize:'100% 100%', zIndex:0 }} />
      <div style={{ position:'fixed', top:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:'430px', height:'100vh', background:'rgba(5,13,26,0.72)', zIndex:1 }} />

      <div style={{ position:'fixed', top:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:'430px', zIndex:100, background:'rgba(5,13,26,0.85)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', borderBottom:'1px solid rgba(0,210,255,0.15)', padding:'12px 16px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <a href={subrubroIdParam ? `/anuncios?subrubro_id=${subrubroIdParam}` : '/'} style={{ color:'rgba(255,255,255,0.5)', textDecoration:'none', fontSize:'22px' }}>←</a>
          <div>
            {rubroNombre && <div style={{ fontSize:'10px', color:'rgba(0,210,255,0.6)', textTransform:'uppercase', letterSpacing:'1px', fontWeight:700 }}>{rubroNombre}{subrubroNombre ? ` › ${subrubroNombre}` : ''}</div>}
            <div style={{ fontSize:'16px', fontWeight:900, color:'white' }}>➕ Publicar anuncio</div>
          </div>
        </div>
        <div style={{ marginTop:'10px', background:'rgba(255,255,255,0.08)', borderRadius:'4px', height:'3px' }}>
          <div style={{ background:'linear-gradient(90deg,#00D2FF,#0080FF)', height:'3px', borderRadius:'4px', width:`${(paso/3)*100}%`, transition:'width 0.3s', boxShadow:'0 0 8px rgba(0,210,255,0.5)' }} />
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:'6px' }}>
          {['Categoría','Datos','Ubicación'].map((s, i) => (
            <span key={i} style={{ fontSize:'10px', fontWeight:700, color: paso >= i+1 ? '#00D2FF' : 'rgba(255,255,255,0.2)' }}>{s}</span>
          ))}
        </div>
      </div>

      <div style={{ position:'relative', zIndex:2, paddingTop:'90px', paddingBottom:'100px' }}>
        <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:'12px' }}>

          {paso === 1 && (
            <div style={cardStyle}>
              <div style={sectionTitle}>¿En qué categoría publicás?</div>
              <div>
                <label style={labelStyle}>Rubro</label>
                <select value={rubroId || ''} onChange={e => setRubroId(Number(e.target.value))} style={selectStyle}>
                  <option value="" style={{ background:'#0a1628' }}>Seleccioná un rubro</option>
                  {rubros.map(r => <option key={r.id} value={r.id} style={{ background:'#0a1628' }}>{r.nombre}</option>)}
                </select>
              </div>
              {subrubros.length > 0 && (
                <div>
                  <label style={labelStyle}>Subrubro</label>
                  <select value={subrubroId || ''} onChange={e => setSubrubroId(Number(e.target.value))} style={selectStyle}>
                    <option value="" style={{ background:'#0a1628' }}>Seleccioná un subrubro</option>
                    {subrubros.map(s => <option key={s.id} value={s.id} style={{ background:'#0a1628' }}>{s.nombre}</option>)}
                  </select>
                </div>
              )}
              <button onClick={() => subrubroId && setPaso(2)} disabled={!subrubroId} style={{ ...btnPrimary(!!subrubroId), flex: 'unset' as any }}>
                Continuar →
              </button>
            </div>
          )}

          {paso === 2 && (
            <>
              <div style={cardStyle}>
                <div style={sectionTitle}>📝 Datos del anuncio</div>
                <div>
                  <label style={labelStyle}>Título *</label>
                  <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ej: Peugeot 408 Allure 2012" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Descripción</label>
                  <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Describí tu anuncio..." rows={3} style={{ ...inputStyle, resize:'none' }} />
                </div>
                <div style={{ display:'flex', gap:'8px' }}>
                  <div style={{ flex:1 }}>
                    <label style={labelStyle}>Precio</label>
                    <input value={precio} onChange={e => setPrecio(e.target.value)} placeholder="0" type="number" style={inputStyle} />
                  </div>
                  <div style={{ width:'90px' }}>
                    <label style={labelStyle}>Moneda</label>
                    <select value={moneda} onChange={e => setMoneda(e.target.value)} style={selectStyle}>
                      <option style={{ background:'#0a1628' }}>ARS</option>
                      <option style={{ background:'#0a1628' }}>USD</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style={cardStyle}>
                <div style={sectionTitle}>📷 Fotos (hasta 3)</div>
                <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                  {previews.map((url, i) => (
                    <div key={i} style={{ position:'relative', width:'88px', height:'88px' }}>
                      <img src={url} style={{ width:'88px', height:'88px', objectFit:'cover', borderRadius:'10px', border:'1px solid rgba(0,210,255,0.3)' }} />
                      <button onClick={() => eliminarImagen(i)} style={{ position:'absolute', top:'-6px', right:'-6px', background:'#E53935', color:'white', border:'none', borderRadius:'50%', width:'22px', height:'22px', fontSize:'12px', cursor:'pointer', fontWeight:900 }}>✕</button>
                    </div>
                  ))}
                  {imagenes.length < 3 && (
                    <label style={{ width:'88px', height:'88px', border:'2px dashed rgba(0,210,255,0.3)', borderRadius:'10px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', gap:'4px', background:'rgba(0,210,255,0.05)' }}>
                      <span style={{ fontSize:'28px' }}>📷</span>
                      <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.4)', fontWeight:700 }}>Agregar</span>
                      <input type="file" accept="image/*" onChange={handleImagenChange} style={{ display:'none' }} multiple />
                    </label>
                  )}
                </div>
              </div>

              {filtros.length > 0 && (
                <div style={cardStyle}>
                  <div style={sectionTitle}>📋 Características</div>
                  {filtros.map(filtro => {
                    const opts = opcionesDeFiltro(filtro.filtro_id)
                    const esBool = esBooleanField(filtro.nombre)
                    return (
                      <div key={filtro.id}>
                        <label style={labelStyle}>{filtro.nombre}{filtro.obligatorio ? ' *' : ''}</label>
                        {esBool || opts.length > 0 ? (
                          <select value={valoresFiltros[filtro.filtro_id] || ''} onChange={e => setValoresFiltros(prev => ({ ...prev, [filtro.filtro_id]: e.target.value }))} style={selectStyle}>
                            <option value="" style={{ background:'#0a1628' }}>Seleccioná...</option>
                            {esBool
                              ? (<><option style={{ background:'#0a1628' }} value="Si">Sí</option><option style={{ background:'#0a1628' }} value="No">No</option></>)
                              : opts.map((o, i) => <option key={i} value={o.opcion} style={{ background:'#0a1628' }}>{o.opcion}</option>)
                            }
                          </select>
                        ) : (
                          <input value={valoresFiltros[filtro.filtro_id] || ''} onChange={e => setValoresFiltros(prev => ({ ...prev, [filtro.filtro_id]: e.target.value }))} placeholder={`Ingresá ${filtro.nombre.toLowerCase()}`} style={inputStyle} />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              <div style={{ display:'flex', gap:'8px' }}>
                {!subrubroIdParam && <button onClick={() => setPaso(1)} style={btnSecondary}>← Atrás</button>}
                <button onClick={() => titulo.trim() && setPaso(3)} disabled={!titulo.trim()} style={btnPrimary(!!titulo.trim())}>Continuar →</button>
              </div>
            </>
          )}

          {paso === 3 && (
            <>
              <div style={cardStyle}>
                <div style={sectionTitle}>📍 ¿Dónde está?</div>
                <div>
                  <label style={labelStyle}>Ciudad</label>
                  <input value={ciudad} onChange={e => setCiudad(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Provincia</label>
                  <input value={provincia} onChange={e => setProvincia(e.target.value)} style={inputStyle} />
                </div>
              </div>

              <div style={{ ...cardStyle, borderColor:'rgba(0,210,255,0.4)' }}>
                <div style={sectionTitle}>📋 Resumen</div>
                <FilaResumen label="Categoría" valor={`${rubroNombre}${subrubroNombre ? ` › ${subrubroNombre}` : ''}`} />
                <FilaResumen label="Título" valor={titulo} />
                {precio && <FilaResumen label="Precio" valor={`${moneda} ${Number(precio).toLocaleString('es-AR')}`} />}
                <FilaResumen label="Ubicación" valor={`${ciudad}, ${provincia}`} />
                {imagenes.length > 0 && <FilaResumen label="Fotos" valor={`${imagenes.length}`} />}
              </div>

              {error && (
                <div style={{ background:'rgba(255,60,60,0.15)', border:'1px solid rgba(255,60,60,0.4)', borderRadius:'10px', padding:'10px 14px', fontSize:'13px', color:'#ff8080', fontWeight:600 }}>
                  ⚠️ {error}
                </div>
              )}

              <div style={{ display:'flex', gap:'8px' }}>
                <button onClick={() => setPaso(2)} style={btnSecondary}>← Atrás</button>
                <button onClick={handlePublicar} disabled={publicando} style={btnPrimary(true)}>
                  {publicando ? '⏳ Publicando...' : '🚀 Publicar ahora'}
                </button>
              </div>
            </>
          )}

        </div>
      </div>

      <BottomNav />
    </div>
  )
}

export default function Publicar() {
  return (
    <Suspense fallback={
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#050d1a', color:'white', fontSize:'24px' }}>⏳</div>
    }>
      <PublicarContent />
    </Suspense>
  )
}
