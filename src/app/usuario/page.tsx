        {/* ═══ PROMOTOR ═══ */}
        {seccion === "promotor" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
            <div style={{ background:"linear-gradient(135deg,#1a2a3a,#243b55)", borderRadius:"16px", padding:"24px 20px", textAlign:"center" }}>
              <div style={{ fontSize:"40px", marginBottom:"8px" }}>⭐</div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"28px", color:"#d4a017", letterSpacing:"2px", marginBottom:"4px" }}>Nexo Promotor</div>
              <div style={{ fontSize:"13px", color:"#8a9aaa", fontWeight:600, marginBottom:"20px" }}>Ganá el 30% por cada referido que se registre</div>
              <div style={{ background:"rgba(212,160,23,0.15)", borderRadius:"12px", padding:"16px", marginBottom:"8px" }}>
                <div style={{ fontSize:"12px", color:"#8a9aaa", fontWeight:600, marginBottom:"4px" }}>Tu código de promotor</div>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"28px", color:"#d4a017", letterSpacing:"4px" }}>{perfil?.codigo||"---"}</div>
              </div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"36px", color:"#f0c040", marginBottom:"4px" }}>
                {(perfil?.bits_promotor||0).toLocaleString()} BIT
              </div>
              <div style={{ fontSize:"12px", color:"#8a9aaa", fontWeight:600, marginBottom:"6px" }}>
                saldo BIT promotor acumulado
              </div>
              <div style={{ fontSize:"13px", color:(perfil?.bits_promotor||0)>=100000?"#27ae60":"#8a9aaa", fontWeight:700, marginBottom:"20px" }}>
                {(perfil?.bits_promotor||0) >= 100000
                  ? "✅ Ya podés solicitar reembolso en dinero"
                  : `Necesitás 100.000 BIT para solicitar reembolso en dinero`}
              </div>
              <button onClick={()=>router.push("/promotor")} style={BTN}>⭐ Ver página de Promotor</button>
            </div>
          </div>
        )}
