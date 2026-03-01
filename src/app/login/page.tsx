'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Login() {
  const [modo, setModo] = useState<'login' | 'registro'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  async function handleLogin() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Email o contraseña incorrectos')
    } else {
      window.location.href = '/'
    }
    setLoading(false)
  }

  async function handleRegistro() {
    setLoading(true)
    setError('')
    if (!nombre || !email || !password) {
      setError('Completá todos los campos')
      setLoading(false)
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      setLoading(false)
      return
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre } }
    })
    if (error) {
      setError(error.message)
    } else {
      setMensaje('¡Cuenta creada! Revisá tu email para confirmar.')
    }
    setLoading(false)
  }

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", background: 'linear-gradient(180deg, #050d1a 0%, #0a1628 50%, #0f2040 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>

        {/* LOGO */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '36px', fontWeight: 900, color: 'white' }}>
            Nexo<span style={{ color: '#FFE600' }}>Net</span>
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', letterSpacing: '2px', textTransform: 'uppercase', marginTop: '4px' }}>
            Argentina · Hiper-local
          </div>
        </div>

        {/* CARD */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '28px 24px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>

          {/* TABS */}
          <div style={{ display: 'flex', background: '#F0F2F5', borderRadius: '10px', padding: '4px', marginBottom: '24px' }}>
            {(['login', 'registro'] as const).map((tab) => (
              <button key={tab} onClick={() => { setModo(tab); setError(''); setMensaje('') }}
                style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', fontFamily: 'inherit', fontSize: '13px', fontWeight: 800, cursor: 'pointer', background: modo === tab ? 'white' : 'transparent', color: modo === tab ? '#222' : '#999', boxShadow: modo === tab ? '0 2px 8px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>
                {tab === 'login' ? '🔑 Ingresar' : '✨ Registrarse'}
              </button>
            ))}
          </div>

          {/* CAMPOS */}
          {modo === 'registro' && (
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#555', display: 'block', marginBottom: '6px' }}>Tu nombre</label>
              <input
                type="text" value={nombre} onChange={e => setNombre(e.target.value)}
                placeholder="Ej: Juan Pérez"
                style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #E4E6EA', borderRadius: '8px', fontFamily: 'inherit', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          )}

          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#555', display: 'block', marginBottom: '6px' }}>Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #E4E6EA', borderRadius: '8px', fontFamily: 'inherit', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#555', display: 'block', marginBottom: '6px' }}>Contraseña</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #E4E6EA', borderRadius: '8px', fontFamily: 'inherit', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* ERROR */}
          {error && (
            <div style={{ background: '#fff0f0', border: '1px solid #ffcdd2', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#d32f2f', fontWeight: 600 }}>
              ⚠️ {error}
            </div>
          )}

          {/* ÉXITO */}
          {mensaje && (
            <div style={{ background: '#f0fff8', border: '1px solid #b2dfdb', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#00695c', fontWeight: 600 }}>
              ✅ {mensaje}
            </div>
          )}

          {/* BOTÓN */}
          <button
            onClick={modo === 'login' ? handleLogin : handleRegistro}
            disabled={loading}
            style={{ width: '100%', padding: '14px', background: loading ? '#ccc' : '#FFE600', border: 'none', borderRadius: '10px', fontFamily: 'inherit', fontSize: '15px', fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer', color: '#111' }}>
            {loading ? '⏳ Procesando...' : modo === 'login' ? '🚀 Ingresar a NexoNet' : '✨ Crear mi cuenta'}
          </button>

          {/* VOLVER */}
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <a href="/" style={{ fontSize: '12px', color: '#999', textDecoration: 'none', fontWeight: 600 }}>
              ← Volver al inicio
            </a>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
          NexoNet © 2026 · Argentina
        </div>
      </div>
    </div>
  )
}
