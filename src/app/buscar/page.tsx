'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const UBICACIONES: Record<string, Record<string, string[]>> = {
  'Buenos Aires': { 'CABA': ['Palermo','Belgrano','Recoleta','San Telmo','Villa Crespo','Caballito','Almagro','Flores'], 'La Plata': ['Centro','City Bell','Los Hornos','Villa Elvira'], 'Mar del Plata': ['Centro','La Perla','Punta Mogotes'], 'Quilmes': ['Centro','Bernal','Ezpeleta'], 'Tigre': ['Centro','El Talar','Don Torcuato'], 'Bahía Blanca': ['Centro','Ingeniero White','Villa Mitre'] },
  'Santa Fe': { 'Rosario': ['Centro','Pichincha','Palermo','Fisherton','Arroyito','La Florida','Tablada','Echesortu'], 'Santa Fe Capital': ['Centro','Sur','Norte','Oeste','Alto Verde','Candioti'], 'Roldán': ['Centro','Villa Urquiza','Los Girasoles','El Laguito'], 'Rafaela': ['Centro','Norte','Sur','Oeste'], 'Venado Tuerto': ['Centro','Oeste','Este','Norte'] },
  'Córdoba': { 'Córdoba Capital': ['Centro','Nueva Córdoba','Güemes','Cerro de las Rosas','Villa Allende','Argüello'], 'Villa Carlos Paz': ['Centro','Valle Hermoso','San Roque'], 'Río Cuarto': ['Centro','Norte','Sur'], 'Villa María': ['Centro','Norte','Sur'] },
  'Mendoza': { 'Mendoza Capital': ['Centro','Godoy Cruz','Guaymallén','Las Heras','Maipú'], 'San Rafael': ['Centro','Rama Caída','Monte Coman'], 'Luján de Cuyo': ['Centro','Chacras de Coria','Perdriel'] },
  'Tucumán': { 'San Miguel de Tucumán': ['Centro','Yerba Buena','Banda del Río Salí','Lomas de Tafí'], 'Tafí Viejo': ['Centro','Villa 9 de Julio'] },
  'Entre Ríos': { 'Paraná': ['Centro','Bajada Grande','Anacleto Medina'], 'Concordia': ['Centro','Los Charrúas'], 'Gualeguaychú': ['Centro','Puerto','Norte'] },
  'Misiones': { 'Posadas': ['Centro','Itaembé Miní','Yacyretá'], 'Oberá': ['Centro','Norte'] },
  'Salta': { 'Salta Capital': ['Centro','San Bernardo','Tres Cerritos'], 'Tartagal': ['Centro','Norte'] },
  'Neuquén': { 'Neuquén Capital': ['Centro','Confluencia','Güemes'], 'San Martín de los Andes': ['Centro','Chapelco'], 'Bariloche': ['Centro','Melipal','Jardín de Patagonia'] },
  'Chaco': { 'Resistencia': ['Centro','Villa del Parque','Parque Avalos'] },
}

