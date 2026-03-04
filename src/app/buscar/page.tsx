'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'

const UBICACIONES: Record<string, Record<string, string[]>> = {
  'Buenos Aires': { 'CABA': ['Palermo','Belgrano','Recoleta','San Telmo','Villa Crespo','Caballito','Almagro','Flores'], 'La Plata': ['Centro','City Bell','Los Hornos','Villa Elvira'], 'Mar del Plata': ['Centro','La Perla','Punta Mogotes'], 'Quilmes': ['Centro','Bernal','Ezpeleta'], 'Tigre': ['Centro','El Talar','Don Torcuato'], 'Bahía Blanca': ['Centro','Ingeniero White','Villa Mitre'] },
  'Santa Fe': { 'Rosario': ['Centro','Pichincha','Palermo','Fisherton','Arroyito','La Florida','Tablada','Echesortu'], 'Santa Fe Capital': ['Centro','Sur','Norte','Oeste','Alto Verde','Candioti'], 'Roldán': ['Centro','Villa Urquiza','Los Girasoles','El Laguito'], 'Rafaela': ['Centro','Norte','Sur','Oeste'], 'Venado Tuerto': ['Centro','Oeste','Este','Norte'] },
  'Córdoba': { 'Córdoba Capital': ['Centro','Nueva Córdoba','Güemes','Cerro de las Rosas','Villa Allende','Argüello'], 'Villa Carlos Paz': ['Centro','Valle Hermoso','San Roque'], 'Río Cuarto': ['Centro','Norte','Sur'] },
  'Mendoza': { 'Mendoza Capital': ['Centro','Godoy Cruz','Guaymallén','Las Heras','Maipú'], 'San Rafael': ['Centro','Rama Caída'], 'Luján de Cuyo': ['Centro','Chacras de Coria'] },
  'Tucumán': { 'San Miguel de Tucumán': ['Centro','Yerba Buena','Banda del Río Salí'], 'Tafí Viejo': ['Centro'] },
  'Entre Ríos': { 'Paraná': ['Centro','Bajada Grande'], 'Concordia': ['Centro','Los Charrúas'], 'Gualeguaychú': ['Centro','Puerto'] },
  'Misiones': { 'Posadas': ['Centro','Itaembé Miní'], 'Oberá': ['Centro'] },
  'Salta': { 'Salta Capital': ['Centro','San Bernardo','Tres Cerritos'] },
  'Neuquén': { 'Neuquén Capital': ['Centro','Confluencia'], 'Bariloche': ['Centro','Melipal','Jardín de Patagonia'] },
  'Chaco': { 'Resistencia': ['Centro','Villa del Parque'] },
}

