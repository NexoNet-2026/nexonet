'use client'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  titulo?: string
  volver?: boolean
  usuario?: string
}

export default function Header({ titulo, volver = false, usuario = 'Invitado' }: HeaderProps) {
  const router = useRouter()

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      width: '100%',
      background: 'rgba(5,13,26,0.75)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(0,210,255,0.15)',
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      fontFamily: "'Nunito', sans-serif",
    }}>

      {/* IZQUIERDA: volver + logo + título */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {volver && (
          <button onClick={() => router.back()} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.5)', fontSize: '20px',
            padding: 0, lineHeight: 1, fontFamily: 'inherit',
          }}>←</button>
        )}
        <div>
          <div style={{ fontSize: '18px', fontWeight: 900, color: 'white', lineHeight: 1 }}>
            Nexo<span style={{ color: '#00D2FF' }}>Net</span>
          </div>
          {titulo && (
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginTop: '1px' }}>
              {titulo}
            </div>
          )}
        </div>
      </div>

      {/* DERECHA: usuario */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(0,210,255,0.2)',
        borderRadius: '20px',
        padding: '6px 12px 6px 8px',
        cursor: 'pointer',
      }}>
        <div style={{
          width: '26px', height: '26px', borderRadius: '50%',
          background: 'rgba(0,210,255,0.2)',
          border: '1px solid rgba(0,210,255,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '13px',
        }}>👤</div>
        <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
          {usuario}
        </span>
      </div>

    </div>
  )
}
