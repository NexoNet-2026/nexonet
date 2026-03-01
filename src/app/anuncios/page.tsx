'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
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

function AnunciosContent() {
  const [anuncios, setAnuncios] = useState<Anuncio[]>([])
  const [loading, setLoading] = useState(true)
  const [subrubro, setSubrubro] = useState<Subrubro | null>(null)
  const [rubro, setRubro] = useState<Rubro | null>(null)
  const searchParams = useSearchParams()
  const subrubroId = searchParams.get('subrubro_id')
  const rubroId = searchParams.get('rubro_id')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      if (subrubroId) {
        const { data: subData } = await supabase.from('subrubros').select('*').eq('id', subrubroId).single()
        if (subData) {
          setSubrubro(subData)
          const { data: rubroData } = await supabase.from('rubros').select('*').eq('id', subData.rubro_id).single()
          if (rubroData) setRubro(rubroData)
        }
      } else if (rubroId) {
        const { data: rubroData } = await supabase.from('rubros').select('*').eq('id', rubroId).single()
        if (rubroData) setRubro(rubroData)
      }
      let query = supabase.from('anuncios').select('*').eq('estado', 'activo').order('created_at', { ascending: false })
      if (subrubroId) query = query.eq('subrubro_id', subrubroId)
      const { data } = await query
      if (data) setAnuncios(data)
      setLoading(false)
    }
    fetchData()
  }, [subrubroId, rubroId])

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

  const urlPublicar = subrubroId ? `/publicar?subrubro_id=${subrubroId}` : rubroId ? `/publicar?rubro_id=${rubroId}` : '/publicar'

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", background: "#F0F2F5", maxWidth: "390px", margin: "0 auto", minHeight: "100vh", paddingBottom: "80px" }}>
      <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "390px", zIndex: 100, background: "linear-gradient(180deg, #050d1a 0%, #0a1628 100%)", padding: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <a href="/" style={{ color: "white", textDecoration: "none", fontSize: "22px" }}>←</a>
            <div>
              {rubro && <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>{rubro.nombre}</div>}
              <div style={{ fontSize: "16px", fontWeight: 900, color: "white" }}>{subrubro ? subrubro.nombre : rubro ? rubro.nombre : 'Anuncios'}</div>
            </div>
          </div>
          <a href={urlPublicar} style={{ background: "#FFE600", color: "#1a1a2e", padding: "8px 14px", borderRadius: "20px", fontWeight: 800, fontSize: "13px", textDecoration: "none" }}>
            ➕ Publicar
          </a>
        </div>
      </div>

      <div style={{ height: "70px" }} />

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
            <a href={urlPublicar} style={{ display: "inline-block", marginTop: "20px", background: "#FFE600", color: "#1a1a2e", padding: "12px 24px", borderRadius: "12px", fontWeight: 800, textDecoration: "none" }}>
              ➕ Publicar acá
            </a>
          </div>
        ) : (
          <>
            <div style={{ fontSize: "13px", color: "#666", marginBottom: "12px", fontWeight: 600 }}>
              {anuncios.length} anuncio{anuncios.length !== 1 ? 's' : ''}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {anuncios.map((anuncio) => (
                <a key={anuncio.id} href={`/anuncios/${anuncio.id}`} style={{ background: "white", borderRadius: "16px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", textDecoration: "none", display: "block" }}>
                  {anuncio.imagenes && anuncio.imagenes.length > 0 && (
                    <img src={anuncio.imagenes[0]} style={{ width: "100%", height: "180px", objectFit: "cover" }} />
                  )}
                  <div style={{ padding: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                      <div style={{ fontSize: "15px", fontWeight: 800, color: "#1a1a2e", flex: 1, paddingRight: "8px" }}>{anuncio.titulo}</div>
                      <div style={{ fontSize: "16px", fontWeight: 900, color: "#00A650", whiteSpace: "nowrap" }}>
                        {formatPrecio(anuncio.precio, anuncio.moneda)}
                      </div>
                    </div>
                    {anuncio.descripcion && (
                      <div style={{ fontSize: "13px", color: "#666", marginBottom: "8px", lineHeight: 1.4 }}>
                        {anuncio.descripcion.slice(0, 100)}{anuncio.descripcion.length > 100 ? '...' : ''}
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: "11px", color: "#999" }}>📍 {anuncio.ciudad}, {anuncio.provincia}</div>
                      <div style={{ fontSize: "11px", color: "#bbb" }}>{timeAgo(anuncio.created_at)}</div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </>
        )}
      </div>

      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "390px", background: "white", borderTop: "1px solid #E4E6EA", display: "flex", justifyContent: "space-around", padding: "8px 0 18px", boxShadow: "0 -4px 12px rgba(0,0,0,0.08)" }}>
        {([["🔍", "Buscar", "/"], ["➕", "Publicar", urlPublicar], ["🏠", "Inicio", "/"], ["💬", "Chat", "/"], ["👤", "Perfil", "/login"]] as [string, string, string][]).map(([icon, label, href], i) => (
          <a key={i} href={href} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", cursor: "pointer", padding: "4px 10px", textDecoration: "none" }}>
            <span style={{ fontSize: "22px" }}>{icon}</span>
            <span style={{ fontSize: "10px", color: i === 1 ? "#FFE600" : "#bbb", fontWeight: 700 }}>{label}</span>
          </a>
        ))}
      </div>
    </div>
  )
}

export default function Anuncios() {
  return (
    <Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>⏳</div>}>
      <AnunciosContent />
    </Suspense>
  )
}
