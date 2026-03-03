'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const BOTONES = [
  { id: 'buscar-lista',    label: '☰  Buscar en Lista', href: '/buscar',           top: '26%', left: '4%',  width: '42%', height: '6%',  shape: 'pill' },
  { id: 'buscar-mapa',     label: '🗺  Buscar en Mapa',  href: '/mapa',             top: '26%', left: '54%', width: '42%', height: '6%',  shape: 'pill' },
  { id: 'iniciar-sesion',  label: '🔑\nINICIAR\nSESION', href: '/login',            top: '80%', left: '2%',  width: '27%', height: '14%', shape: 'circle' },
  { id: 'publicar',        label: '+\nPublicar\nAnuncio', href: '/publicar',         top: '77%', left: '36%', width: '28%', height: '17%', shape: 'circle' },
  { id: 'registrarse',     label: '👤\nREGISTRARSE',     href: '/login?tab=registro', top: '80%', left: '72%', width: '27%', height: '14%', shape: 'circle' },
]

export default function SplashPage() {
  const router = useRouter()
  const [active, setActive] = useState<string | null>(null)

  const handleClick = (btn: typeof BOTONES[0]) => {
    setActive(btn.id)
    setTimeout(() => { setActive(null); router.push(btn.href) }, 400)
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', background: '#000', minHeight: '100vh' }}>
      <div style={{ position: 'relative', width: '100%', maxWidth: '430px' }}>

        {/* IMAGEN — ocupa todo el ancho, alto natural */}
        <img
          src="/pantalla01.png"
          alt="NexoNet"
          draggable={false}
          style={{ width: '100%', height: 'auto', display: 'block', userSelect: 'none' }}
        />

        {/* BOTONES ENCIMA */}
        {BOTONES.map((btn) => {
          const isActive = active === btn.id
          const isPill = btn.shape === 'pill'
          return (
            <button
              key={btn.id}
              onClick={() => handleClick(btn)}
              style={{
                position: 'absolute',
                top: btn.top, left: btn.left,
                width: btn.width, height: btn.height,
                borderRadius: isPill ? '50px' : '50%',
                cursor: 'pointer',
                border: '2px solid rgba(0,220,255,0.6)',
                background: isActive ? 'rgba(0,255,255,0.2)' : 'rgba(0,180,220,0.08)',
                boxShadow: isActive
                  ? '0 0 28px 10px rgba(0,255,255,0.55), inset 0 0 20px rgba(0,255,255,0.15)'
                  : '0 0 10px 2px rgba(0,220,255,0.2)',
                transform: isActive ? 'scale(0.96)' : 'scale(1)',
                transition: 'all 0.18s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: '1px', padding: '4px',
                color: 'rgba(160,240,255,0.9)',
                fontSize: isPill ? '11px' : '9px',
                fontWeight: 700, fontFamily: 'system-ui, sans-serif',
                textShadow: '0 0 8px rgba(0,220,255,0.8)',
                whiteSpace: 'pre-line', textAlign: 'center', lineHeight: 1.2,
                outline: 'none', WebkitTapHighlightColor: 'transparent',
              }}
            >
              {btn.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
