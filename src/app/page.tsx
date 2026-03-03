'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

// ╔══════════════════════════════════════════════════╗
// ║  AJUSTÁ LAS COORDENADAS DE CADA BOTÓN ACÁ ABAJO ║
// ╚══════════════════════════════════════════════════╝
const BOTONES = [
  {
    id: 'buscar-lista',
    label: '☰  Buscar en Lista',
    href: '/home',
    top: '21.6%',
    left: '1%',
    width: '45%',
    height: '6%',
    shape: 'pill',
  },
  {
    id: 'buscar-mapa',
    label: '🗺  Buscar en Mapa',
    href: '/mapa',
    top: '21.6%',
    left: '54%',
    width: '45%',
    height: '6%',
    shape: 'pill',
  },
  {
    id: 'iniciar-sesion',
    label: '🔑\nINICIAR\nSESION',
    href: '/login',
    top: '84%',
    left: '-2%',
    width: '26.5%',
    height: '13%',
    shape: 'circle',
  },
  {
    id: 'publicar',
    label: '+\nPublicar\nAnuncio',
    href: '/publicar',
    top: '80%',
    left: '32.5%',
    width: '35%',
    height: '17%',
    shape: 'circle',
  },
  {
    id: 'registrarse',
    label: '👤\nREGISTRARSE',
    href: '/login?tab=registro',
    top: '84%',
    left: '75%',
    width: '26.5%',
    height: '13%',
    shape: 'circle',
  },
]

export default function SplashPage() {
  const router = useRouter()
  const [active, setActive] = useState<string | null>(null)

  const handleClick = (btn: typeof BOTONES[0]) => {
    setActive(btn.id)
    setTimeout(() => {
      setActive(null)
      router.push(btn.href)
    }, 400)
  }

  return (
    // Contenedor que centra la app en desktop y la muestra full en móvil
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      minHeight: '100vh',
      background: '#000',
    }}>
      {/* Wrapper de la imagen — máx 430px, ocupa todo el alto */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '430px',
        minHeight: '100vh',
        overflow: 'hidden',
      }}>
        {/* Imagen de fondo que cubre todo el alto del wrapper */}
        <img
          src="/pantalla01.png"
          alt=""
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
            display: 'block',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
          draggable={false}
        />

        {/* Botones encima de la imagen */}
        {BOTONES.map((btn) => {
          const isActive = active === btn.id
          const isPill = btn.shape === 'pill'

          return (
            <button
              key={btn.id}
              onClick={() => handleClick(btn)}
              style={{
                position: 'absolute',
                top: btn.top,
                left: btn.left,
                width: btn.width,
                height: btn.height,
                borderRadius: isPill ? '50px' : '50%',
                cursor: 'pointer',
                border: isActive
                  ? '2px solid rgba(0,255,255,0.9)'
                  : 'none',
                background: isActive
                  ? 'rgba(0,255,255,0.2)'
                  : 'transparent',
                boxShadow: isActive
                  ? '0 0 28px 10px rgba(0,255,255,0.55), inset 0 0 20px rgba(0,255,255,0.15)'
                  : 'none',
                transform: isActive ? 'scale(0.96)' : 'scale(1)',
                transition: 'all 0.18s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '1px',
                padding: '4px',
                color: 'rgba(160,240,255,0.9)',
                fontSize: isPill ? '11px' : '9px',
                fontWeight: 700,
                fontFamily: 'system-ui, sans-serif',
                textShadow: '0 0 8px rgba(0,220,255,0.8)',
                whiteSpace: 'pre-line',
                textAlign: 'center',
                lineHeight: 1.2,
                outline: 'none',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {/* sin texto */}
            </button>
          )
        })}
      </div>
    </div>
  )
}
