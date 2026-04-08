'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

const TIPOS = [
  { value: 'ayuda',      label: '🙋 Ayuda' },
  { value: 'sugerencia', label: '💡 Sugerencia' },
  { value: 'reclamo',    label: '⚠️ Reclamo' },
  { value: 'denuncia',   label: '🚨 Denuncia' },
  { value: 'solicitud',  label: '📋 Solicitud' },
];

export default function SoportePopup() {
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState('ayuda');
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const enviar = async () => {
    if (!mensaje.trim()) return;
    setEnviando(true);
    const { data: { session } } = await supabase.auth.getSession();
    let perfil: any = null;
    if (session?.user) {
      const { data } = await supabase.from('usuarios').select('nombre_usuario,codigo').eq('id', session.user.id).single();
      perfil = data;
    }
    await fetch('/api/soporte/enviar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usuario_id: session?.user?.id || null,
        nombre_usuario: perfil?.nombre_usuario || null,
        codigo: perfil?.codigo || null,
        tipo,
        mensaje,
      }),
    });
    setEnviado(true);
    setEnviando(false);
    setMensaje('');
    setTimeout(() => { setEnviado(false); setOpen(false); }, 2000);
  };

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed', bottom: '160px', right: '16px', zIndex: 200,
          width: '48px', height: '48px', borderRadius: '50%',
          background: 'linear-gradient(135deg,#1a2a3a,#243b55)',
          border: '2px solid rgba(212,160,23,0.6)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          fontSize: '22px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        title="Contactar soporte"
      >
        💬
      </button>

      {/* Popup */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 500,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: '20px 20px 0 0',
              padding: '24px 20px 36px', width: '100%', maxWidth: '500px',
              fontFamily: "'Nunito',sans-serif",
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '22px', color: '#1a2a3a', letterSpacing: '1px' }}>
                💬 Contactar NexoNet
              </div>
              <button onClick={() => setOpen(false)} style={{ background: '#f0f0f0', border: 'none', borderRadius: '50%', width: '32px', height: '32px', fontSize: '16px', cursor: 'pointer' }}>✕</button>
            </div>

            {enviado ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: '40px', marginBottom: '8px' }}>✅</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#27ae60' }}>¡Mensaje enviado!</div>
                <div style={{ fontSize: '12px', color: '#9a9a9a', fontWeight: 600, marginTop: '4px' }}>Te responderemos a la brevedad.</div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#9a9a9a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Tipo</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  {TIPOS.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setTipo(t.value)}
                      style={{
                        background: tipo === t.value ? 'linear-gradient(135deg,#1a2a3a,#243b55)' : '#f4f4f2',
                        color: tipo === t.value ? '#fff' : '#1a2a3a',
                        border: 'none', borderRadius: '10px', padding: '7px 12px',
                        fontSize: '12px', fontWeight: 800, cursor: 'pointer',
                        fontFamily: "'Nunito',sans-serif",
                      }}
                    >{t.label}</button>
                  ))}
                </div>

                <div style={{ fontSize: '11px', fontWeight: 800, color: '#9a9a9a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Mensaje</div>
                <textarea
                  value={mensaje}
                  onChange={e => setMensaje(e.target.value)}
                  placeholder="Escribí tu mensaje acá..."
                  rows={4}
                  style={{
                    width: '100%', border: '2px solid #e8e8e6', borderRadius: '12px',
                    padding: '12px 14px', fontSize: '14px', fontFamily: "'Nunito',sans-serif",
                    color: '#1a2a3a', outline: 'none', boxSizing: 'border-box',
                    resize: 'vertical', marginBottom: '16px',
                  }}
                />

                <button
                  onClick={enviar}
                  disabled={enviando || !mensaje.trim()}
                  style={{
                    width: '100%', background: enviando || !mensaje.trim() ? '#ccc' : 'linear-gradient(135deg,#1a2a3a,#243b55)',
                    border: 'none', borderRadius: '12px', padding: '14px',
                    fontSize: '15px', fontWeight: 900, color: '#fff',
                    cursor: enviando || !mensaje.trim() ? 'not-allowed' : 'pointer',
                    fontFamily: "'Nunito',sans-serif",
                    boxShadow: enviando || !mensaje.trim() ? 'none' : '0 3px 0 #0a1520',
                  }}
                >
                  {enviando ? '⏳ Enviando...' : '📨 Enviar mensaje'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
