'use client'

export default function Splash() {
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      maxWidth: '390px',
      margin: '0 auto',
      minHeight: '100vh',
      overflow: 'hidden',
    }}>
      {/* IMAGEN DE FONDO */}
      <img
        src="/pantalla01.png"
        alt="NexoNet"
        style={{
          width: '100%',
          height: '100vh',
          objectFit: 'cover',
          objectPosition: 'center top',
          display: 'block',
        }}
      />

      {/* BOTONES TRANSPARENTES ENCIMA */}

      {/* BUSCAR EN LISTA */}
      <a href="/" style={{
        position: 'absolute',
        top: '27%',
        left: '4%',
        width: '44%',
        height: '6%',
        cursor: 'pointer',
        borderRadius: '30px',
        // background: 'rgba(255,0,0,0.3)', // ← descomentar para debug
        textDecoration: 'none',
        display: 'block',
      }} />

      {/* BUSCAR EN MAPA */}
      <a href="/mapa" style={{
        position: 'absolute',
        top: '27%',
        left: '52%',
        width: '44%',
        height: '6%',
        cursor: 'pointer',
        borderRadius: '30px',
        textDecoration: 'none',
        display: 'block',
      }} />

      {/* INICIAR SESIÓN */}
      <a href="/login" style={{
        position: 'absolute',
        bottom: '4%',
        left: '2%',
        width: '28%',
        height: '13%',
        cursor: 'pointer',
        borderRadius: '50%',
        textDecoration: 'none',
        display: 'block',
      }} />

      {/* PUBLICAR ANUNCIO */}
      <a href="/publicar" style={{
        position: 'absolute',
        bottom: '3%',
        left: '32%',
        width: '36%',
        height: '15%',
        cursor: 'pointer',
        borderRadius: '50%',
        textDecoration: 'none',
        display: 'block',
      }} />

      {/* REGISTRARSE */}
      <a href="/login?tab=registro" style={{
        position: 'absolute',
        bottom: '4%',
        right: '2%',
        width: '28%',
        height: '13%',
        cursor: 'pointer',
        borderRadius: '50%',
        textDecoration: 'none',
        display: 'block',
      }} />
    </div>
  )
}
