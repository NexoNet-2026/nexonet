'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Rubro = { id: number; nombre: string; orden: number }
type Subrubro = { id: number; rubro_id: number; nombre: string }
type Filtro = { id: number; filtro_id: number; subrubro_id: number; nombre: string; tipo: string; obligatorio: boolean; orden: number }
type Opcion = { id: number; filtro_id: number; subrubro_id: number; opcion: string }

const CAMPOS_FIJOS = ['precio', 'descripcion', 'descripción', 'precio de venta', 'titulo', 'título']

export default function Publicar() {
  const [paso, setPaso] = useState(1)
  const [rubros, setRubros] = useState<Rubro[]>([])
  const [subrubros, setSubrubros] = useState<Subrubro[]>([])
  const [filtros, setFiltros] = useState<Filtro[]>([])
  const [opciones, setOpciones] = useState<Opcion[]>([])

  const [rubroId, setRubroId] = useState<number | null>(null)
  const [subrubroId, setSubrubroId] = useState<number | null>(null)
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
    supabase.from('rubros').select('*').order('orden').then(({ data }) => {
      if (data) setRubros(data)
    })
  }, [])

  useEffect(() => {
    if (rubroId) {
      setSubrubroId(null)
      supabase.from('subrubros').select('*').eq('rubro_id', rubroId).then(({ data }) => {
        if (data) setSubrubros(data)
      })
    }
  }, [rubroId])

  useEffect(() => {
    if (subrubroId) {
      supabase.from('filtros').select('*').eq('subrubro_id', subrubroId).order('orden').then(({ data }) => {
        if (data) {
          const filtrados = data.filter((f: Filtro) => !CAMPOS_FIJOS.includes(f.nombre.toLowerCase().trim()))
          setFiltros(filtrados)
        }
      })
      supabase.from('opciones_filtro').select('*').eq('subrubro_id', subrubroId).then(({ data }) => {
        if (data) setOpciones(data)
      })
    }
  }, [subrubroId])

  const opcionesDeFiltro = (filtro_id: number) =>
    opciones.filter(o => o.filtro_id === filtro_id)

  const esBooleanField = (nombre: string) => {
    const n = nombre.toLowerCase()
    return n.includes('permuta') || n.includes('financiaci') || n.includes('negociable') || n.includes('entrega')
  }

  const handleImagenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const nuevas = [...imagenes, ...files].slice(0, 3)
    setImagenes(nuevas)
    const urls = nuevas.map(f => URL.createObjectURL(f))
    setPreviews(urls)
  }

  const eliminarImagen = (index: number) => {
    const nuevas = imagenes.filter((_, i) => i !== index)
    setImagenes(nuevas)
    setPreviews(nuevas.map(f => URL.createObjectURL(f)))
  }

  const handlePublicar = async () => {
    setPublicando(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Subir imágenes
      const urlsImagenes: string[] = []
      for (const img of imagenes) {
        const nombre = `${Date.now()}_${img.name.replace(/\s/g, '_')}`
        const { error: uploadError } = await supabase.storage
          .from('Imagenes')
          .upload(nombre, img)
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('Imagenes').getPublicUrl(nombre)
          urlsImagenes.push(urlData.publicUrl)
        }
      }

      const { error } = await supabase.from('anuncios').insert({
        titulo,
        descripcion,
        precio: precio ? parseFloat(precio) : null,
        moneda,
        ciudad,
        provincia,
        subrubro_id: subrubroId,
        usuario_id: user?.id || null,
        imagenes: urlsImagenes,
        estado: 'activo',
      })
      if (error) setError('Error al publicar. Intentá de nuevo.')
      else setExito(true)
    } catch {
      setError('Error inesperado. Intentá de nuevo.')
    }
    setPublicando(false)
  }

  if (exito) return (
    <div style={{ fontFamily: "'Nunito', sans-serif", background: "#0a1628", minHeight: "100vh", maxWidth: "390px", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <div style={{ fontSize: "80px", marginBottom: "20px" }}>🎉</div>
      <div style={{ fontSize: "24px", fontWeight: 900, color: "white", marginBottom: "8px" }}>¡Anuncio publicado!</div>
      <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", marginBottom: "32px" }}>Tu anuncio ya está visible en NexoNet</div>
      <a href="/" style={{ background: "#FFE600", color: "#1a1a2e", padding: "14px 28px", borderRadius: "12px", fontWeight: 800, textDecoration: "none", fontSize: "15px" }}>← Volver al inicio</a>
    </div>
  )

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", background: "#F0F2F5", maxWidth: "390px", margin: "0 auto", minHeight: "100vh", paddingBottom: "40px" }}>

      {/* HEADER FIJO */}
      <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "390px", zIndex: 100, background: "linear-gradient(180deg, #050d1a 0%, #0a1628 100%)", padding: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <a href="/" style={{ color: "white", textDecoration: "none", fontSize: "22px" }}>←</a>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 900, color: "white" }}>➕ Publicar anuncio</div>
            <div style={{ fontSize: "11px", color: "#FFE600" }}>Paso {paso} de 3</div>
          </div>
        </div>
        <div style={{ marginTop: "12px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", height: "4px" }}>
          <div style={{ background: "#FFE600", height: "4px", borderRadius: "4px", width: `${(paso / 3) * 100}%`, transition: "width 0.3s" }} />
        </div>
      </div>

      <div style={{ height: "90px" }} />
      <div style={{ padding: "16px" }}>

        {/* PASO 1 */}
        {paso === 1 && (
          <div>
            <div style={{ fontSize: "16px", fontWeight: 800, marginBottom: "16px", color: "#1a1a2e" }}>¿En qué categoría publicás?</div>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "13px", fontWeight: 700, color: "#555", display: "block", marginBottom: "6px" }}>Rubro</label>
              <select value={rubroId || ''} onChange={e => setRubroId(Number(e.target.value))}
                style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1.5px solid #E4E6EA", fontSize: "14px", fontFamily: "inherit", background: "white" }}>
                <option value="">Seleccioná un rubro</option>
                {rubros.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
              </select>
            </div>
            {subrubros.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "13px", fontWeight: 700, color: "#555", display: "block", marginBottom: "6px" }}>Subrubro</label>
                <select value={subrubroId || ''} onChange={e => setSubrubroId(Number(e.target.value))}
                  style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1.5px solid #E4E6EA", fontSize: "14px", fontFamily: "inherit", background: "white" }}>
                  <option value="">Seleccioná un subrubro</option>
                  {subrubros.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>
            )}
            <button onClick={() => subrubroId && setPaso(2)} disabled={!subrubroId}
              style={{ width: "100%", padding: "14px", background: subrubroId ? "#FFE600" : "#E4E6EA", color: subrubroId ? "#1a1a2e" : "#999", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: 800, cursor: subrubroId ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
              Continuar →
            </button>
          </div>
        )}

        {/* PASO 2 */}
        {paso === 2 && (
          <div>
            <div style={{ fontSize: "16px", fontWeight: 800, marginBottom: "16px", color: "#1a1a2e" }}>Datos del anuncio</div>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "13px", fontWeight: 700, color: "#555", display: "block", marginBottom: "6px" }}>Título *</label>
              <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ej: Peugeot 408 Allure 2012"
                style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1.5px solid #E4E6EA", fontSize: "14px", fontFamily: "inherit", boxSizing: "border-box" }} />
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "13px", fontWeight: 700, color: "#555", display: "block", marginBottom: "6px" }}>Descripción</label>
              <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Describí tu anuncio..." rows={3}
                style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1.5px solid #E4E6EA", fontSize: "14px", fontFamily: "inherit", resize: "none", boxSizing: "border-box" }} />
            </div>

            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "13px", fontWeight: 700, color: "#555", display: "block", marginBottom: "6px" }}>Precio</label>
                <input value={precio} onChange={e => setPrecio(e.target.value)} placeholder="0" type="number"
                  style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1.5px solid #E4E6EA", fontSize: "14px", fontFamily: "inherit", boxSizing: "border-box" }} />
              </div>
              <div style={{ width: "90px" }}>
                <label style={{ fontSize: "13px", fontWeight: 700, color: "#555", display: "block", marginBottom: "6px" }}>Moneda</label>
                <select value={moneda} onChange={e => setMoneda(e.target.value)}
                  style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1.5px solid #E4E6EA", fontSize: "14px", fontFamily: "inherit", background: "white" }}>
                  <option>ARS</option>
                  <option>USD</option>
                </select>
              </div>
            </div>

            {/* FOTOS */}
            <div style={{ marginBottom: "16px", paddingTop: "8px", borderTop: "1px solid #E4E6EA" }}>
              <div style={{ fontSize: "14px", fontWeight: 800, color: "#1a1a2e", marginBottom: "10px" }}>📷 Fotos (hasta 3)</div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {previews.map((url, i) => (
                  <div key={i} style={{ position: "relative", width: "90px", height: "90px" }}>
                    <img src={url} style={{ width: "90px", height: "90px", objectFit: "cover", borderRadius: "10px", border: "1.5px solid #E4E6EA" }} />
                    <button onClick={() => eliminarImagen(i)}
                      style={{ position: "absolute", top: "-6px", right: "-6px", background: "#E53935", color: "white", border: "none", borderRadius: "50%", width: "22px", height: "22px", fontSize: "12px", cursor: "pointer", fontWeight: 900 }}>✕</button>
                  </div>
                ))}
                {imagenes.length < 3 && (
                  <label style={{ width: "90px", height: "90px", border: "2px dashed #E4E6EA", borderRadius: "10px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", gap: "4px" }}>
                    <span style={{ fontSize: "28px" }}>📷</span>
                    <span style={{ fontSize: "10px", color: "#999", fontWeight: 700 }}>Agregar</span>
                    <input type="file" accept="image/*" onChange={handleImagenChange} style={{ display: "none" }} multiple />
                  </label>
                )}
              </div>
            </div>

            {/* FILTROS DINÁMICOS */}
            {filtros.length > 0 && (
              <div>
                <div style={{ fontSize: "14px", fontWeight: 800, color: "#1a1a2e", marginBottom: "12px", paddingTop: "8px", borderTop: "1px solid #E4E6EA" }}>
                  📋 Características
                </div>
                {filtros.map(filtro => {
                  const opts = opcionesDeFiltro(filtro.filtro_id)
                  const esBool = esBooleanField(filtro.nombre)
                  return (
                    <div key={filtro.id} style={{ marginBottom: "12px" }}>
                      <label style={{ fontSize: "13px", fontWeight: 700, color: "#555", display: "block", marginBottom: "6px" }}>
                        {filtro.nombre}{filtro.obligatorio ? ' *' : ''}
                      </label>
                      {esBool ? (
                        <select value={valoresFiltros[filtro.filtro_id] || ''} onChange={e => setValoresFiltros(prev => ({ ...prev, [filtro.filtro_id]: e.target.value }))}
                          style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1.5px solid #E4E6EA", fontSize: "14px", fontFamily: "inherit", background: "white" }}>
                          <option value="">Seleccioná...</option>
                          <option value="Si">Sí</option>
                          <option value="No">No</option>
                        </select>
                      ) : opts.length > 0 ? (
                        <select value={valoresFiltros[filtro.filtro_id] || ''} onChange={e => setValoresFiltros(prev => ({ ...prev, [filtro.filtro_id]: e.target.value }))}
                          style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1.5px solid #E4E6EA", fontSize: "14px", fontFamily: "inherit", background: "white" }}>
                          <option value="">Seleccioná...</option>
                          {opts.map((o, i) => <option key={i} value={o.opcion}>{o.opcion}</option>)}
                        </select>
                      ) : (
                        <input value={valoresFiltros[filtro.filtro_id] || ''} onChange={e => setValoresFiltros(prev => ({ ...prev, [filtro.filtro_id]: e.target.value }))}
                          placeholder={`Ingresá ${filtro.nombre.toLowerCase()}`}
                          style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1.5px solid #E4E6EA", fontSize: "14px", fontFamily: "inherit", boxSizing: "border-box" }} />
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
              <button onClick={() => setPaso(1)}
                style={{ flex: 1, padding: "14px", background: "white", color: "#1a1a2e", border: "1.5px solid #E4E6EA", borderRadius: "12px", fontSize: "14px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                ← Atrás
              </button>
              <button onClick={() => titulo.trim() && setPaso(3)} disabled={!titulo.trim()}
                style={{ flex: 2, padding: "14px", background: titulo.trim() ? "#FFE600" : "#E4E6EA", color: titulo.trim() ? "#1a1a2e" : "#999", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: 800, cursor: titulo.trim() ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
                Continuar →
              </button>
            </div>
          </div>
        )}

        {/* PASO 3 */}
        {paso === 3 && (
          <div>
            <div style={{ fontSize: "16px", fontWeight: 800, marginBottom: "16px", color: "#1a1a2e" }}>📍 ¿Dónde está?</div>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "13px", fontWeight: 700, color: "#555", display: "block", marginBottom: "6px" }}>Ciudad</label>
              <input value={ciudad} onChange={e => setCiudad(e.target.value)}
                style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1.5px solid #E4E6EA", fontSize: "14px", fontFamily: "inherit", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "13px", fontWeight: 700, color: "#555", display: "block", marginBottom: "6px" }}>Provincia</label>
              <input value={provincia} onChange={e => setProvincia(e.target.value)}
                style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1.5px solid #E4E6EA", fontSize: "14px", fontFamily: "inherit", boxSizing: "border-box" }} />
            </div>

            <div style={{ background: "white", borderRadius: "12px", padding: "14px", marginBottom: "16px", border: "1.5px solid #FFE600" }}>
              <div style={{ fontSize: "13px", fontWeight: 800, marginBottom: "8px" }}>📋 Resumen</div>
              <div style={{ fontSize: "12px", color: "#555" }}><b>Título:</b> {titulo}</div>
              {precio && <div style={{ fontSize: "12px", color: "#555" }}><b>Precio:</b> {moneda} {Number(precio).toLocaleString('es-AR')}</div>}
              <div style={{ fontSize: "12px", color: "#555" }}><b>Ubicación:</b> {ciudad}, {provincia}</div>
              {imagenes.length > 0 && <div style={{ fontSize: "12px", color: "#555" }}><b>Fotos:</b> {imagenes.length}</div>}
            </div>

            {error && <div style={{ background: "#FFF0F0", color: "#E53935", padding: "12px", borderRadius: "10px", fontSize: "13px", marginBottom: "12px" }}>⚠️ {error}</div>}

            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => setPaso(2)}
                style={{ flex: 1, padding: "14px", background: "white", color: "#1a1a2e", border: "1.5px solid #E4E6EA", borderRadius: "12px", fontSize: "14px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                ← Atrás
              </button>
              <button onClick={handlePublicar} disabled={publicando}
                style={{ flex: 2, padding: "14px", background: "#FFE600", color: "#1a1a2e", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                {publicando ? '⏳ Publicando...' : '🚀 Publicar ahora'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
