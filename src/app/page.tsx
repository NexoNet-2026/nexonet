'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface ButtonZone {
  id: string
  label: string
  top: string
  left: string
  width: string
  height: string
  href: string
  borderRadius: string
}

const buttons: ButtonZone[] = [
  {
    id: 'buscar-lista',
    label: 'Buscar en Lista',
    top: '24.5%',
    left: '4%',
    width: '37%',
    height: '5.5%',
    href: '/home',
    borderRadius: '50px',
  },
  {
    id: 'buscar-mapa',
    label: 'Buscar en Mapa',
    top: '24.5%',
    left: '52%',
    width: '37%',
    height: '5.5%',
    href: '/mapa',
    borderRadius: '50px',
  },
  {
    id: 'iniciar-sesion',
    label: 'Iniciar Sesión',
    top: '81%',
    left: '2%',
    width: '26%',
    height: '14%',
    href: '/login',
    borderRadius: '50%',
  },
  {
    id: 'publicar',
    label: 'Publicar Anuncio',
    top: '78%',
    left: '34%',
    width: '32%',
    height: '17%',
    href: '/publicar',
    borderRadius: '50%',
  },
  {
    id: 'registrarse',
    label: 'Registrarse',
    top: '81%',
    left: '72%',
    width: '26%',
    height: '14%',
    href: '/login?tab=registro',
    borderRadius: '50%',
  },
]

export default function SplashPage() {
  const router = useRouter()
  const [activeBtn, setActiveBtn] = useState<string | null>(null)

  const handleClick = (btn: ButtonZone) => {
    setActiveBtn(btn.id)
    setTimeout(() => {
      setActiveBtn(null)
      router.push(btn.href)
    }, 350)
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '430px',
        margin: '0 auto',
        overflow: 'hidden',
        lineHeight: 0,
      }}
    >
      <img
        src="/pantalla01.png"
        alt="NexoNet Splash"
        style={{ width: '100%', display: 'block' }}
        draggable={false}
      />

      {buttons.map((btn) => {
        const isActive = activeBtn === btn.id
        return (
          <div
            key={btn.id}
            onClick={() => handleClick(btn)}
            style={{
              position: 'absolute',
              top: btn.top,
              left: btn.left,
              width: btn.width,
              height: btn.height,
              borderRadius: btn.borderRadius,
              cursor: 'pointer',
              background: isActive
                ? 'rgba(0, 255, 255, 0.25)'
                : 'transparent',
              boxShadow: isActive
                ? '0 0 24px 8px rgba(0, 255, 255, 0.6), 0 0 60px 20px rgba(0, 255, 255, 0.3)'
                : 'none',
              transform: isActive ? 'scale(0.95)' : 'scale(1)',
              transition: 'all 0.15s ease',
              // Descomenta para debug:
              // border: '2px solid red',
            }}
          />
        )
      })}
    </div>
  )
}
