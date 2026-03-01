'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Anuncio = {
  id: number
  titulo: string
  descripcion: string
  precio: number
  moneda: string
  ciudad: string
  provincia: string
  created_at: string
}

export default function Anuncios() {
  const [anuncios, setAnuncios] = useState<Anuncio[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnuncios = async () => {
      const { data, error } = await supabase
        .from('anuncios')
        .select('*')
        .eq('estado', 'activo')
        .order('created_at', { ascending: false })
      if (!error && data) setAnuncios(data)
      setLoading(false)
    }
    fetchAnuncios()
  }, [])

  const formatPrecio = (precio: number, moneda: string) => {
    if (!precio) return 'Consultar'
    return `${moneda} ${precio.toLocaleString('es-AR')}`
  }

  const timeAgo = (date: string) => {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 60000)
    if (diff < 60) return `hace ${diff} min`
    if (diff < 1440) return `hace ${Math.floor(diff / 60)}h`
    return `hace ${Math.floor(diff / 1440)} días`
  }

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", background: "#F0F2F5", maxWidth: "390px", margin: "0 auto", minHeight: "100vh", paddingBottom: "80px" }}>

      {/* HEADER */}
      <div style={{ background: "linear-gradient(180deg, #050d1a 0%, #0a1628 100%)", padding: "16px", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <a href="/" style={{ color: "white", textDecoration: "none", fontSize: "20px" }}>←</a>
          <div>
            <div style={{ fontSize: "18px", fontWeight: 900, color: "white" }}>
              Nexo<span style={{ color: "#FFE600" }}>Net</span>
            </div>
            <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)" }}>Todos los anuncios</div>
          </div>
        </div>
      </div>

      {/* CONTENIDO */}
      <div style={{ padding: "12px 16px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#999" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>⏳</div>
            <div>Cargando anuncios...</div>
          </div>
        ) : anuncios.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#999" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>📭</div>
            <div style={{ fontWeight: 700 }}>No hay anuncios todavía</div>
            <div style={{ fontSize: "13px", marginTop: "8px" }}>¡Sé el primero en publicar!</div>
            <a href="/publicar" style={{ display: "inline-block", marginTop: "20px", background: "#FFE600", color: "#1a1a2e", padding: "12px 24px", borderRadius: "12px", fontWeight: 800, textDecoration: "none" }}>
              ➕ Publicar anuncio
            </a>
          </div>
        ) : (
          <>
            <div style={{ fontSize: "13px", color: "#666", marginBottom: "12px", fontWeight: 600 }}>
              {anuncios.length} anuncio{anuncios.length !== 1 ? 's' : ''} publicado{anuncios.length !== 1 ? 's' : ''}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {anuncios.map((anuncio) => (
                <div key={anuncio.id} style={{ background: "white", borderRadius: "16px", padding: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <div style={{ fontSize: "15px", fontWeight: 800, color: "#1a1a2e", flex: 1, paddingRight: "8px" }}>{anuncio.titulo}</div>
                    <div style={{ fontSize: "16px", fontWeight: 900, color: "#00A650", whiteSpace: "nowrap" }}>
                      {formatPrecio(anuncio.precio, anuncio.moneda)}
                    </div>
                  </div>
                  {anuncio.descripcion && (
                    <div style={{ fontSize: "13px", color: "#666", marginBottom: "10px", lineHeight: 1.4 }}>
                      {anuncio.descripcion.slice(0, 100)}{anuncio.descripcion.length > 100 ? '...' : ''}
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "11px", color: "#999", display: "flex", alignItems: "center", gap: "4px" }}>
                      <span>📍</span> {anuncio.ciudad}, {anuncio.provincia}
                    </div>
                    <div style={{ fontSize: "11px", color: "#bbb" }}>{timeAgo(anuncio.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* BOTTOM NAV */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "390px", background: "white", borderTop: "1px solid #E4E6EA", display: "flex", justifyContent: "space-around", padding: "8px 0 18px", boxShadow: "0 -4px 12px rgba(0,0,0,0.08)" }}>
        {([["🔍", "Buscar", "/"], ["➕", "Publicar", "/publicar"], ["🏠", "Inicio", "/"], ["💬", "Chat", "/"], ["👤", "Perfil", "/login"]] as [string, string, string][]).map(([icon, label, href], i) => (
          <a key={i} href={href} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", cursor: "pointer", padding: "4px 10px", textDecoration: "none" }}>
            <span style={{ fontSize: "22px" }}>{icon}</span>
            <span style={{ fontSize: "10px", color: "#bbb", fontWeight: 700 }}>{label}</span>
          </a>
        ))}
      </div>

    </div>
  )
}
