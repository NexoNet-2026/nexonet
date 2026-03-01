'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Rubro = { id: number; nombre: string; orden: number }
type Subrubro = { id: number; rubro_id: number; nombre: string }

export default function Home() {
  const [rubros, setRubros] = useState<Rubro[]>([])
  const [subrubros, setSubrubros] = useState<Subrubro[]>([])
  const [loading, setLoading] = useState(true)

  const grupos = [
    { emoji: "⚽", nombre: "Deportivos", color: "#4CAF50" },
    { emoji: "🏪", nombre: "Comerciales", color: "#FF9800" },
    { emoji: "🧘", nombre: "Bienestar", color: "#26A69A" },
    { emoji: "🔧", nombre: "Fierreros", color: "#607D8B" },
    { emoji: "🐴", nombre: "Equitación", color: "#795548" },
    { emoji: "🏓", nombre: "Pádel", color: "#42A5F5" },
    { emoji: "🏢", nombre: "Consorcios", color: "#5C6BC0" },
    { emoji: "🏘️", nombre: "Barrio", color: "#66BB6A" },
  ]

  useEffect(() => {
    const fetchData = async () => {
      const { data: rubrosData } = await supabase.from('rubros').select('*').order('orden')
      const { data: subData } = await supabase.from('subrubros').select('*').order('id')
      if (rubrosData) setRubros(rubrosData)
      if (subData) setSubrubros(subData)
      setLoading(false)
    }
    fetchData()
  }, [])

  const subsDe = (rubro_id: number) => subrubros.filter(s => s.rubro_id === rubro_id)

  const colores = ["#00BCD4","#FF6B35","#00A650","#3483FA","#9C27B0","#FF9800","#4CAF50","#E91E63","#607D8B","#8BC34A","#FF7043","#795548","#EC407A","#5C6BC0","#F44336","#FF5722","#FFA726","#26A69A","#42A5F5","#78909C","#66BB6A","#AB47BC","#FFA000","#29B6F6","#EF9A9A","#CE93D8"]

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", background: "#F0F2F5", maxWidth: "390px", margin: "0 auto", minHeight: "100vh" }}>

      {/* HEADER FIJO */}
      <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "390px", zIndex: 100, background: "linear-gradient(180deg, #050d1a 0%, #0a1628 50%, #0f2040 100%)", padding: "14px 16px", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <div>
            <div style={{ fontSize: "24px", fontWeight: 900, color: "white" }}>Nexo<span style={{ color: "#FFE600" }}>Net</span></div>
            <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.45)", letterSpacing: "1.5px", textTransform: "uppercase" }}>Argentina · Hiper-local</div>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>🔔</div>
            <a href="/login" style={{ width: "34px", height: "34px", borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>👤</a>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "8px 12px", marginBottom: "10px" }}>
          <span>📍</span>
          <span style={{ flex: 1, fontSize: "13px", fontWeight: 700, color: "white" }}>Roldán, Santa Fe</span>
          <span style={{ fontSize: "11px", color: "#FFE600", fontWeight: 700 }}>Cambiar ›</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "white", borderRadius: "8px", padding: "10px 12px" }}>
          <span>🔍</span>
          <input type="text" placeholder="¿Qué estás buscando en Roldán?" style={{ background: "none", border: "none", outline: "none", fontFamily: "inherit", fontSize: "14px", width: "100%" }} />
          <button style={{ background: "#FFE600", border: "none", borderRadius: "6px", padding: "6px 12px", fontFamily: "inherit", fontSize: "12px", fontWeight: 800, cursor: "pointer" }}>Buscar</button>
        </div>
      </div>

      <div style={{ height: "174px" }} />

      {/* GRUPOS */}
      <div style={{ background: "#0a1628", padding: "14px 0 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 16px 10px" }}>
          <span style={{ fontSize: "14px", fontWeight: 800, color: "white" }}>👥 Grupos NexoNet</span>
          <span style={{ fontSize: "11px", color: "#FFE600", fontWeight: 700 }}>Ver todos ›</span>
        </div>
        <div style={{ display: "flex", gap: "10px", overflowX: "auto", padding: "0 16px 2px" }}>
          {grupos.map((g, i) => (
            <div key={i} style={{ flexShrink: 0, width: "80px", display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", cursor: "pointer", padding: "10px 6px 8px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: "12px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", background: `${g.color}30`, border: `2px solid ${g.color}60` }}>{g.emoji}</div>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "white", textAlign: "center" }}>{g.nombre}</span>
              <span style={{ fontSize: "9px", fontWeight: 800, color: "#FFE600" }}>Unirse</span>
            </div>
          ))}
        </div>
      </div>

      {/* RUBROS DESDE SUPABASE */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>⏳ Cargando...</div>
      ) : (
        rubros.map((rubro, i) => {
          const subs = subsDe(rubro.id)
          const color = colores[i % colores.length]
          return (
            <div key={rubro.id}>
              <div style={{ height: "8px", background: "#E4E6EA" }} />
              <div style={{ background: "white" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px 10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "15px", fontWeight: 800 }}>
                    <div style={{ width: "9px", height: "9px", borderRadius: "50%", background: color }} />
                    {rubro.nombre}
                  </div>
                  <a href={`/anuncios?rubro_id=${rubro.id}`} style={{ fontSize: "12px", color: "#3483FA", fontWeight: 700, textDecoration: "none" }}>Ver todos ›</a>
                </div>
                <div style={{ display: "flex", gap: "10px", overflowX: "auto", padding: "0 16px 14px" }}>
                  {subs.map((sub) => (
                    <a key={sub.id} href={`/anuncios?subrubro_id=${sub.id}`} style={{ flexShrink: 0, width: "90px", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", cursor: "pointer", padding: "10px 6px 8px", background: "white", border: `1.5px solid ${color}40`, borderRadius: "12px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", textDecoration: "none" }}>
                      <div style={{ width: "46px", height: "46px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", background: `${color}18` }}>📦</div>
                      <span style={{ fontSize: "9px", fontWeight: 700, color: "#555", textAlign: "center", lineHeight: 1.2 }}>{sub.nombre}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )
        })
      )}

      <div style={{ height: "80px" }} />
      {/* BOTTOM NAV */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "390px", background: "white", borderTop: "1px solid #E4E6EA", display: "flex", justifyContent: "space-around", padding: "8px 0 18px", boxShadow: "0 -4px 12px rgba(0,0,0,0.08)" }}>
        {([["🔍", "Buscar", "/"], ["➕", "Publicar", "/publicar"], ["🏠", "Inicio", "/"], ["💬", "Chat", "/"], ["👤", "Perfil", "/login"]] as [string, string, string][]).map(([icon, label, href], i) => (
          <a key={i} href={href} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", cursor: "pointer", padding: "4px 10px", textDecoration: "none" }}>
            <span style={{ fontSize: "22px" }}>{icon}</span>
            <span style={{ fontSize: "10px", color: i === 2 ? "#3483FA" : "#bbb", fontWeight: 700 }}>{label}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
