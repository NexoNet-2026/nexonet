"use client";

export default function TarjetaNexo({ nexo, onClick, esPrimero, color }: any) {
  const colorTipo = color || "#3a7bd5";
  return (
    <div onClick={onClick} style={{ width:"190px", minWidth:"190px", flexShrink:0, cursor:"pointer", position:"relative" }}>
      {esPrimero && (
        <div style={{ position:"absolute", top:"-6px", right:"-4px", zIndex:2, background:"linear-gradient(135deg,#ff6b00,#ff4500)", borderRadius:"8px", padding:"2px 7px", fontSize:"10px", fontWeight:900, color:"#fff" }}>🔥</div>
      )}
      <div style={{ background:"#fff", borderRadius:"14px", overflow:"hidden", boxShadow:"0 2px 10px rgba(0,0,0,0.08)", border:`1px solid #f0f0f0` }}>
        <div style={{ background:colorTipo, padding:"4px 8px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:"10px", fontWeight:900, color:"#fff", textTransform:"uppercase", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"120px" }}>
            {nexo.usuarios?.nombre_usuario || nexo.usuarios?.nombre || "NexoNet"}
          </span>
          <span style={{ fontSize:"9px", fontWeight:800, color:"rgba(255,255,255,0.8)", textTransform:"uppercase", flexShrink:0 }}>{nexo.tipo}</span>
        </div>
        <div style={{ height:"120px", background:"#e8e8e6", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center" }}>
          {nexo.avatar_url
            ? <img src={nexo.avatar_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            : <span style={{ fontSize:"40px", opacity:0.3 }}>🏢</span>
          }
        </div>
        <div style={{ padding:"8px 10px" }}>
          <div style={{ fontSize:"12px", fontWeight:900, color:"#1a2a3a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{nexo.titulo}</div>
          {nexo.precio && <div style={{ fontSize:"13px", fontWeight:900, color:"#d4a017", marginTop:"2px" }}>$ {Number(nexo.precio).toLocaleString("es-AR")}</div>}
          {nexo.ciudad && <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600, marginTop:"2px" }}>📍 {nexo.ciudad}</div>}
        </div>
      </div>
    </div>
  );
}