const RUBROS: Record<string, { emoji: string; subrubros: Record<string, string[]> }> = {
  'Tecnología': { emoji: '💻', subrubros: { 'Celulares': ['Nuevos','Usados','Repuestos','Reparación'], 'Computadoras': ['Notebooks','PC Escritorio','Tablets','Accesorios'], 'Electrónica': ['TV','Audio','Cámaras','Consolas'], 'Servicios IT': ['Redes','Software','Soporte','Diseño Web'] } },
  'Vehículos': { emoji: '🚗', subrubros: { 'Autos': ['Sedán','SUV','Pickup','Hatchback'], 'Motos': ['Urbanas','Deportivas','Enduro','Scooter'], 'Camiones': ['Livianos','Medianos','Pesados'], 'Servicios': ['Mecánica','Chapa y Pintura','Electricidad','Gomería'] } },
  'Propiedades': { emoji: '🏠', subrubros: { 'Venta': ['Casa','Departamento','Terreno','Local Comercial'], 'Alquiler': ['Casa','Departamento','Habitación','Temporario'], 'Servicios': ['Inmobiliarias','Arquitectos','Construcción','Plomería'] } },
  'Empleo': { emoji: '💼', subrubros: { 'Oficios': ['Electricista','Plomero','Pintor','Carpintero'], 'Profesionales': ['Médicos','Abogados','Contadores','Ingenieros'], 'Gastronomía': ['Cocineros','Mozos','Bartenders','Pasteleros'], 'Comercio': ['Vendedores','Repositores','Cajeros','Administración'] } },
  'Servicios': { emoji: '🔧', subrubros: { 'Hogar': ['Limpieza','Mudanzas','Electricidad','Pintura'], 'Salud': ['Médicos','Psicólogos','Kinesiólogos','Nutricionistas'], 'Educación': ['Clases Particulares','Idiomas','Música','Deportes'], 'Belleza': ['Peluquería','Estética','Uñas','Maquillaje'] } },
  'Gastronomía': { emoji: '🍕', subrubros: { 'Comidas': ['Pizzería','Hamburguesas','Sushi','Empanadas','Parrilla'], 'Bebidas': ['Cafetería','Bar','Cervecería'], 'Dulces': ['Pastelería','Helados','Chocolatería'] } },
  'Deportes': { emoji: '⚽', subrubros: { 'Equipamiento': ['Ropa Deportiva','Calzado','Pelotas','Accesorios'], 'Clases': ['Fútbol','Básquet','Tenis','Pádel','Natación'], 'Instalaciones': ['Canchas','Gimnasios','Piletas'] } },
  'Mascotas': { emoji: '🐾', subrubros: { 'Perros': ['Cachorros','Adultos','Accesorios','Alimentos'], 'Gatos': ['Gatitos','Adultos','Accesorios','Alimentos'], 'Servicios': ['Veterinaria','Peluquería','Guardería','Adiestramiento'] } },
  'Hogar': { emoji: '🏡', subrubros: { 'Muebles': ['Living','Dormitorio','Cocina','Jardín'], 'Electrodomésticos': ['Línea Blanca','Pequeños','Climatización'], 'Decoración': ['Cuadros','Textiles','Iluminación','Plantas'] } },
  'Moda': { emoji: '👗', subrubros: { 'Ropa': ['Mujer','Hombre','Niños','Bebés'], 'Calzado': ['Zapatillas','Zapatos','Botas','Sandalias'], 'Accesorios': ['Carteras','Bijouterie','Lentes','Relojes'] } },
  'Grupos': { emoji: '👥', subrubros: { 'Deportivos': ['Fútbol','Básquet','Tenis','Ciclismo'], 'Comerciales': ['Locales de Barrio','Emprendedores','Ferias'], 'Comunidad': ['Edificios','Barrios','Instituciones','Clubes'], 'Intereses': ['Hobbies','Cultura','Gastronomía','Viajes'] } },
  'Salud': { emoji: '🏥', subrubros: { 'Medicina': ['Clínica','Pediatría','Cardiología','Traumatología'], 'Bienestar': ['Yoga','Meditación','Nutrición','Psicología'], 'Farmacias': ['Medicamentos','Cosmética','Ortopedia'] } },
  'Agro': { emoji: '🌾', subrubros: { 'Producción': ['Cereales','Soja','Girasol','Maíz'], 'Ganadería': ['Bovinos','Porcinos','Ovinos','Aves'], 'Maquinaria': ['Tractores','Cosechadoras','Implementos','Repuestos'] } },
}

const navItems: [string, string, string][] = [
  ['🔍','Buscar','/buscar'],['➕','Publicar','/publicar'],['🏠','Inicio','/home'],['💬','Chat','/'],['👤','Perfil','/login'],
]

const selectStyle: React.CSSProperties = {
  width: '100%', padding: '12px 40px 12px 14px',
  background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(0,210,255,0.3)',
  borderRadius: '10px', color: 'white',
  fontSize: '14px', fontFamily: "'Nunito',sans-serif",
  fontWeight: 600, outline: 'none', cursor: 'pointer',
  appearance: 'none', WebkitAppearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2300D2FF' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center',
  boxSizing: 'border-box',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px',
  background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(0,210,255,0.3)',
  borderRadius: '10px', color: 'white',
  fontSize: '14px', fontFamily: "'Nunito',sans-serif",
  fontWeight: 600, outline: 'none',
  boxSizing: 'border-box',
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(0,210,255,0.2)',
  borderRadius: '16px',
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
}

