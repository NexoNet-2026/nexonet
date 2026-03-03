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
      position: 'fixed',
      top: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: '430px',
      height: '100vh',
      backgroundImage: "url('/pantalla01.png')",
      backgroundSize: '100% 100%',
      backgroundPosition: 'center top',
    }}>
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
              background: isActive ? 'rgba(0,255,255,0.15)' : 'transparent',
              border: isActive ? '2px solid rgba(0,255,255,0.8)' : '2px solid transparent',
              boxShadow: isActive
                ? '0 0 30px 8px rgba(0,255,255,0.5), inset 0 0 20px rgba(0,255,255,0.1)'
                : 'none',
              transform: isActive ? 'scale(0.96)' : 'scale(1)',
              transition: 'all 0.18s ease',
              cursor: 'pointer',
              outline: 'none',
              WebkitTapHighlightColor: 'transparent',
            }}
          />
        )
      })}
    </div>
  )
}