const RUBROS: Record<string, { emoji: string; subrubros: Record<string, string[]> }> = {
  'Tecnología': { emoji: '💻', subrubros: { 'Celulares': ['Nuevos','Usados','Repuestos','Reparación'], 'Computadoras': ['Notebooks','PC','Tablets'], 'Electrónica': ['TV','Audio','Cámaras'], 'Servicios IT': ['Redes','Software','Soporte'] } },
  'Vehículos':  { emoji: '🚗', subrubros: { 'Autos': ['Sedán','SUV','Pickup','Hatchback'], 'Motos': ['Urbanas','Deportivas','Enduro'], 'Camiones': ['Livianos','Medianos','Pesados'], 'Servicios': ['Mecánica','Chapa y Pintura','Gomería'] } },
  'Propiedades':{ emoji: '🏠', subrubros: { 'Venta': ['Casa','Departamento','Terreno'], 'Alquiler': ['Casa','Departamento','Temporario'], 'Servicios': ['Inmobiliarias','Arquitectos','Construcción'] } },
  'Empleo':     { emoji: '💼', subrubros: { 'Oficios': ['Electricista','Plomero','Pintor','Carpintero'], 'Profesionales': ['Médicos','Abogados','Contadores'], 'Comercio': ['Vendedores','Cajeros','Administración'] } },
  'Servicios':  { emoji: '🔧', subrubros: { 'Hogar': ['Limpieza','Mudanzas','Electricidad'], 'Salud': ['Médicos','Psicólogos','Kinesiólogos'], 'Educación': ['Clases','Idiomas','Música'], 'Belleza': ['Peluquería','Estética','Uñas'] } },
  'Gastronomía':{ emoji: '🍕', subrubros: { 'Comidas': ['Pizzería','Hamburguesas','Sushi','Parrilla'], 'Bebidas': ['Cafetería','Bar','Cervecería'], 'Dulces': ['Pastelería','Helados'] } },
  'Deportes':   { emoji: '⚽', subrubros: { 'Equipamiento': ['Ropa','Calzado','Pelotas'], 'Clases': ['Fútbol','Básquet','Tenis','Pádel'], 'Instalaciones': ['Canchas','Gimnasios','Piletas'] } },
  'Mascotas':   { emoji: '🐾', subrubros: { 'Perros': ['Cachorros','Adultos','Accesorios'], 'Gatos': ['Gatitos','Adultos','Accesorios'], 'Servicios': ['Veterinaria','Peluquería','Guardería'] } },
  'Hogar':      { emoji: '🏡', subrubros: { 'Muebles': ['Living','Dormitorio','Cocina'], 'Electrodomésticos': ['Línea Blanca','Climatización'], 'Decoración': ['Cuadros','Textiles','Plantas'] } },
  'Moda':       { emoji: '👗', subrubros: { 'Ropa': ['Mujer','Hombre','Niños'], 'Calzado': ['Zapatillas','Zapatos','Botas'], 'Accesorios': ['Carteras','Bijouterie','Relojes'] } },
  'Agro':       { emoji: '🌾', subrubros: { 'Producción': ['Cereales','Soja','Girasol'], 'Ganadería': ['Bovinos','Porcinos','Aves'], 'Maquinaria': ['Tractores','Cosechadoras','Implementos'] } },
  'Salud':      { emoji: '🏥', subrubros: { 'Medicina': ['Clínica','Pediatría','Cardiología'], 'Bienestar': ['Yoga','Meditación','Nutrición'], 'Farmacias': ['Medicamentos','Cosmética'] } },
}

// ── Estilos reutilizables ─────────────────────────────────────────────────────