export default function BuscarPage() {
  const router = useRouter()
  const [provincia, setProvincia] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [barrio, setBarrio] = useState('')
  const [rubro, setRubro] = useState('')
  const [subrubro, setSubrubro] = useState('')
  const [filtro, setFiltro] = useState('')
  const [busquedaLibre, setBusquedaLibre] = useState('')

  const ciudades = provincia ? Object.keys(UBICACIONES[provincia]) : []
  const barrios = ciudad ? UBICACIONES[provincia]?.[ciudad] ?? [] : []
  const subrubros = rubro ? Object.keys(RUBROS[rubro].subrubros) : []
  const filtros = subrubro ? RUBROS[rubro]?.subrubros[subrubro] ?? [] : []
  const canSearch = !!(provincia || rubro || busquedaLibre.trim())

  const handleBuscar = () => {
    const p = new URLSearchParams()
    if (busquedaLibre.trim()) p.set('q', busquedaLibre.trim())
    if (provincia) p.set('provincia', provincia)
    if (ciudad) p.set('ciudad', ciudad)
    if (barrio) p.set('barrio', barrio)
    if (rubro) p.set('rubro', rubro)
    if (subrubro) p.set('subrubro', subrubro)
    if (filtro) p.set('filtro', filtro)
    router.push(`/anuncios?${p.toString()}`)
  }

  return (
    <div style={{ fontFamily:"'Nunito',sans-serif", maxWidth:'430px', margin:'0 auto', minHeight:'100vh', position:'relative' }}>

      {/* FONDO FIJO */}
      <div style={{
        position: 'fixed',
        top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: '430px', height: '100vh',
        backgroundImage: "url('/fondo_pantallas.png')",
        backgroundSize: '100% 100%',
        backgroundPosition: 'center top',
        zIndex: 0,
      }} />
      {/* Overlay para legibilidad */}
      <div style={{
        position: 'fixed',
        top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: '430px', height: '100vh',
        background: 'rgba(5,13,26,0.55)',
        zIndex: 1,
      }} />

      {/* CONTENIDO */}
      <div style={{ position: 'relative', zIndex: 2, paddingBottom: '100px' }}>

        {/* HEADER */}
        <div style={{ padding: '52px 20px 20px' }}>
          <button onClick={() => router.back()} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.5)', fontSize:'13px', fontWeight:700, padding:0, fontFamily:'inherit', marginBottom:'16px', display:'block' }}>
            ← Volver
          </button>
          <div style={{ fontSize:'11px', color:'#FFE600', fontWeight:800, letterSpacing:'2px', textTransform:'uppercase', marginBottom:'4px' }}>NexoNet</div>
          <div style={{ fontSize:'28px', fontWeight:900, color:'white', lineHeight:1.15, marginBottom:'6px', textShadow:'0 2px 12px rgba(0,0,0,0.6)' }}>
            ¿Qué estás<br />buscando?
          </div>
          <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.5)', fontWeight:600 }}>
            Filtrá por ubicación, rubro o escribí directamente
          </div>
        </div>

        <div style={{ padding:'0 20px', display:'flex', flexDirection:'column', gap:'12px' }}>

          {/* BÚSQUEDA LIBRE */}
          <div style={cardStyle}>
            <div style={{ fontSize:'11px', fontWeight:800, color:'#00D2FF', letterSpacing:'1.5px', textTransform:'uppercase' }}>🔍 Búsqueda libre</div>
            <input
              type="text"
              placeholder="Ej: plomero, iPhone 14, depto en alquiler..."
              value={busquedaLibre}
              onChange={e => setBusquedaLibre(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && canSearch && handleBuscar()}
              style={inputStyle}
            />
          </div>

          {/* UBICACIÓN */}
          <div style={cardStyle}>
            <div style={{ fontSize:'11px', fontWeight:800, color:'#00D2FF', letterSpacing:'1.5px', textTransform:'uppercase' }}>📍 Ubicación</div>
            <div>
              <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.45)', marginBottom:'5px', fontWeight:600 }}>Provincia</div>
              <select value={provincia} onChange={e => { setProvincia(e.target.value); setCiudad(''); setBarrio('') }} style={selectStyle}>
                <option value="" style={{ background:'#0a1628' }}>Todas las provincias</option>
                {Object.keys(UBICACIONES).map(p => <option key={p} value={p} style={{ background:'#0a1628' }}>{p}</option>)}
              </select>
            </div>
            {provincia && (
              <div>
                <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.45)', marginBottom:'5px', fontWeight:600 }}>Ciudad / Localidad</div>
                <select value={ciudad} onChange={e => { setCiudad(e.target.value); setBarrio('') }} style={selectStyle}>
                  <option value="" style={{ background:'#0a1628' }}>Todas las ciudades</option>
                  {ciudades.map(c => <option key={c} value={c} style={{ background:'#0a1628' }}>{c}</option>)}
                </select>
              </div>
            )}
            {ciudad && barrios.length > 0 && (
              <div>
                <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.45)', marginBottom:'5px', fontWeight:600 }}>Barrio (opcional)</div>
                <select value={barrio} onChange={e => setBarrio(e.target.value)} style={selectStyle}>
                  <option value="" style={{ background:'#0a1628' }}>Todos los barrios</option>
                  {barrios.map(b => <option key={b} value={b} style={{ background:'#0a1628' }}>{b}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* RUBRO */}
          <div style={cardStyle}>
            <div style={{ fontSize:'11px', fontWeight:800, color:'#00D2FF', letterSpacing:'1.5px', textTransform:'uppercase' }}>🗂 Rubro</div>
            <div>
              <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.45)', marginBottom:'5px', fontWeight:600 }}>Categoría</div>
              <select value={rubro} onChange={e => { setRubro(e.target.value); setSubrubro(''); setFiltro('') }} style={selectStyle}>
                <option value="" style={{ background:'#0a1628' }}>Todos los rubros</option>
                {Object.entries(RUBROS).map(([r, d]) => <option key={r} value={r} style={{ background:'#0a1628' }}>{d.emoji} {r}</option>)}
              </select>
            </div>
            {rubro && (
              <div>
                <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.45)', marginBottom:'5px', fontWeight:600 }}>Subrubro</div>
                <select value={subrubro} onChange={e => { setSubrubro(e.target.value); setFiltro('') }} style={selectStyle}>
                  <option value="" style={{ background:'#0a1628' }}>Todo {rubro}</option>
                  {subrubros.map(s => <option key={s} value={s} style={{ background:'#0a1628' }}>{s}</option>)}
                </select>
              </div>
            )}
            {subrubro && filtros.length > 0 && (
              <div>
                <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.45)', marginBottom:'5px', fontWeight:600 }}>Filtro</div>
                <select value={filtro} onChange={e => setFiltro(e.target.value)} style={selectStyle}>
                  <option value="" style={{ background:'#0a1628' }}>Todo {subrubro}</option>
                  {filtros.map(f => <option key={f} value={f} style={{ background:'#0a1628' }}>{f}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* BOTÓN */}
          <button
            onClick={handleBuscar}
            disabled={!canSearch}
            style={{
              width:'100%', padding:'15px',
              background: canSearch ? 'rgba(0,180,255,0.25)' : 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: canSearch ? '1px solid rgba(0,210,255,0.6)' : '1px solid rgba(255,255,255,0.08)',
              borderRadius:'14px',
              color: canSearch ? '#fff' : 'rgba(255,255,255,0.2)',
              fontSize:'16px', fontWeight:900,
              cursor: canSearch ? 'pointer' : 'not-allowed',
              fontFamily:'inherit',
              boxShadow: canSearch ? '0 0 20px rgba(0,180,255,0.2)' : 'none',
              textShadow: canSearch ? '0 0 10px rgba(0,210,255,0.6)' : 'none',
              transition:'all 0.2s ease',
            }}
          >
            {canSearch ? '🔍 Ver resultados' : 'Completá al menos un campo'}
          </button>

        </div>
      </div>

      {/* BOTTOM NAV */}
      <div style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:'430px', background:'rgba(5,13,26,0.9)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', borderTop:'1px solid rgba(0,210,255,0.15)', display:'flex', justifyContent:'space-around', padding:'8px 0 18px', zIndex:10 }}>
        {navItems.map(([icon, label, href], i) => (
          <a key={i} href={href} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', padding:'4px 10px', textDecoration:'none' }}>
            <span style={{ fontSize:'22px' }}>{icon}</span>
            <span style={{ fontSize:'10px', color: i===0 ? '#00D2FF' : 'rgba(255,255,255,0.3)', fontWeight:700 }}>{label}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
