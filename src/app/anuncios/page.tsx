'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'

type Anuncio = {
  id: number
  titulo: string
  precio: number | null
  moneda: string
  ciudad: string
  provincia: string
  imagenes: string[]
  estado: string
  created_at: string
  subrubro_id: number
  subrubros?: { nombre: string; rubros?: { nombre: string } }
}

type Rubro = { id: number; nombre: string }
type Subrubro = { id: number; nombre: string; rubro_id: number }

const PROVINCIAS = ['Buenos Aires','Santa Fe','Córdoba','Mendoza','Tucumán','Entre Ríos','Misiones','Salta','Neuquén','Chaco','Corrientes','Santiago del Estero','San Juan','Jujuy','Río Negro','Formosa','Chubut','San Luis','Catamarca','La Rioja','La Pampa','Santa Cruz','Tierra del Fuego']

function formatPrecio(precio: number | null, moneda: string) {
  if (!precio) return null
  const formatted = precio >= 1000
    ? precio >= 1000000
      ? `${(precio/1000000).toFixed(1)}M`
      : `${(precio/1000).toFixed(0)}k`
    : precio.toString()
  return `${moneda === 'USD' ? 'U$D' : '$'} ${formatted}`
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

function AnuncioCard({ anuncio, onClick }: { anuncio: Anuncio; onClick: () => void }) {
  const img = anuncio.imagenes?.[0]
  const precio = formatPrecio(anuncio.precio, anuncio.moneda)

  return (
    <div
      onClick={onClick}
      style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(0,210,255,0.1)',
        borderRadius: '16px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative',
      }}
    >
      {/* Imagen */}
      <div style={{ width: '100%', aspectRatio: '1/1', background: 'rgba(0,0,0,0.3)', position: 'relative', overflow: 'hidden' }}>
        {img ? (
          <img
            src={img}
            alt={anuncio.titulo}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', opacity: 0.3 }}>📦</div>
        )}
        {/* Badge tiempo */}
        <div style={{
          position: 'absolute', top: '8px', right: '8px',
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
          borderRadius: '6px', padding: '2px 7px',
          fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.7)',
        }}>
          {timeAgo(anuncio.created_at)}
        </div>
        {/* Badge subrubro */}
        {anuncio.subrubros?.nombre && (
          <div style={{
            position: 'absolute', bottom: '8px', left: '8px',
            background: 'rgba(0,210,255,0.2)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(0,210,255,0.3)',
            borderRadius: '6px', padding: '2px 8px',
            fontSize: '9px', fontWeight: 800, color: '#00D2FF',
            textTransform: 'uppercase', letterSpacing: '0.3px',
          }}>
            {anuncio.subrubros.nombre}
          </div>
        )}
      </div>

      {/* Datos */}
      <div style={{ padding: '10px 10px 12px' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.85)', lineHeight: 1.3, marginBottom: '6px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {anuncio.titulo}
        </div>
        {precio && (
          <div style={{ fontSize: '14px', fontWeight: 900, color: '#00D2FF', marginBottom: '4px' }}>
            {precio}
          </div>
        )}
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
          <span>📍</span> {anuncio.ciudad}
        </div>
      </div>
    </div>
  )
}

function AnunciosContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [anuncios, setAnuncios] = useState<Anuncio[]>([])
  const [loading, setLoading] = useState(true)
  const [rubros, setRubros] = useState<Rubro[]>([])
  const [subrubros, setSubrubros] = useState<Subrubro[]>([])
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false)

  // Filtros
  const [provincia, setProvincia] = useState(searchParams.get('provincia') || '')
  const [ciudad, setCiudad] = useState(searchParams.get('ciudad') || '')
  const [rubroId, setRubroId] = useState(searchParams.get('rubro_id') || '')
  const [subrubroId, setSubrubroId] = useState(searchParams.get('subrubro_id') || '')
  const [q, setQ] = useState(searchParams.get('q') || '')
  const [gpsStatus, setGpsStatus] = useState<'idle'|'loading'|'ok'|'error'>('idle')
  const [gpsLabel, setGpsLabel] = useState('')

  const totalFiltros = [provincia, ciudad, rubroId, subrubroId, q].filter(Boolean).length

  useEffect(() => {
    supabase.from('rubros').select('id, nombre').order('orden').then(({ data }) => { if (data) setRubros(data) })
  }, [])

  useEffect(() => {
    if (rubroId) {
      supabase.from('subrubros').select('id, nombre, rubro_id').eq('rubro_id', rubroId).then(({ data }) => { if (data) setSubrubros(data) })
    } else {
      setSubrubros([])
      setSubrubroId('')
    }
  }, [rubroId])

  const fetchAnuncios = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('anuncios')
      .select('*, subrubros(nombre, rubros(nombre))')
      .eq('estado', 'activo')
      .order('created_at', { ascending: false })
      .limit(60)

    if (subrubroId) query = query.eq('subrubro_id', subrubroId)
    else if (rubroId) {
      const { data: subs } = await supabase.from('subrubros').select('id').eq('rubro_id', rubroId)
      if (subs?.length) query = query.in('subrubro_id', subs.map(s => s.id))
    }
    if (provincia) query = query.ilike('provincia', `%${provincia}%`)
    if (ciudad) query = query.ilike('ciudad', `%${ciudad}%`)
    if (q) query = query.ilike('titulo', `%${q}%`)

    const { data } = await query
    setAnuncios(data || [])
    setLoading(false)
  }, [provincia, ciudad, rubroId, subrubroId, q])

  useEffect(() => { fetchAnuncios() }, [fetchAnuncios])

  // GPS
  const handleGPS = () => {
    setGpsStatus('loading')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&accept-language=es`)
          const data = await res.json()
          const nuevaCiudad = data.address?.city || data.address?.town || data.address?.village || ''
          const nuevaProvincia = data.address?.state || ''
          setCiudad(nuevaCiudad)
          setProvincia(nuevaProvincia)
          setGpsLabel(nuevaCiudad || nuevaProvincia)
          setGpsStatus('ok')
        } catch {
          setGpsStatus('error')
        }
      },
      () => setGpsStatus('error'),
      { timeout: 8000 }
    )
  }

  const rubroActivo = rubros.find(r => r.id === Number(rubroId))
  const subrubroActivo = subrubros.find(s => s.id === Number(subrubroId))

  const tituloSeccion = subrubroActivo?.nombre || rubroActivo?.nombre || (q ? `"${q}"` : 'Todos los anuncios')

  return (
    <div style={{ fontFamily:"'Nunito',sans-serif", maxWidth:'430px', margin:'0 auto', minHeight:'100vh', position:'relative', background:'#030810' }}>

      {/* FONDO */}
      <div style={{ position:'fixed', top:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:'430px', height:'100vh', backgroundImage:"url('/fondo_pantallas.png')", backgroundSize:'100% 100%', zIndex:0, opacity:0.3 }} />
      <div style={{ position:'fixed', top:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:'430px', height:'100vh', background:'linear-gradient(180deg, rgba(3,8,16,0.98) 0%, rgba(3,8,16,0.8) 100%)', zIndex:1 }} />

      <div style={{ position:'relative', zIndex:2, paddingBottom:'90px' }}>

        {/* ══ HEADER ══ */}
        <div style={{
          position:'sticky', top:0, zIndex:50,
          background:'rgba(3,8,16,0.92)', backdropFilter:'blur(20px)',
          WebkitBackdropFilter:'blur(20px)',
          borderBottom:'1px solid rgba(0,210,255,0.1)',
          padding:'48px 16px 12px',
        }}>
          {/* Fila título */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
            <button onClick={() => router.back()} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.35)', cursor:'pointer', fontSize:'20px', padding:0, fontFamily:'inherit', display:'flex', alignItems:'center', gap:'4px' }}>
              ←
            </button>
            <div style={{ flex:1, textAlign:'center' }}>
              <div style={{ fontSize:'11px', color:'rgba(0,210,255,0.6)', fontWeight:800, letterSpacing:'2px', textTransform:'uppercase' }}>NexoNet</div>
              <div style={{ fontSize:'15px', fontWeight:900, color:'white', lineHeight:1 }}>{tituloSeccion}</div>
            </div>
            <button
              onClick={() => router.push('/publicar' + (subrubroId ? `?subrubro_id=${subrubroId}` : rubroId ? `?rubro_id=${rubroId}` : ''))}
              style={{ background:'rgba(0,210,255,0.12)', border:'1px solid rgba(0,210,255,0.3)', borderRadius:'10px', color:'#00D2FF', fontSize:'11px', fontWeight:800, padding:'6px 10px', cursor:'pointer', fontFamily:'inherit' }}>
              + Publicar
            </button>
          </div>

          {/* Barra de búsqueda */}
          <div style={{ display:'flex', gap:'8px', marginBottom:'10px' }}>
            <div style={{ flex:1, display:'flex', alignItems:'center', gap:'8px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(0,210,255,0.15)', borderRadius:'12px', padding:'0 12px' }}>
              <span style={{ fontSize:'14px', opacity:0.4 }}>🔍</span>
              <input
                type="text"
                placeholder="Buscar..."
                value={q}
                onChange={e => setQ(e.target.value)}
                style={{ flex:1, background:'transparent', border:'none', outline:'none', color:'white', fontSize:'13px', fontFamily:'inherit', fontWeight:600, padding:'9px 0' }}
              />
              {q && <button onClick={() => setQ('')} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.3)', cursor:'pointer', fontSize:'16px', padding:0 }}>×</button>}
            </div>

            {/* Botón filtros */}
            <button
              onClick={() => setFiltrosAbiertos(!filtrosAbiertos)}
              style={{
                background: totalFiltros > 0 ? 'rgba(0,210,255,0.15)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${totalFiltros > 0 ? 'rgba(0,210,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius:'12px', color: totalFiltros > 0 ? '#00D2FF' : 'rgba(255,255,255,0.5)',
                fontSize:'11px', fontWeight:800, padding:'0 12px', cursor:'pointer', fontFamily:'inherit',
                display:'flex', alignItems:'center', gap:'5px', whiteSpace:'nowrap',
              }}>
              ⚙ {totalFiltros > 0 ? `${totalFiltros} filtro${totalFiltros>1?'s':''}` : 'Filtrar'}
            </button>
          </div>

          {/* Panel filtros desplegable */}
          {filtrosAbiertos && (
            <div style={{ display:'flex', flexDirection:'column', gap:'8px', paddingTop:'8px', borderTop:'1px solid rgba(0,210,255,0.08)' }}>

              {/* GPS */}
              <button
                onClick={handleGPS}
                style={{
                  display:'flex', alignItems:'center', gap:'8px', padding:'10px 12px',
                  background: gpsStatus === 'ok' ? 'rgba(0,255,100,0.1)' : 'rgba(0,210,255,0.08)',
                  border: `1px solid ${gpsStatus === 'ok' ? 'rgba(0,255,100,0.3)' : 'rgba(0,210,255,0.2)'}`,
                  borderRadius:'10px', cursor:'pointer', fontFamily:'inherit', width:'100%',
                  color: gpsStatus === 'ok' ? '#00ff80' : '#00D2FF',
                }}
              >
                <span style={{ fontSize:'14px' }}>{gpsStatus === 'loading' ? '⏳' : gpsStatus === 'ok' ? '✅' : gpsStatus === 'error' ? '❌' : '📍'}</span>
                <div style={{ textAlign:'left' }}>
                  <div style={{ fontSize:'11px', fontWeight:800, letterSpacing:'0.5px' }}>
                    {gpsStatus === 'loading' ? 'Detectando...' : gpsStatus === 'ok' ? `GPS: ${gpsLabel}` : gpsStatus === 'error' ? 'Error GPS — usá manual' : 'Usar mi ubicación (GPS)'}
                  </div>
                  {(gpsStatus === 'idle' || gpsStatus === 'error') && (
                    <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.3)', fontWeight:600 }}>Detecta tu ciudad automáticamente</div>
                  )}
                </div>
              </button>

              {/* Provincia */}
              <select value={provincia} onChange={e => { setProvincia(e.target.value); setCiudad('') }}
                style={{ padding:'10px 12px', background:'rgba(0,0,0,0.4)', border:'1px solid rgba(0,210,255,0.2)', borderRadius:'10px', color: provincia ? 'white' : 'rgba(255,255,255,0.35)', fontSize:'13px', fontWeight:700, fontFamily:'inherit', outline:'none', cursor:'pointer' }}>
                <option value="">📍 Todas las provincias</option>
                {PROVINCIAS.map(p => <option key={p} value={p} style={{ background:'#0a1628' }}>{p}</option>)}
              </select>

              {/* Ciudad manual */}
              <input value={ciudad} onChange={e => setCiudad(e.target.value)} placeholder="Ciudad (opcional)"
                style={{ padding:'10px 12px', background:'rgba(0,0,0,0.4)', border:'1px solid rgba(0,210,255,0.2)', borderRadius:'10px', color:'white', fontSize:'13px', fontWeight:700, fontFamily:'inherit', outline:'none' }} />

              {/* Rubro */}
              <select value={rubroId} onChange={e => { setRubroId(e.target.value); setSubrubroId('') }}
                style={{ padding:'10px 12px', background:'rgba(0,0,0,0.4)', border:'1px solid rgba(0,210,255,0.2)', borderRadius:'10px', color: rubroId ? 'white' : 'rgba(255,255,255,0.35)', fontSize:'13px', fontWeight:700, fontFamily:'inherit', outline:'none', cursor:'pointer' }}>
                <option value="">🗂 Todos los rubros</option>
                {rubros.map(r => <option key={r.id} value={r.id} style={{ background:'#0a1628' }}>{r.nombre}</option>)}
              </select>

              {subrubros.length > 0 && (
                <select value={subrubroId} onChange={e => setSubrubroId(e.target.value)}
                  style={{ padding:'10px 12px', background:'rgba(0,0,0,0.4)', border:'1px solid rgba(0,210,255,0.2)', borderRadius:'10px', color: subrubroId ? 'white' : 'rgba(255,255,255,0.35)', fontSize:'13px', fontWeight:700, fontFamily:'inherit', outline:'none', cursor:'pointer' }}>
                  <option value="">Todos los subrubros</option>
                  {subrubros.map(s => <option key={s.id} value={s.id} style={{ background:'#0a1628' }}>{s.nombre}</option>)}
                </select>
              )}

              {/* Botones acción */}
              <div style={{ display:'flex', gap:'8px' }}>
                <button onClick={() => { setProvincia(''); setCiudad(''); setRubroId(''); setSubrubroId(''); setQ(''); setGpsStatus('idle'); setGpsLabel('') }}
                  style={{ flex:1, padding:'10px', background:'rgba(255,80,80,0.1)', border:'1px solid rgba(255,80,80,0.2)', borderRadius:'10px', color:'rgba(255,120,120,0.8)', fontSize:'12px', fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>
                  Limpiar filtros
                </button>
                <button onClick={() => setFiltrosAbiertos(false)}
                  style={{ flex:2, padding:'10px', background:'rgba(0,210,255,0.15)', border:'1px solid rgba(0,210,255,0.4)', borderRadius:'10px', color:'white', fontSize:'12px', fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>
                  Ver resultados →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ══ CONTEO ══ */}
        <div style={{ padding:'12px 16px 8px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.35)', fontWeight:700 }}>
            {loading ? 'Buscando...' : `${anuncios.length} anuncio${anuncios.length !== 1 ? 's' : ''}`}
          </div>
          {(provincia || ciudad) && (
            <div style={{ fontSize:'11px', color:'rgba(0,210,255,0.6)', fontWeight:700, display:'flex', alignItems:'center', gap:'4px' }}>
              📍 {ciudad || provincia}
            </div>
          )}
        </div>

        {/* ══ GRID ANUNCIOS ══ */}
        <div style={{ padding:'0 12px' }}>
          {loading ? (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
              {Array(6).fill(0).map((_, i) => (
                <div key={i} style={{ background:'rgba(255,255,255,0.04)', borderRadius:'16px', aspectRatio:'0.8', border:'1px solid rgba(0,210,255,0.06)' }} />
              ))}
            </div>
          ) : anuncios.length === 0 ? (
            <div style={{ textAlign:'center', padding:'60px 20px' }}>
              <div style={{ fontSize:'48px', marginBottom:'16px' }}>🔍</div>
              <div style={{ fontSize:'16px', fontWeight:800, color:'white', marginBottom:'8px' }}>Sin resultados</div>
              <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.35)', fontWeight:600, marginBottom:'20px' }}>
                No hay anuncios con esos filtros.<br />Intentá con menos filtros o cambiá la zona.
              </div>
              <button onClick={() => { setProvincia(''); setCiudad(''); setRubroId(''); setSubrubroId(''); setQ('') }}
                style={{ background:'rgba(0,210,255,0.15)', border:'1px solid rgba(0,210,255,0.4)', borderRadius:'12px', color:'#00D2FF', padding:'12px 20px', fontSize:'13px', fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>
                Ver todos los anuncios
              </button>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
              {anuncios.map(a => (
                <AnuncioCard
                  key={a.id}
                  anuncio={a}
                  onClick={() => router.push(`/anuncio/${a.id}`)}
                />
              ))}
            </div>
          )}
        </div>

      </div>

      <BottomNav />
    </div>
  )
}

export default function AnunciosPage() {
  return (
    <Suspense fallback={
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#030810', color:'white', fontSize:'24px' }}>⏳</div>
    }>
      <AnunciosContent />
    </Suspense>
  )
}
