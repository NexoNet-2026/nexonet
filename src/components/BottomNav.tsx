'use client'
import { usePathname } from 'next/navigation'

const navItems: [string, string, string][] = [
  ['🔍', 'Buscar',   '/anuncios'],
  ['➕', 'Publicar', '/publicar'],
  ['🏠', 'Inicio',   '/home'],
  ['💬', 'Chat',     '/chat'],
  ['👤', 'Perfil',   '/login'],
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: '50%',
      transform: 'translateX(-50%)', width: '100%', maxWidth: '430px',
      zIndex: 100, background: 'rgba(5,13,26,0.75)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(0,210,255,0.15)',
      display: 'flex', justifyContent: 'space-around',
      padding: '8px 0 22px', fontFamily: "'Nunito', sans-serif",
    }}>
      {navItems.map(([icon, label, href]) => {
        const isActive = pathname === href
        return (
          <a key={href} href={href} style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: '3px',
            padding: '4px 12px', textDecoration: 'none', position: 'relative',
          }}>
            {isActive && (
              <div style={{
                position: 'absolute', top: '-8px',
                width: '28px', height: '2px', background: '#00D2FF',
                borderRadius: '2px', boxShadow: '0 0 8px rgba(0,210,255,0.8)',
              }} />
            )}
            <span style={{
              fontSize: '22px',
              filter: isActive ? 'drop-shadow(0 0 6px rgba(0,210,255,0.8))' : 'none',
            }}>{icon}</span>
            <span style={{
              fontSize: '10px',
              color: isActive ? '#00D2FF' : 'rgba(255,255,255,0.3)',
              fontWeight: 700,
            }}>{label}</span>
          </a>
        )
      })}
    </div>
  )
}
