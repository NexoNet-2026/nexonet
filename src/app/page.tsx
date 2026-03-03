'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const BOTONES = [
  { id: 'buscar-lista',   href: '/buscar',             top: '26%', left: '4%',  width: '42%', height: '6%',  shape: 'pill' },
  { id: 'buscar-mapa',    href: '/mapa',               top: '26%', left: '54%', width: '42%', height: '6%',  shape: 'pill' },
  { id: 'iniciar-sesion', href: '/login',              top: '80%', left: '2%',  width: '27%', height: '14%', shape: 'circle' },
  { id: 'publicar',       href: '/publicar',           top: '77%', left: '36%', width: '28%', height: '17%', shape: 'circle' },
  { id: 'registrarse',    href: '/login?tab=registro', top: '80%', left: '72%', width: '27%', height: '14%', shape: 'circle' },
]

export default function SplashPage() {
  const router = useRouter()
  const [active, setActive] = useState<string | null>(null)

  const handleClick = (btn: typeof BOTONES[0]) => {
    setActive(btn.id)
    setTimeout(() => { setActive(null); router.push(btn.href) }, 400)
  }

  return (
    <div style={{
      background: '#000',
      minHeight: '100svh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'relative',
        height: '100svh',       // ← el contenedor = pantalla exacta
        maxWidth: '430px',
        width: '100%',
      }}>
        <img
          src="/pantalla01.png"
          alt="NexoNet"
          draggable={false}
          style={{
            height: '100%',     // ← imagen escala para entrar exacta en la pantalla
            width: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
            display: 'block',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        />

        {BOTONES.map((btn) => {
          const isActive = active === btn.id
          return (
            <button
              key={btn.id}
              onClick={() => handleClick(btn)}
              style={{
                position: 'absolute',
                top: btn.top, left: btn.left,
                width: btn.width, height: btn.height,
                borderRadius: btn.shape === 'pill' ? '50px' : '50%',
                cursor: 'pointer',
                border: 'none',
                background: 'transparent',
                boxShadow: isActive ? '0 0 28px 10px rgba(0,255,255,0.4)' : 'none',
                transform: isActive ? 'scale(0.96)' : 'scale(1)',
                transition: 'all 0.18s ease',
                outline: 'none',
                WebkitTapHighlightColor: 'transparent',
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
