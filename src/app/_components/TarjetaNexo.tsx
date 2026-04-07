"use client";

export default function TarjetaNexo({ nexo, onClick, esPrimero, color, abierto, modoConexion, seleccionado, onToggle }: any) {
  const colorTipo = color || "#3a7bd5";
  const esGrupo = nexo.tipo === "grupo";
  const nombreCreador = nexo.owner_nombre || nexo.usuarios?.nombre_usuario || nexo.usuarios?.nombre || "NexoNet";
  return (
    <div onClick={modoConexion ? onToggle : onClick} style={{ width:"190px", minWidth:"190px", flexShrink:0, cursor:"pointer", position:"relative" }}>
      {esPrimero && (
        <div style={{ position:"absolute", top:"-6px", right:"-4px", zIndex:2, background:"linear-gradient(135deg,#ff6b00,#ff4500)", borderRadius:"8px", padding:"2px 7px", fontSize:"10px", fontWeight:900, color:"#fff" }}>🔥</div>
      )}
      {modoConexion && <div style={{position:"absolute",inset:0,zIndex:10,borderRadius:"14px",border:`3px solid ${seleccionado?"#d4a017":"rgba(212,160,23,0.4)"}`,background:seleccionado?"rgba(212,160,23,0.15)":"transparent",transition:"all .15s",pointerEvents:"none"}} />}
      {modoConexion && (
        <div style={{position:"absolute",top:"8px",right:"8px",zIndex:11,width:"24px",height:"24px",borderRadius:"50%",background:seleccionado?"#d4a017":"rgba(255,255,255,0.9)",border:`2px solid ${seleccionado?"#d4a017":"#ccc"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px",boxShadow:"0 2px 6px rgba(0,0,0,0.2)"}}>
          {seleccionado && <span style={{color:"#fff",fontWeight:900}}>✓</span>}
        </div>
      )}
      <div style={{ background:"#fff", borderRadius:"14px", overflow:"hidden", boxShadow: abierto === true ? "0 0 16px #00ff8855, 0 2px 10px rgba(0,0,0,0.08)" : abierto === false ? "0 0 16px #ff224433, 0 2px 10px rgba(0,0,0,0.08)" : "0 2px 10px rgba(0,0,0,0.08)", border: abierto === true ? "2px solid #00ff88" : abierto === false ? "2px solid #ff2244" : "1px solid #f0f0f0" }}>
        <div style={{ background:colorTipo, padding:"4px 8px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:"10px", fontWeight:900, color:"#fff", textTransform:"uppercase", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"120px" }}>
            {nombreCreador}
          </span>
          <span style={{ fontSize:"9px", fontWeight:800, color:"rgba(255,255,255,0.8)", textTransform:"uppercase", flexShrink:0 }}>{nexo.tipo}</span>
          {abierto === true && <span style={{ fontSize:"9px", fontWeight:900, color:"#00ff88", marginLeft:"4px", background:"rgba(0,255,136,0.15)", borderRadius:"4px", padding:"1px 5px" }}>● ABIERTO</span>}
          {abierto === false && <span style={{ fontSize:"9px", fontWeight:900, color:"#ff6688", marginLeft:"4px", background:"rgba(255,34,68,0.15)", borderRadius:"4px", padding:"1px 5px" }}>● CERRADO</span>}
        </div>
        <div style={{ height:"120px", background:"#e8e8e6", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center" }}>
          {nexo.avatar_url
            ? <img src={nexo.avatar_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            : <span style={{ fontSize:"40px", opacity:0.3 }}>{ esGrupo ? "👥" : "🏢" }</span>
          }
        </div>
        <div style={{ padding:"8px 10px 10px" }}>
          <div style={{ fontSize:"12px", fontWeight:900, color:"#1a2a3a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{nexo.titulo}</div>
          {nexo.precio && <div style={{ fontSize:"13px", fontWeight:900, color:"#d4a017", marginTop:"2px" }}>$ {Number(nexo.precio).toLocaleString("es-AR")}</div>}
          <div style={{ display:"flex", alignItems:"center", gap:"8px", marginTop:"4px", flexWrap:"wrap" }}>
            {nexo.ciudad && <span style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600 }}>📍 {nexo.ciudad}</span>}
            {esGrupo && <span style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600 }}>👥 {nexo.miembros_count||0}</span>}
            <span style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600 }}>👁️ {nexo.vistas||0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
