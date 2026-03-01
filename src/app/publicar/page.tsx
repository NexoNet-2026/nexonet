'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type Rubro = { id: number; nombre: string; emoji: string }
type Subrubro = { id: number; nombre: string; emoji: string; rubro_id: number }

export default function Publicar() {
  const [rubros, setRubros] = useState<Rubro[]>([])
  const [subrubros, setSubrubros] = useState<Subrubro[]>([])
  const [rubroId, setRubroId] = useState('')
  const [subrubroId, setSubrubroId] = useState('')
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [precio, setPrecio] = useState('')
  const [moneda, setMoneda] = useState('ARS')
  const [ciudad, setCiudad] = useState('Roldán')
  const [provincia, setProvincia] = useState('Santa Fe')
  const [loading, setLoading] = useState(false)
  const [exito, setExito] = useState(false)
  const [error, setError] = useState('')
  const [paso, setPaso] = useState(1)

  useEffect(() => {
    supabase.from('rubros').select('*').order('orden').then(({ data }) => setRubros(data || []))
  }, [])

  useEffect(() => {
    if (rubroId) {
      supabase.from('subrubros').select('*').eq('rubro_id', rubroId).then(({ data }) => setSubrubros(data || []))
    }
  }, [rubroId])

  async function publicar() {
    setLoading(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Tenés que iniciar sesión para publicar')
      setLoading(false)
      return
    }
    const { error } = await supabase.from('anuncios').insert({
      usuario_id: user.id,
      subrubro_id: parseInt(subrubroId),
      titulo,
      descripcion,
      precio: parseFloat(precio),
      moneda,
      ciudad,
      provincia,
      estado: 'activo'
    })
    if (error) {
      setError('Error al publicar. Intentá de nuevo.')
    } else {
      setExito(true)
    }
    setLoading(false)
  }

  if (exito) return (
    <div style={{ fontFamily: "'Nunito', sans-serif", background: 'linear-gradient(180deg, #050d1a 0%, #0f2040 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ textAlign: 'center', color: 'white' }}>
        <div style={{ fontSize: '60px', marginBottom: '16px' }}>🎉</div>
        <div style={{ fontSize: '22px', fontWeight: 900, marginBottom: '8px' }}>¡Anuncio publicado!</div>
        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '28px' }}>Tu anuncio ya está visible en NexoNet</div>
        <a href="/" style={{ background: '#FFE600', color: '#111', padding: '14px 28px', borderRadius: '10px', fontWeight: 900, fontSize: '15px', textDecoration: 'none', display: 'inline-block' }}>← Volver al inicio</a>
      </div>
    </div>
  )

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", background: '#F0F2F5', minHeight: '100vh', maxWidth: '390px', margin: '0 auto' }}>

      {/* HEADER */}
      <div style={{ background: 'linear-gradient(180deg, #050d1a 0%, #0f2040 100%)', padding: '16px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a href="/" style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: 'white', fontSize: '16px' }}>←</a>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 900, color: 'white' }}>➕ Publicar anuncio</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Paso {paso} de 3</div>
          </div>
        </div>
        {/* PROGRESS BAR */}
        <div style={{ marginTop: '12px', background: 'rgba(255,255,255,0.15)', borderRadius: '4px', height: '4px' }}>
          <div style={{ width: `${(paso / 3) * 100}%`, background: '#FFE600', borderRadius: '4px', height: '4px', transition: 'width 0.3s' }} />
        </div>
      </div>

      <div style={{ padding: '16px', paddingBottom: '100px' }}>

        {/* PASO 1 — CATEGORÍA */}
        {paso === 1 && (
          <div>
            <div style={{ background: 'white', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: 800, marginBottom: '14px', color: '#222' }}>📂 ¿En qué categoría publicás?</div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#555', display: 'block', marginBottom: '6px' }}>Rubro</label>
              <select value={rubroId} onChange={e => { setRubroId(e.target.value); setSubrubroId('') }}
                style={{ width: '100%', padding: '12px', border: '1.5px solid #E4E6EA', borderRadius: '8px', fontFamily: 'inherit', fontSize: '14px', marginBottom: '14px', outline: 'none' }}>
                <option value="">Seleccioná un rubro</option>
                {rubros.map(r => <option key={r.id} value={r.id}>{r.emoji} {r.nombre}</option>)}
              </select>

              {rubroId && (
                <>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#555', display: 'block', marginBottom: '6px' }}>Subrubro</label>
                  <select value={subrubroId} onChange={e => setSubrubroId(e.target.value)}
                    style={{ width: '100%', padding: '12px', border: '1.5px solid #E4E6EA', borderRadius: '8px', fontFamily: 'inherit', fontSize: '14px', outline: 'none' }}>
                    <option value="">Seleccioná un subrubro</option>
                    {subrubros.map(s => <option key={s.id} value={s.id}>{s.emoji} {s.nombre}</option>)}
                  </select>
                  {subrubros.length === 0 && <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>Este rubro aún no tiene subrubros cargados</div>}
                </>
              )}
            </div>
            <button onClick={() => { if (!rubroId) { setError('Elegí un rubro'); return; } setError(''); setPaso(2) }}
              style={{ width: '100%', padding: '14px', background: '#FFE600', border: 'none', borderRadius: '10px', fontFamily: 'inherit', fontSize: '15px', fontWeight: 900, cursor: 'pointer' }}>
              Continuar →
            </button>
          </div>
        )}

        {/* PASO 2 — DATOS */}
        {paso === 2 && (
          <div>
            <div style={{ background: 'white', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: 800, marginBottom: '14px', color: '#222' }}>📝 Datos del anuncio</div>

              <label style={{ fontSize: '12px', fontWeight: 700, color: '#555', display: 'block', marginBottom: '6px' }}>Título *</label>
              <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ej: Vendo auto Ford Focus 2020"
                style={{ width: '100%', padding: '12px', border: '1.5px solid #E4E6EA', borderRadius: '8px', fontFamily: 'inherit', fontSize: '14px', marginBottom: '14px', outline: 'none', boxSizing: 'border-box' }} />

              <label style={{ fontSize: '12px', fontWeight: 700, color: '#555', display: 'block', marginBottom: '6px' }}>Descripción</label>
              <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Describí tu anuncio con todos los detalles..." rows={4}
                style={{ width: '100%', padding: '12px', border: '1.5px solid #E4E6EA', borderRadius: '8px', fontFamily: 'inherit', fontSize: '14px', marginBottom: '14px', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />

              <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                <div style={{ flex: 2 }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#555', display: 'block', marginBottom: '6px' }}>Precio</label>
                  <input type="number" value={precio} onChange={e => setPrecio(e.target.value)} placeholder="0"
                    style={{ width: '100%', padding: '12px', border: '1.5px solid #E4E6EA', borderRadius: '8px', fontFamily: 'inherit', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#555', display: 'block', marginBottom: '6px' }}>Moneda</label>
                  <select value={moneda} onChange={e => setMoneda(e.target.value)}
                    style={{ width: '100%', padding: '12px', border: '1.5px solid #E4E6EA', borderRadius: '8px', fontFamily: 'inherit', fontSize: '14px', outline: 'none' }}>
                    <option>ARS</option>
                    <option>USD</option>
                  </select>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setPaso(1)} style={{ flex: 1, padding: '14px', background: 'white', border: '1.5px solid #E4E6EA', borderRadius: '10px', fontFamily: 'inherit', fontSize: '14px', fontWeight: 800, cursor: 'pointer' }}>← Atrás</button>
              <button onClick={() => { if (!titulo) { setError('Escribí un título'); return; } setError(''); setPaso(3) }}
                style={{ flex: 2, padding: '14px', background: '#FFE600', border: 'none', borderRadius: '10px', fontFamily: 'inherit', fontSize: '15px', fontWeight: 900, cursor: 'pointer' }}>
                Continuar →
              </button>
            </div>
          </div>
        )}

        {/* PASO 3 — UBICACIÓN */}
        {paso === 3 && (
          <div>
            <div style={{ background: 'white', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: 800, marginBottom: '14px', color: '#222' }}>📍 ¿Dónde está?</div>

              <label style={{ fontSize: '12px', fontWeight: 700, color: '#555', display: 'block', marginBottom: '6px' }}>Ciudad</label>
              <input value={ciudad} onChange={e => setCiudad(e.target.value)}
                style={{ width: '100%', padding: '12px', border: '1.5px solid #E4E6EA', borderRadius: '8px', fontFamily: 'inherit', fontSize: '14px', marginBottom: '14px', outline: 'none', boxSizing: 'border-box' }} />

              <label style={{ fontSize: '12px', fontWeight: 700, color: '#555', display: 'block', marginBottom: '6px' }}>Provincia</label>
              <input value={provincia} onChange={e => setProvincia(e.target.value)}
                style={{ width: '100%', padding: '12px', border: '1.5px solid #E4E6EA', borderRadius: '8px', fontFamily: 'inherit', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            {/* RESUMEN */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '16px', marginBottom: '12px', border: '2px solid #FFE600' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: '10px' }}>📋 Resumen del anuncio</div>
              <div style={{ fontSize: '13px', color: '#555', lineHeight: 1.8 }}>
                <b>Título:</b> {titulo}<br />
                <b>Precio:</b> {precio ? `${moneda} ${precio}` : 'No especificado'}<br />
                <b>Ubicación:</b> {ciudad}, {provincia}
              </div>
            </div>

            {error && <div style={{ background: '#fff0f0', border: '1px solid #ffcdd2', borderRadius: '8px', padding: '10px', marginBottom: '12px', fontSize: '13px', color: '#d32f2f', fontWeight: 600 }}>⚠️ {error}</div>}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setPaso(2)} style={{ flex: 1, padding: '14px', background: 'white', border: '1.5px solid #E4E6EA', borderRadius: '10px', fontFamily: 'inherit', fontSize: '14px', fontWeight: 800, cursor: 'pointer' }}>← Atrás</button>
              <button onClick={publicar} disabled={loading}
                style={{ flex: 2, padding: '14px', background: loading ? '#ccc' : '#3483FA', border: 'none', borderRadius: '10px', fontFamily: 'inherit', fontSize: '15px', fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer', color: 'white' }}>
                {loading ? '⏳ Publicando...' : '🚀 Publicar ahora'}
              </button>
            </div>
          </div>
        )}

        {error && paso < 3 && <div style={{ background: '#fff0f0', border: '1px solid #ffcdd2', borderRadius: '8px', padding: '10px', marginTop: '12px', fontSize: '13px', color: '#d32f2f', fontWeight: 600 }}>⚠️ {error}</div>}
      </div>
    </div>
  )
}