const selectStyle: React.CSSProperties = {
  width: '100%', padding: '13px 40px 13px 14px',
  background: 'rgba(0,0,0,0.4)',
  border: '1px solid rgba(0,210,255,0.2)',
  borderRadius: '12px', color: 'white',
  fontSize: '14px', fontFamily: "'Nunito',sans-serif",
  fontWeight: 700, outline: 'none', cursor: 'pointer',
  appearance: 'none', WebkitAppearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2300D2FF' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center',
  boxSizing: 'border-box', transition: 'border-color 0.2s ease',
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(0,210,255,0.12)',
  borderRadius: '20px',
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
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
  const [focusedInput, setFocusedInput] = useState('')

  const ciudades = provincia ? Object.keys(UBICACIONES[provincia]) : []
  const barrios = ciudad ? UBICACIONES[provincia]?.[ciudad] ?? [] : []
  const subrubros = rubro ? Object.keys(RUBROS[rubro].subrubros) : []
  const filtros = subrubro ? RUBROS[rubro]?.subrubros[subrubro] ?? [] : []
  const canSearch = !!(provincia || rubro || busquedaLibre.trim())

  const totalFiltros = [provincia, ciudad, barrio, rubro, subrubro, filtro].filter(Boolean).length

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
    <div style={{ fontFamily:"'Nunito',sans-serif", maxWidth:'430px', margin:'0 auto', minHeight:'100vh', position:'relative', background:'#030810' }}>

      {/* ── FONDO ── */}
      <div style={{ position:'fixed', top:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:'430px', height:'100vh', backgroundImage:"url('/fondo_pantallas.png')", backgroundSize:'100% 100%', zIndex:0, opacity:0.35 }} />
      <div style={{ position:'fixed', top:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:'430px', height:'100vh', background:'linear-gradient(180deg, rgba(3,8,16,0.97) 0%, rgba(3,8,16,0.75) 50%, rgba(3,8,16,0.97) 100%)', zIndex:1 }} />
      {/* Glow superior cian */}
      <div style={{ position:'fixed', top:'-60px', left:'50%', transform:'translateX(-50%)', width:'280px', height:'280px', background:'radial-gradient(circle, rgba(0,210,255,0.1) 0%, transparent 70%)', zIndex:1, pointerEvents:'none' }} />

      {/* ── CONTENIDO ── */}
      <div style={{ position:'relative', zIndex:2, paddingBottom:'100px' }}>

        {/* ══ HEADER ══ */}
        <div style={{ padding:'52px 20px 0' }}>
          <button onClick={() => router.back()} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.35)', fontSize:'13px', fontWeight:700, padding:0, fontFamily:'inherit', marginBottom:'20px', display:'flex', alignItems:'center', gap:'6px' }}>
            <span style={{ fontSize:'16px' }}>←</span> Volver
          </button>

          {/* Badge */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:'rgba(0,210,255,0.08)', border:'1px solid rgba(0,210,255,0.2)', borderRadius:'20px', padding:'4px 12px 4px 8px', marginBottom:'12px' }}>
            <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#00D2FF', boxShadow:'0 0 6px #00D2FF' }} />
            <span style={{ fontSize:'10px', fontWeight:800, color:'#00D2FF', letterSpacing:'1.5px', textTransform:'uppercase' }}>NexoNet · Buscar</span>
          </div>

          <div style={{ fontSize:'30px', fontWeight:900, color:'white', lineHeight:1.1, marginBottom:'6px', letterSpacing:'-0.5px' }}>
            ¿Qué estás<br />
            <span style={{ color:'#00D2FF' }}>buscando?</span>
          </div>
          <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.35)', fontWeight:600, marginBottom:'24px' }}>
            Filtrá por zona, categoría o escribí directamente
          </div>

          {/* Indicador de filtros activos */}
          {totalFiltros > 0 && (
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px' }}>
              <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#00D2FF', boxShadow:'0 0 8px #00D2FF' }} />
              <span style={{ fontSize:'12px', fontWeight:700, color:'rgba(0,210,255,0.8)' }}>{totalFiltros} filtro{totalFiltros > 1 ? 's' : ''} activo{totalFiltros > 1 ? 's' : ''}</span>
              <button onClick={() => { setProvincia(''); setCiudad(''); setBarrio(''); setRubro(''); setSubrubro(''); setFiltro('') }}
                style={{ fontSize:'11px', fontWeight:700, color:'rgba(255,80,80,0.7)', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', marginLeft:'4px' }}>
                Limpiar todo
              </button>
            </div>
          )}
        </div>

        <div style={{ padding:'0 20px', display:'flex', flexDirection:'column', gap:'12px' }}>

          {/* ══ BÚSQUEDA LIBRE ══ */}
          <div style={cardStyle}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'2px' }}>
              <div style={{ width:'28px', height:'28px', borderRadius:'8px', background:'rgba(0,210,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px' }}>🔍</div>
              <span style={{ fontSize:'11px', fontWeight:800, color:'#00D2FF', letterSpacing:'1.5px', textTransform:'uppercase' }}>Búsqueda libre</span>
            </div>
            <div style={{ position:'relative' }}>
              <input
                type="text"
                placeholder="Ej: plomero, iPhone 14, depto en alquiler..."
                value={busquedaLibre}
                onChange={e => setBusquedaLibre(e.target.value)}
                onFocus={() => setFocusedInput('busqueda')}
                onBlur={() => setFocusedInput('')}
                onKeyDown={e => e.key === 'Enter' && canSearch && handleBuscar()}
                style={{
                  ...selectStyle,
                  backgroundImage: 'none',
                  paddingRight: '16px',
                  border: `1px solid ${focusedInput === 'busqueda' ? 'rgba(0,210,255,0.5)' : 'rgba(0,210,255,0.2)'}`,
                  boxShadow: focusedInput === 'busqueda' ? '0 0 0 3px rgba(0,210,255,0.08)' : 'none',
                }}
              />
            </div>
          </div>

          {/* ══ UBICACIÓN ══ */}
          <div style={cardStyle}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'2px' }}>
              <div style={{ width:'28px', height:'28px', borderRadius:'8px', background:'rgba(0,210,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px' }}>📍</div>
              <span style={{ fontSize:'11px', fontWeight:800, color:'#00D2FF', letterSpacing:'1.5px', textTransform:'uppercase' }}>Ubicación</span>
            </div>

            <div>
              <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)', marginBottom:'6px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px' }}>Provincia</div>
              <select value={provincia} onChange={e => { setProvincia(e.target.value); setCiudad(''); setBarrio('') }} style={selectStyle}>
                <option value="" style={{ background:'#0a1628' }}>Todas las provincias</option>
                {Object.keys(UBICACIONES).map(p => <option key={p} value={p} style={{ background:'#0a1628' }}>{p}</option>)}
              </select>
            </div>

            {provincia && (
              <div>
                <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)', marginBottom:'6px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px' }}>Ciudad / Localidad</div>
                <select value={ciudad} onChange={e => { setCiudad(e.target.value); setBarrio('') }} style={selectStyle}>
                  <option value="" style={{ background:'#0a1628' }}>Todas las ciudades</option>
                  {ciudades.map(c => <option key={c} value={c} style={{ background:'#0a1628' }}>{c}</option>)}
                </select>
              </div>
            )}

            {ciudad && barrios.length > 0 && (
              <div>
                <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)', marginBottom:'6px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px' }}>Barrio <span style={{ color:'rgba(255,255,255,0.2)', fontWeight:600, textTransform:'none' }}>(opcional)</span></div>
                <select value={barrio} onChange={e => setBarrio(e.target.value)} style={selectStyle}>
                  <option value="" style={{ background:'#0a1628' }}>Todos los barrios</option>
                  {barrios.map(b => <option key={b} value={b} style={{ background:'#0a1628' }}>{b}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* ══ RUBRO ══ */}
          <div style={cardStyle}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'2px' }}>
              <div style={{ width:'28px', height:'28px', borderRadius:'8px', background:'rgba(0,210,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px' }}>🗂</div>
              <span style={{ fontSize:'11px', fontWeight:800, color:'#00D2FF', letterSpacing:'1.5px', textTransform:'uppercase' }}>Rubro</span>
            </div>

            <div>
              <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)', marginBottom:'6px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px' }}>Categoría</div>
              <select value={rubro} onChange={e => { setRubro(e.target.value); setSubrubro(''); setFiltro('') }} style={selectStyle}>
                <option value="" style={{ background:'#0a1628' }}>Todos los rubros</option>
                {Object.entries(RUBROS).map(([r, d]) => <option key={r} value={r} style={{ background:'#0a1628' }}>{d.emoji} {r}</option>)}
              </select>
            </div>

            {rubro && (
              <div>
                <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)', marginBottom:'6px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px' }}>Subrubro</div>
                <select value={subrubro} onChange={e => { setSubrubro(e.target.value); setFiltro('') }} style={selectStyle}>
                  <option value="" style={{ background:'#0a1628' }}>Todo {rubro}</option>
                  {subrubros.map(s => <option key={s} value={s} style={{ background:'#0a1628' }}>{s}</option>)}
                </select>
              </div>
            )}

            {subrubro && filtros.length > 0 && (
              <div>
                <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)', marginBottom:'6px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px' }}>Filtro <span style={{ color:'rgba(255,255,255,0.2)', fontWeight:600, textTransform:'none' }}>(opcional)</span></div>
                <select value={filtro} onChange={e => setFiltro(e.target.value)} style={selectStyle}>
                  <option value="" style={{ background:'#0a1628' }}>Todo {subrubro}</option>
                  {filtros.map(f => <option key={f} value={f} style={{ background:'#0a1628' }}>{f}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* ══ BOTÓN BUSCAR ══ */}
          <button
            onClick={handleBuscar}
            disabled={!canSearch}
            style={{
              width:'100%', padding:'17px',
              background: canSearch
                ? 'linear-gradient(135deg, rgba(0,180,255,0.35) 0%, rgba(0,100,200,0.25) 100%)'
                : 'rgba(255,255,255,0.03)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: canSearch
                ? '1px solid rgba(0,210,255,0.55)'
                : '1px solid rgba(255,255,255,0.06)',
              borderRadius:'16px',
              color: canSearch ? 'white' : 'rgba(255,255,255,0.15)',
              fontSize:'16px', fontWeight:900,
              cursor: canSearch ? 'pointer' : 'not-allowed',
              fontFamily:'inherit',
              boxShadow: canSearch ? '0 0 30px rgba(0,180,255,0.2), inset 0 0 20px rgba(0,210,255,0.05)' : 'none',
              textShadow: canSearch ? '0 0 12px rgba(0,210,255,0.6)' : 'none',
              transition:'all 0.25s ease',
              letterSpacing: '0.3px',
            }}
          >
            {canSearch
              ? `🔍 Ver resultados${totalFiltros > 0 ? ` · ${totalFiltros} filtro${totalFiltros > 1 ? 's' : ''}` : ''}`
              : 'Completá al menos un campo'}
          </button>

        </div>
      </div>

      <BottomNav />
    </div>
  )
}
