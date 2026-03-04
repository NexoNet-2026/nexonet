'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'

export default function LoginPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'ingresar' | 'registro'>('ingresar')
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleIngresar = async () => {
    setError(''); setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('Email o contraseña incorrectos')
    else router.push('/home')
    setLoading(false)
  }

  const handleRegistro = async () => {
    setError(''); setLoading(true)
    if (!nombre.trim()) { setError('Ingresá tu nombre'); setLoading(false); return }
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { nombre } }
    })
    if (error) setError('Error al registrarse. Intentá de nuevo.')
    else setSuccess('¡Cuenta creada! Revisá tu email para confirmar.')
    setLoading(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px 16px',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(0,210,255,0.25)',
    borderRadius: '12px', color: 'white',
    fontSize: '15px', fontFamily: "'Nunito',sans-serif",
    fontWeight: 600, outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{ fontFamily:"'Nunito',sans-serif", maxWidth:'430px', margin:'0 auto', minHeight:'100vh', position:'relative' }}>

      {/* FONDO */}
      <div style={{ position:'fixed', top:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:'430px', height:'100vh', backgroundImage:"url('/fondo_pantallas.png')", backgroundSize:'100% 100%', zIndex:0 }} />
      <div style={{ position:'fixed', top:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:'430px', height:'100vh', background:'rgba(5,13,26,0.7)', zIndex:1 }} />

      {/* CONTENIDO */}
      <div style={{ position:'relative', zIndex:2, minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'20px 24px 100px' }}>

        {/* LOGO */}
        <div style={{ textAlign:'center', marginBottom:'36px' }}>
          <div style={{ fontSize:'42px', fontWeight:900, color:'white', lineHeight:1 }}>
            Nexo<span style={{ color:'#00D2FF' }}>Net</span>
          </div>
          <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.4)', letterSpacing:'3px', textTransform:'uppercase', marginTop:'6px' }}>
            Argentina · Hiper-Local
          </div>
        </div>

        {/* CARD */}
        <div style={{
          width:'100%',
          background:'rgba(255,255,255,0.06)',
          backdropFilter:'blur(24px)',
          WebkitBackdropFilter:'blur(24px)',
          border:'1px solid rgba(0,210,255,0.2)',
          borderRadius:'20px',
          padding:'24px',
          display:'flex', flexDirection:'column', gap:'16px',
        }}>

          {/* TABS */}
          <div style={{ display:'flex', background:'rgba(0,0,0,0.3)', borderRadius:'12px', padding:'4px', gap:'4px' }}>
            {(['ingresar','registro'] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setError(''); setSuccess('') }} style={{
                flex:1, padding:'10px',
                background: tab === t ? 'rgba(0,210,255,0.2)' : 'transparent',
                border: tab === t ? '1px solid rgba(0,210,255,0.5)' : '1px solid transparent',
                borderRadius:'10px',
                color: tab === t ? '#00D2FF' : 'rgba(255,255,255,0.4)',
                fontSize:'14px', fontWeight:800, cursor:'pointer',
                fontFamily:'inherit', transition:'all 0.2s ease',
              }}>
                {t === 'ingresar' ? '🔑 Ingresar' : '✨ Registrarse'}
              </button>
            ))}
          </div>

          {/* CAMPOS */}
          {tab === 'registro' && (
            <div>
              <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.45)', marginBottom:'6px', fontWeight:700 }}>Tu nombre</div>
              <input
                type="text" placeholder="Ej: Juan Pérez"
                value={nombre} onChange={e => setNombre(e.target.value)}
                style={inputStyle}
              />
            </div>
          )}

          <div>
            <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.45)', marginBottom:'6px', fontWeight:700 }}>Email</div>
            <input
              type="email" placeholder="tu@email.com"
              value={email} onChange={e => setEmail(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.45)', marginBottom:'6px', fontWeight:700 }}>Contraseña</div>
            <input
              type="password" placeholder="Mínimo 6 caracteres"
              value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (tab === 'ingresar' ? handleIngresar() : handleRegistro())}
              style={inputStyle}
            />
          </div>

          {/* ERROR / SUCCESS */}
          {error && (
            <div style={{ background:'rgba(255,60,60,0.15)', border:'1px solid rgba(255,60,60,0.4)', borderRadius:'10px', padding:'10px 14px', fontSize:'13px', color:'#ff8080', fontWeight:600 }}>
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div style={{ background:'rgba(0,255,150,0.1)', border:'1px solid rgba(0,255,150,0.3)', borderRadius:'10px', padding:'10px 14px', fontSize:'13px', color:'#00ff96', fontWeight:600 }}>
              ✅ {success}
            </div>
          )}

          {/* BOTÓN PRINCIPAL */}
          <button
            onClick={tab === 'ingresar' ? handleIngresar : handleRegistro}
            disabled={loading}
            style={{
              width:'100%', padding:'15px',
              background: 'linear-gradient(135deg, rgba(0,180,255,0.4), rgba(0,100,200,0.3))',
              backdropFilter:'blur(12px)',
              border:'1px solid rgba(0,210,255,0.6)',
              borderRadius:'14px', color:'white',
              fontSize:'16px', fontWeight:900,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily:'inherit',
              boxShadow:'0 0 20px rgba(0,180,255,0.2)',
              textShadow:'0 0 10px rgba(0,210,255,0.6)',
              opacity: loading ? 0.7 : 1,
              transition:'all 0.2s ease',
            }}
          >
            {loading ? '⏳ Procesando...' : tab === 'ingresar' ? '🚀 Ingresar a NexoNet' : '✨ Crear mi cuenta'}
          </button>

          {/* VOLVER */}
          <button onClick={() => router.push('/')} style={{
            background:'none', border:'none', cursor:'pointer',
            color:'rgba(255,255,255,0.3)', fontSize:'13px', fontWeight:600,
            fontFamily:'inherit', textAlign:'center',
          }}>
            ← Volver al inicio
          </button>

        </div>

        {/* FOOTER */}
        <div style={{ marginTop:'24px', fontSize:'12px', color:'rgba(255,255,255,0.2)', textAlign:'center' }}>
          NexoNet © 2026 · Argentina
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
