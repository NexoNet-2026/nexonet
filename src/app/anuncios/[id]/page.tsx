'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Anuncio = {
  id: number
  titulo: string
  descripcion: string
  precio: number
  moneda: string
  ciudad: string
  provincia: string
  imagenes: string[]
  created_at: string
  subrubro_id: number
}

type Subrubro = { id: number; nombre: string; rubro_id: number }
type Rubro = { id: number; nombre: string }

export default function DetalleAnuncio() {
  const params = useParams()
  const id = params.id

  const [anuncio, setAnuncio] = useState<Anuncio | null>(null)
  const [subrubro, setSubrubro] = useState<Subrubro | null>(null)
  const [rubro, setRubro] = useState<Rubro | null>(null)
  const [fotoActiva, setFotoActiva] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const fetchData = async () => {
      const { data } = await supabase.from('anuncios').select('*').eq('id', id).single()
      if (data) {
        setAnuncio(data)
        if (data.subrubro_id) {
          const { data: sub } = await supabase.from('subrubros').select('*').eq('id', data.subrubro_id).single()
          if (sub) {
            setSubrubro(sub)
            const { data: rub } = await supabase.from('rubros').select('*').eq('id', sub.rubro_id).single()
            if (rub) setRubro(rub)
          }
        }
      }
      setLoading(false)
    }
    fetchData()
  }, [id])

  const formatPrecio = (precio: number, moneda: string) => {
    if (!precio) return 'Consultar precio'
    return `${moneda} ${precio.toLocaleString('es-AR')}`
  }

  const timeAgo = (date: string) => {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 60000)
    if (diff < 60) return `hace ${diff} min`
    if (diff < 1440) return `hace ${Math.floor(diff / 60)}h`
    return `hace ${Math.floor(diff / 1440)} días`
  }

  if (loading) return (
    <div style={{ fontFamily: "'Nunito', sans-serif", background: "#F0F2F5", maxWidth: "390px", margin: "0 auto", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", color: "#999" }}>
        <div style={{ fontSize: "40px", marginBottom: "12px" }}>⏳</div>
        <div>Cargando anuncio...</div>
      </div>
    </div>
  )

  if (!anuncio) return (
    <div style={{ fontFamily: "'Nunito', sans-serif", background: "#F0F2F5", maxWidth: "390px", margin: "0 auto", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", color: "#999" }}>
        <div style={{ fontSize: "40px", marginBottom: "12px" }}>😕</div>
        <div>Anuncio no encontrado</div>
        <a href="/" style={{ display: "inline-block", marginTop: "16px", color: "#3483FA", fontWeight: 700, textDecoration: "none" }}>← Volver al inicio</a>
      </div>
    </div>
  )

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", background: "#F0F2F5", maxWidth: "390px", margin: "0 auto", minHeight: "100vh", paddingBottom: "100px" }}>

      {/* HEADER */}
      <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "390px", zIndex: 100, background: "linear-gradient(180deg, #050d1a 0%, #0a1628 100%)", padding: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <a onClick={() => window.history.back()} style={{ color: "white", textDecoration: "none", fontSize: "22px", cursor: "pointer" }}>←</a>
          <div>
            {rubro && <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "1px" }}>{rubro.nombre}{subrubro ? ` › ${subrubro.nombre}` : ''}</div>}
            <div style={{ fontSize: "15px", fontWeight: 900, color: "white" }}>Detalle del anuncio</div>
          </div>
        </div>
      </div>

      <div style={{ height: "70px" }} />

      {/* FOTOS */}
      {anuncio.imagenes && anuncio.imagenes.length > 0 ? (
        <div>
          <img src={anuncio.imagenes[fotoActiva]} style={{ width: "100%", height: "250px", objectFit: "cover" }} />
          {anuncio.imagenes.length > 1 && (
            <div style={{ display: "flex", gap: "6px", padding: "8px 16px", background: "white" }}>
              {anuncio.imagenes.map((url, i) => (
                <img key={i} src={url} onClick={() => setFotoActiva(i)}
                  style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "8px", cursor: "pointer", border: i === fotoActiva ? "2px solid #FFE600" : "2px solid transparent", opacity: i === fotoActiva ? 1 : 0.6 }} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ width: "100%", height: "200px", background: "#E4E6EA", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "60px" }}>📦</div>
      )}

      {/* INFO PRINCIPAL */}
      <div style={{ background: "white", padding: "16px", marginBottom: "8px" }}>
        <div style={{ fontSize: "22px", fontWeight: 900, color: "#1a1a2e", marginBottom: "8px" }}>{anuncio.titulo}</div>
        <div style={{ fontSize: "28px", fontWeight: 900, color: "#00A650", marginBottom: "12px" }}>
          {formatPrecio(anuncio.precio, anuncio.moneda)}
        </div>
        <div style={{ display: "flex", gap: "12px", fontSize: "12px", color: "#999" }}>
          <span>📍 {anuncio.ciudad}, {anuncio.provincia}</span>
          <span>🕐 {timeAgo(anuncio.created_at)}</span>
        </div>
      </div>

      {/* DESCRIPCIÓN */}
      {anuncio.descripcion && (
        <div style={{ background: "white", padding: "16px", marginBottom: "8px" }}>
          <div style={{ fontSize: "14px", fontWeight: 800, color: "#1a1a2e", marginBottom: "10px" }}>📝 Descripción</div>
          <div style={{ fontSize: "14px", color: "#555", lineHeight: 1.6 }}>{anuncio.descripcion}</div>
        </div>
      )}

      {/* BOTONES CONTACTO */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "390px", background: "white", borderTop: "1px solid #E4E6EA", padding: "12px 16px 24px", boxShadow: "0 -4px 12px rgba(0,0,0,0.08)" }}>
        <div style={{ display: "flex", gap: "10px" }}>
          <a href={`https://wa.me/?text=Hola, vi tu anuncio "${anuncio.titulo}" en NexoNet`} target="_blank"
            style={{ flex: 1, padding: "14px", background: "#25D366", color: "white", borderRadius: "12px", fontSize: "14px", fontWeight: 800, textDecoration: "none", textAlign: "center" }}>
            💬 WhatsApp
          </a>
          <a href="/chat"
            style={{ flex: 1, padding: "14px", background: "#FFE600", color: "#1a1a2e", borderRadius: "12px", fontSize: "14px", fontWeight: 800, textDecoration: "none", textAlign: "center" }}>
            ✉️ Chat NexoNet
          </a>
        </div>
      </div>

    </div>
  )
}
