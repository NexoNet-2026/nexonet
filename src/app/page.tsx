export default function Home() {
  const rubros = [
    { emoji: "💻", nombre: "Tecnología", color: "#00BCD4", subrubros: ["📱 Celulares", "💻 Laptops", "🖥️ PC", "📷 Cámaras", "🎧 Audio", "⌚ Smartwatch", "🎮 Gaming", "🖨️ Impresoras"] },
    { emoji: "🚗", nombre: "Vehículos", color: "#FF6B35", subrubros: ["🚙 Autos", "🏍️ Motos", "🚛 Camiones", "🚐 Utilitarios", "🚜 Maquinaria", "⛵ Náutica", "🚲 Bicicletas", "🛺 Accesorios"] },
    { emoji: "🏠", nombre: "Propiedades", color: "#00A650", subrubros: ["🏡 Casas", "🏢 Dptos", "🌳 Terrenos", "🏭 Comercial", "🏖️ Countries", "🏗️ Obras", "🔑 Alquiler", "🏚️ PH"] },
    { emoji: "💼", nombre: "Empleo", color: "#3483FA", subrubros: ["⏰ Full Time", "🕐 Part Time", "💻 Remoto", "🎓 Pasantías", "👔 Gerencial", "🔧 Técnico", "🎨 Creativo", "📊 Ventas"] },
    { emoji: "👥", nombre: "Comunidad", color: "#9C27B0", subrubros: ["🏘️ Barrios", "🏢 Consorcios", "⛪ Iglesias", "🎭 Cultura", "🤝 ONGs", "🏫 Colegios", "👨‍👩‍👧 Familias", "🌐 Redes"] },
    { emoji: "🎓", nombre: "Educación", color: "#FF9800", subrubros: ["📚 Primaria", "🏫 Secundaria", "🎓 Univ.", "💻 Online", "🎨 Talleres", "🏋️ Deportes", "🎵 Música", "🗣️ Idiomas"] },
    { emoji: "⚽", nombre: "Deportes", color: "#4CAF50", subrubros: ["⚽ Fútbol", "🏀 Básquet", "🎾 Tenis", "🏓 Pádel", "🏊 Natación", "🐴 Equitación", "🥊 Artes Marc.", "🚴 Ciclismo"] },
    { emoji: "🎉", nombre: "Eventos", color: "#E91E63", subrubros: ["🎂 Cumpleaños", "💒 Bodas", "🎸 Recitales", "🎪 Fiestas", "🏆 Torneos", "🎭 Teatro", "🍽️ Cenas", "📸 Sesiones"] },
    { emoji: "🏭", nombre: "Industria", color: "#607D8B", subrubros: ["⚙️ Metalmec.", "🧪 Química", "🪵 Madera", "🧱 Construcc.", "⚡ Energía", "🌱 Agroquím.", "🚚 Transporte", "♻️ Reciclado"] },
    { emoji: "🌾", nombre: "Agro", color: "#8BC34A", subrubros: ["🌽 Cereales", "🐄 Ganadería", "🍇 Fruticultura", "🌿 Aromáticas", "🐓 Avicultura", "🐖 Porcinos", "🚜 Maquinaria", "💧 Riego"] },
    { emoji: "🐾", nombre: "Mascotas", color: "#FF7043", subrubros: ["🐕 Perros", "🐈 Gatos", "🐟 Peces", "🐦 Aves", "🐇 Conejos", "🦎 Reptiles", "🏥 Veterinaria", "✂️ Peluquería"] },
    { emoji: "🏡", nombre: "Hogar", color: "#795548", subrubros: ["🛋️ Muebles", "🔨 Herramientas", "🌿 Jardín", "🍳 Cocina", "🛁 Baño", "💡 Iluminación", "🧹 Limpieza", "🔐 Seguridad"] },
    { emoji: "👗", nombre: "Moda", color: "#EC407A", subrubros: ["👕 Ropa", "👟 Calzado", "👜 Carteras", "💍 Bijouterie", "🧴 Cosmética", "🕶️ Accesorios", "👔 Formal", "🧣 Temporada"] },
    { emoji: "🛠️", nombre: "Servicios", color: "#5C6BC0", subrubros: ["🔧 Plomería", "⚡ Electricidad", "🎨 Pintura", "🌿 Jardinería", "🏠 Limpieza", "❄️ AC", "🚪 Cerrajería", "🖥️ Informática"] },
    { emoji: "🚦", nombre: "Com. Vial", color: "#F44336", subrubros: ["🚗 Mecánica", "🔧 Taller", "🛞 Gomería", "🎨 Chapa/Pint.", "🚗 Lavadero", "⛽ GNC", "📋 VTV", "🏍️ Motos"] },
    { emoji: "🛣️", nombre: "Serv. Ruta", color: "#FF5722", subrubros: ["🚛 Flete", "📦 Mudanzas", "🚐 Combis", "✈️ Remises", "🏕️ Camping", "⛽ Combustible", "🛏️ Hospedaje", "🍔 Parador"] },
    { emoji: "🍽️", nombre: "Gastronomía", color: "#FFA726", subrubros: ["🍕 Pizzería", "🍔 Hamburgues.", "🍣 Sushi", "☕ Cafetería", "🍺 Bar", "🌮 Empanadas", "🎂 Pastelería", "🥗 Dietético"] },
    { emoji: "💊", nombre: "Salud", color: "#26A69A", subrubros: ["🏥 Medicina", "🦷 Odontología", "💆 Bienestar", "🧘 Yoga", "🏋️ Gym", "💊 Farmacia", "🧪 Laboratorio", "👁️ Óptica"] },
    { emoji: "✈️", nombre: "Turismo", color: "#42A5F5", subrubros: ["🏨 Hotel", "🏕️ Camping", "✈️ Vuelos", "🚌 Excursiones", "🏖️ Playas", "🏔️ Sierras", "🗺️ Agencias", "📷 Tours"] },
    { emoji: "📦", nombre: "Logística", color: "#78909C", subrubros: ["🚛 Flete", "📦 Depósito", "🏭 Distribución", "📮 Correo", "🔄 Importación", "📊 Inventario", "🚐 Última milla", "❄️ Frigorífico"] },
    { emoji: "💰", nombre: "Finanzas", color: "#66BB6A", subrubros: ["🏦 Bancos", "💳 Seguros", "📈 Inversiones", "💱 Cambio", "📋 Contable", "⚖️ Legal", "🏠 Hipotecas", "📊 Asesoría"] },
    { emoji: "🤝", nombre: "Solidaridad", color: "#AB47BC", subrubros: ["🍽️ Comedor", "👕 Ropa", "📚 Útiles", "🩺 Salud", "🐾 Animales", "🏚️ Vivienda", "👴 Adultos May.", "🌱 Ambiente"] },
    { emoji: "🏪", nombre: "Comercios", color: "#FFA000", subrubros: ["🛒 Supermercado", "🔧 Ferretería", "💊 Farmacia", "👗 Ropa", "🍕 Pizzería", "💈 Peluquería", "🏦 Banco", "📱 Celulares"] },
    { emoji: "🔬", nombre: "Serv. Prof.", color: "#29B6F6", subrubros: ["⚖️ Abogados", "🧮 Contadores", "🏗️ Arquitectos", "💻 Sistemas", "📢 Marketing", "🎨 Diseño", "📊 Consultoras", "🔬 Ingeniería"] },
    { emoji: "👶", nombre: "Niñez", color: "#EF9A9A", subrubros: ["🍼 Bebés", "🎒 Escolar", "🎮 Juguetes", "👕 Ropa Niños", "🏫 Jardín", "🎨 Talleres", "🏋️ Deportes", "🎂 Cumples"] },
    { emoji: "🎭", nombre: "Arte y Ent.", color: "#CE93D8", subrubros: ["🎵 Música", "🎨 Pintura", "🎭 Teatro", "📸 Fotografía", "🎬 Cine", "📚 Libros", "🎤 Bandas", "🎪 Shows"] },
  ];

  const grupos = [
    { emoji: "⚽", nombre: "Deportivos", color: "#4CAF50" },
    { emoji: "🏪", nombre: "Comerciales", color: "#FF9800" },
    { emoji: "🧘", nombre: "Bienestar", color: "#26A69A" },
    { emoji: "🔧", nombre: "Fierreros", color: "#607D8B" },
    { emoji: "🐴", nombre: "Equitación", color: "#795548" },
    { emoji: "🏓", nombre: "Pádel", color: "#42A5F5" },
    { emoji: "🏢", nombre: "Consorcios", color: "#5C6BC0" },
    { emoji: "🏘️", nombre: "Barrio", color: "#66BB6A" },
  ];

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", background: "#F0F2F5", maxWidth: "390px", margin: "0 auto", minHeight: "100vh" }}>

      {/* HEADER FIJO */}
      <div style={{
        position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: "390px", zIndex: 100,
        background: "linear-gradient(180deg, #050d1a 0%, #0a1628 50%, #0f2040 100%)",
        padding: "14px 16px", boxShadow: "0 4px 20px rgba(0,0,0,0.4)"
      }}>
        {/* Logo + iconos */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <div>
            <div style={{ fontSize: "24px", fontWeight: 900, color: "white" }}>
              Nexo<span style={{ color: "#FFE600" }}>Net</span>
            </div>
            <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.45)", letterSpacing: "1.5px", textTransform: "uppercase" }}>
              Argentina · Hiper-local
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              🔔
            </div>
            <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              👤
            </div>
          </div>
        </div>

        {/* Ubicación */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "8px 12px", marginBottom: "10px" }}>
          <span>📍</span>
          <span style={{ flex: 1, fontSize: "13px", fontWeight: 700, color: "white" }}>Roldán, Santa Fe</span>
          <span style={{ fontSize: "11px", color: "#FFE600", fontWeight: 700 }}>Cambiar ›</span>
        </div>

        {/* Búsqueda */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "white", borderRadius: "8px", padding: "10px 12px" }}>
          <span>🔍</span>
          <input
            type="text"
            placeholder="¿Qué estás buscando en Roldán?"
            style={{ background: "none", border: "none", outline: "none", fontFamily: "inherit", fontSize: "14px", width: "100%" }}
          />
          <button style={{ background: "#FFE600", border: "none", borderRadius: "6px", padding: "6px 12px", fontFamily: "inherit", fontSize: "12px", fontWeight: 800, cursor: "pointer" }}>
            Buscar
          </button>
        </div>
      </div>

      {/* SPACER para el header fijo */}
      <div style={{ height: "174px" }} />

      {/* GRUPOS */}
      <div style={{ background: "#0a1628", padding: "14px 0 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 16px 10px" }}>
          <span style={{ fontSize: "14px", fontWeight: 800, color: "white" }}>👥 Grupos NexoNet</span>
          <span style={{ fontSize: "11px", color: "#FFE600", fontWeight: 700 }}>Ver todos ›</span>
        </div>
        <div style={{ display: "flex", gap: "10px", overflowX: "auto", padding: "0 16px 2px" }}>
          {grupos.map((g, i) => (
            <div key={i} style={{ flexShrink: 0, width: "80px", display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", cursor: "pointer", padding: "10px 6px 8px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: "12px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", background: `${g.color}30`, border: `2px solid ${g.color}60` }}>
                {g.emoji}
              </div>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "white", textAlign: "center" }}>{g.nombre}</span>
              <span style={{ fontSize: "9px", fontWeight: 800, color: "#FFE600" }}>Unirse</span>
            </div>
          ))}
        </div>
      </div>

      {/* 26 RUBROS */}
      {rubros.map((rubro, i) => (
        <div key={i}>
          <div style={{ height: "8px", background: "#E4E6EA" }} />
          <div style={{ background: "white" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px 10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "15px", fontWeight: 800 }}>
                <div style={{ width: "9px", height: "9px", borderRadius: "50%", background: rubro.color }} />
                {rubro.emoji} {rubro.nombre}
              </div>
              <span style={{ fontSize: "12px", color: "#3483FA", fontWeight: 700, cursor: "pointer" }}>Ver todos ›</span>
            </div>
            <div style={{ display: "flex", gap: "10px", overflowX: "auto", padding: "0 16px 14px" }}>
              {rubro.subrubros.map((sub, j) => (
                <div key={j} style={{ flexShrink: 0, width: "78px", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", cursor: "pointer", padding: "10px 6px 8px", background: "white", border: "1.5px solid #E4E6EA", borderRadius: "12px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                  <div style={{ width: "46px", height: "46px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", background: `${rubro.color}18`, border: `1.5px solid ${rubro.color}40` }}>
                    {sub.split(" ")[0]}
                  </div>
                  <span style={{ fontSize: "9.5px", fontWeight: 700, color: "#555", textAlign: "center", lineHeight: 1.2 }}>
                    {sub.split(" ").slice(1).join(" ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* BOTTOM NAV */}
      <div style={{ height: "80px" }} />
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "390px", background: "white", borderTop: "1px solid #E4E6EA", display: "flex", justifyContent: "space-around", padding: "8px 0 18px", boxShadow: "0 -4px 12px rgba(0,0,0,0.08)" }}>
        {[["🔍", "Buscar"], ["➕", "Publicar"], ["🏠", "Inicio"], ["💬", "Chat"], ["👤", "Perfil"]].map(([icon, label], i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", cursor: "pointer", padding: "4px 10px" }}>
            <span style={{ fontSize: "22px" }}>{icon}</span>
            <span style={{ fontSize: "10px", color: i === 2 ? "#3483FA" : "#bbb", fontWeight: 700 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
