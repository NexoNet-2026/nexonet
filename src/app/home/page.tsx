'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'

// ── Datos locales ─────────────────────────────────────────────────────────────
const GRUPOS = [
  { id: 1, emoji: '⚽', nombre: 'Deportivos',   color: '#00D2FF' },
  { id: 2, emoji: '🏪', nombre: 'Comerciales',  color: '#FFE600' },
  { id: 3, emoji: '🧘', nombre: 'Bienestar',    color: '#00FFB3' },
  { id: 4, emoji: '🔧', nombre: 'Fierreros',    color: '#FF6B35' },
  { id: 5, emoji: '🐎', nombre: 'Equitación',   color: '#C084FC' },
  { id: 6, emoji: '🎾', nombre: 'Pádel',        color: '#FFE600' },
  { id: 7, emoji: '🏢', nombre: 'Consorcios',   color: '#00D2FF' },
  { id: 8, emoji: '🏡', nombre: 'Barrio',       color: '#00FFB3' },
]

const SUBRUBROS: Record<string, { emoji: string; items: string[] }> = {
  'Tecnología':   { emoji: '💻', items: ['Celulares','Notebooks','TV','Audio','Consolas','Servicios IT'] },
  'Vehículos':    { emoji: '🚗', items: ['Autos','Motos','Camiones','Repuestos','Mecánica'] },
  'Propiedades':  { emoji: '🏠', items: ['Casas','Deptos','Terrenos','Alquiler','Temporario'] },
  'Empleo':       { emoji: '💼', items: ['Oficios','Profesionales','Comercio','Gastronomía'] },
  'Servicios':    { emoji: '🔧', items: ['Hogar','Salud','Educación','Belleza','Mudanzas'] },
  'Gastronomía':  { emoji: '🍕', items: ['Pizzería','Hamburguesería','Sushi','Parrilla','Cafetería'] },
  'Deportes':     { emoji: '⚽', items: ['Fútbol','Pádel','Natación','Gym','Clases'] },
  'Mascotas':     { emoji: '🐾', items: ['Perros','Gatos','Veterinaria','Peluquería'] },
  'Hogar':        { emoji: '🏡', items: ['Muebles','Electrodomésticos','Decoración','Jardín'] },
  'Moda':         { emoji: '👗', items: ['Mujer','Hombre','Calzado','Accesorios'] },
  'Agro':         { emoji: '🌾', items: ['Cereales','Ganadería','Maquinaria','Insumos'] },
  'Salud':        { emoji: '🏥', items: ['Médicos','Psicólogos','Nutrición','Kinesiólogos'] },
}

type Rubro = { id: number; nombre: string }

export default function HomePage() {
  const router = useRouter()
  const [rubros, setRubros] = useState<Rubro[]>([])
  const [rubroActivo, setRubroActivo] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [hora, setHora] = useState('')

  useEffect(() => {
    supabase.from('rubros').select('id, nombre').order('orden').then(({ data }) => {
      if (data) setRubros(data)
    })
    const h = new Date().getHours()
    if (h < 12) setHora('Buenos días')
    else if (h < 19) setHora('Buenas tardes')
    else setHora('Buenas noches')
  }, [])

  const rubrosParaMostrar = rubros.length > 0
    ? rubros.map(r => ({ nombre: r.nombre, ...SUBRUBROS[r.nombre] || { emoji: '📦', items: [] } }))
    : Object.entries(SUBRUBROS).map(([nombre, data]) => ({ nombre, ...data }))

  return (
    <div style={{ fontFamily:"'Nunito',sans-serif", maxWidth:'430px', margin:'0 auto', minHeight:'100vh', position:'relative', background:'#030810' }}>

      {/* ── FONDO con gradiente luxury ── */}
      <div style={{ position:'fixed', top:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:'430px', height:'100vh', backgroundImage:"url('/fondo_pantallas.png')", backgroundSize:'100% 100%', zIndex:0, opacity:0.4 }} />
      <div style={{ position:'fixed', top:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:'430px', height:'100vh', background:'linear-gradient(180deg, rgba(3,8,16,0.95) 0%, rgba(3,8,16,0.7) 40%, rgba(3,8,16,0.95) 100%)', zIndex:1 }} />
      {/* Glow superior */}
      <div style={{ position:'fixed', top:'-80px', left:'50%', transform:'translateX(-50%)', width:'300px', height:'300px', background:'radial-gradient(circle, rgba(0,210,255,0.12) 0%, transparent 70%)', zIndex:1, pointerEvents:'none' }} />

      {/* ── CONTENIDO ── */}
      <div style={{ position:'relative', zIndex:2, paddingBottom:'90px' }}>

        {/* ══ HEADER ══ */}
        <div style={{ padding:'52px 20px 16px', display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:'11px', color:'rgba(0,210,255,0.6)', fontWeight:800, letterSpacing:'3px', textTransform:'uppercase', marginBottom:'2px' }}>{hora}</div>
            <div style={{ fontSize:'28px', fontWeight:900, color:'white', lineHeight:1, letterSpacing:'-0.5px' }}>
              Nexo<span style={{ color:'#00D2FF' }}>Net</span>
            </div>
            <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.3)', letterSpacing:'2px', textTransform:'uppercase', marginTop:'2px' }}>Argentina · Hiper-Local</div>
          </div>
          <div style={{ display:'flex', gap:'10px', marginTop:'4px' }}>
            {/* Notificaciones */}
            <button style={{ width:'38px', height:'38px', borderRadius:'50%', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:'16px', backdropFilter:'blur(12px)' }}>🔔</button>
            {/* Perfil */}
            <button onClick={() => router.push('/login')} style={{ width:'38px', height:'38px', borderRadius:'50%', background:'rgba(0,210,255,0.15)', border:'1px solid rgba(0,210,255,0.3)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:'16px', backdropFilter:'blur(12px)' }}>👤</button>
          </div>
        </div>

        {/* ══ UBICACIÓN ══ */}
        <div style={{ margin:'0 20px 16px' }}>
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            background:'rgba(255,255,255,0.05)',
            backdropFilter:'blur(16px)',
            border:'1px solid rgba(0,210,255,0.15)',
            borderRadius:'14px', padding:'12px 16px',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <div style={{ width:'28px', height:'28px', borderRadius:'8px', background:'rgba(0,210,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px' }}>📍</div>
              <div>
                <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)', fontWeight:700, letterSpacing:'0.5px' }}>TU ZONA</div>
                <div style={{ fontSize:'14px', fontWeight:800, color:'white' }}>Roldán, Santa Fe</div>
              </div>
            </div>
            <button onClick={() => router.push('/buscar')} style={{ fontSize:'11px', fontWeight:800, color:'#00D2FF', background:'rgba(0,210,255,0.1)', border:'1px solid rgba(0,210,255,0.25)', borderRadius:'8px', padding:'5px 10px', cursor:'pointer', fontFamily:'inherit', letterSpacing:'0.3px' }}>
              Cambiar ›
            </button>
          </div>
        </div>

        {/* ══ BUSCADOR ══ */}
        <div style={{ margin:'0 20px 24px', position:'relative' }}>
          <div style={{
            display:'flex', alignItems:'center', gap:'10px',
            background:'rgba(255,255,255,0.07)',
            backdropFilter:'blur(20px)',
            border:'1px solid rgba(0,210,255,0.2)',
            borderRadius:'16px', padding:'4px 4px 4px 16px',
            boxShadow:'0 0 30px rgba(0,210,255,0.05)',
          }}>
            <span style={{ fontSize:'16px', opacity:0.5 }}>🔍</span>
            <input
              type="text"
              placeholder="¿Qué estás buscando en Roldán?"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && router.push(`/buscar?q=${busqueda}`)}
              style={{ flex:1, background:'transparent', border:'none', outline:'none', color:'white', fontSize:'14px', fontFamily:'inherit', fontWeight:600, padding:'8px 0' }}
            />
            <button
              onClick={() => router.push(`/buscar?q=${busqueda}`)}
              style={{ background:'linear-gradient(135deg,rgba(0,180,255,0.5),rgba(0,100,200,0.4))', border:'1px solid rgba(0,210,255,0.5)', borderRadius:'12px', color:'white', fontWeight:800, fontSize:'13px', padding:'10px 16px', cursor:'pointer', fontFamily:'inherit', backdropFilter:'blur(8px)', whiteSpace:'nowrap' }}
            >
              Buscar
            </button>
          </div>
        </div>

        {/* ══ GRUPOS NEXONET ══ */}
        <div style={{ marginBottom:'28px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', marginBottom:'14px' }}>
            <div>
              <div style={{ fontSize:'11px', color:'rgba(0,210,255,0.6)', fontWeight:800, letterSpacing:'2px', textTransform:'uppercase' }}>COMUNIDAD</div>
              <div style={{ fontSize:'18px', fontWeight:900, color:'white' }}>👥 Grupos NexoNet</div>
            </div>
            <button style={{ fontSize:'11px', fontWeight:800, color:'rgba(255,255,255,0.4)', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', letterSpacing:'0.5px' }}>Ver todos ›</button>
          </div>
          <div style={{ display:'flex', gap:'12px', overflowX:'auto', padding:'0 20px 4px', scrollbarWidth:'none' }}>
            {GRUPOS.map(g => (
              <div key={g.id} style={{ flexShrink:0, width:'90px', cursor:'pointer' }}>
                <div style={{
                  width:'90px', height:'90px',
                  background:`rgba(${g.color === '#00D2FF' ? '0,210,255' : g.color === '#FFE600' ? '255,230,0' : g.color === '#00FFB3' ? '0,255,179' : g.color === '#FF6B35' ? '255,107,53' : '192,132,252'},0.1)`,
                  border:`1px solid ${g.color}30`,
                  borderRadius:'20px',
                  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                  gap:'6px',
                  backdropFilter:'blur(12px)',
                  transition:'all 0.2s ease',
                }}>
                  <span style={{ fontSize:'28px' }}>{g.emoji}</span>
                  <span style={{ fontSize:'9px', fontWeight:800, color:g.color, textTransform:'uppercase', letterSpacing:'0.5px', textAlign:'center' }}>{g.nombre}</span>
                </div>
                <div style={{ textAlign:'center', marginTop:'6px', fontSize:'10px', color:'rgba(0,210,255,0.6)', fontWeight:700 }}>Unirse</div>
              </div>
            ))}
          </div>
        </div>

        {/* ══ DIVISOR ══ */}
        <div style={{ margin:'0 20px 24px', height:'1px', background:'linear-gradient(90deg, transparent, rgba(0,210,255,0.2), transparent)' }} />

        {/* ══ RUBROS Y SUBRUBROS ══ */}
        <div style={{ padding:'0 0 8px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', marginBottom:'16px' }}>
            <div>
              <div style={{ fontSize:'11px', color:'rgba(0,210,255,0.6)', fontWeight:800, letterSpacing:'2px', textTransform:'uppercase' }}>CATEGORÍAS</div>
              <div style={{ fontSize:'18px', fontWeight:900, color:'white' }}>Explorá todo</div>
            </div>
          </div>

          {rubrosParaMostrar.map((rubro, idx) => (
            <div key={rubro.nombre} style={{ marginBottom:'6px' }}>

              {/* Header del rubro */}
              <button
                onClick={() => setRubroActivo(rubroActivo === rubro.nombre ? null : rubro.nombre)}
                style={{
                  width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
                  padding:'14px 20px', background:'transparent', border:'none', cursor:'pointer',
                  fontFamily:'inherit',
                }}
              >
                <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                  <div style={{
                    width:'36px', height:'36px', borderRadius:'10px',
                    background:'rgba(0,210,255,0.08)',
                    border:'1px solid rgba(0,210,255,0.15)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:'18px',
                  }}>{rubro.emoji}</div>
                  <div style={{ textAlign:'left' }}>
                    <div style={{ fontSize:'15px', fontWeight:800, color:'white', textTransform:'uppercase', letterSpacing:'0.5px' }}>{rubro.nombre}</div>
                    <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.3)', fontWeight:600 }}>{rubro.items.length} subcategorías</div>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <span style={{ fontSize:'11px', fontWeight:700, color:'rgba(0,210,255,0.5)' }}>Ver todos ›</span>
                  <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.3)', transform: rubroActivo === rubro.nombre ? 'rotate(180deg)' : 'none', transition:'transform 0.2s', display:'inline-block' }}>▾</span>
                </div>
              </button>

              {/* Slider subrubros */}
              <div style={{ display:'flex', gap:'8px', overflowX:'auto', padding:'0 20px 12px', scrollbarWidth:'none' }}>
                {rubro.items.map(sub => (
                  <button
                    key={sub}
                    onClick={() => router.push(`/anuncios?rubro=${rubro.nombre}&sub=${sub}`)}
                    style={{
                      flexShrink:0,
                      padding:'8px 14px',
                      background:'rgba(255,255,255,0.05)',
                      backdropFilter:'blur(12px)',
                      border:'1px solid rgba(0,210,255,0.15)',
                      borderRadius:'20px',
                      color:'rgba(255,255,255,0.7)',
                      fontSize:'12px', fontWeight:700,
                      cursor:'pointer', fontFamily:'inherit',
                      whiteSpace:'nowrap',
                      transition:'all 0.2s ease',
                    }}
                  >
                    {sub}
                  </button>
                ))}
              </div>

              {/* Separador sutil */}
              {idx < rubrosParaMostrar.length - 1 && (
                <div style={{ margin:'0 20px', height:'1px', background:'rgba(255,255,255,0.04)' }} />
              )}
            </div>
          ))}
        </div>

      </div>

      <BottomNav />
    </div>
  )
}
