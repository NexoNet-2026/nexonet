"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";
import InsigniaLogro from "@/app/_components/InsigniaLogro";
import InsigniaReputacion from "@/app/_components/InsigniaReputacion";

const TIPO_COLOR: Record<string,string> = { empresa:"#c0392b", servicio:"#27ae60", grupo:"#3a7bd5", trabajo:"#8e44ad" };
const TIPO_EMOJI: Record<string,string> = { empresa:"🏢", servicio:"🛠️", grupo:"👥", trabajo:"💼" };

export default function PerfilPublico() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.userId as string;

  const [perfil, setPerfil] = useState<any>(null);
  const [miPerfil, setMiPerfil] = useState<any>(null);
  const [anuncios, setAnuncios] = useState<any[]>([]);
  const [nexos, setNexos] = useState<any[]>([]);
  const [repContadores, setRepContadores] = useState<Record<string,number>>({});
  const [promedioResenas, setPromedioResenas] = useState(0);
  const [cantResenas, setCantResenas] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [tabActiva, setTabActiva] = useState<"anuncios"|"nexos">("anuncios");

  useEffect(() => {
    const cargar = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const { data: mp } = await supabase.from("usuarios").select("id,nombre_usuario,bits").eq("id", session.user.id).single();
        setMiPerfil(mp);
      }

      const { data: u } = await supabase.from("usuarios")
        .select("id,nombre_usuario,nombre,apellido,avatar_url,codigo,ciudad,provincia,plan,insignia_logro,bits_totales_acumulados,created_at,vis_personal")
        .eq("id", userId).single();
      if (!u) { router.push("/"); return; }
      setPerfil(u);

      const [
        { data: anus },
        { data: nxs },
        { data: repData },
        { data: resData },
      ] = await Promise.all([
        supabase.from("anuncios").select("id,titulo,precio,moneda,imagenes,ciudad,flash,subrubro_id").eq("usuario_id", userId).eq("estado","activo").order("created_at", { ascending:false }).limit(12),
        supabase.from("nexos").select("id,titulo,tipo,ciudad,avatar_url,estado").eq("usuario_id", userId).eq("estado","activo").order("created_at", { ascending:false }),
        supabase.from("insignias_reputacion").select("tipo").eq("receptor_id", userId),
        supabase.from("nexo_resenas").select("rating").eq("nexo_id", userId),
      ]);

      setAnuncios(anus || []);
      setNexos(nxs || []);

      if (repData) {
        const cont: Record<string,number> = {};
        repData.forEach((r:any) => { cont[r.tipo] = (cont[r.tipo]||0) + 1; });
        setRepContadores(cont);
      }

      // Reseñas de sus nexos
      const nexoIds = (nxs||[]).filter(n => n.tipo==="empresa"||n.tipo==="servicio").map(n=>n.id);
      if (nexoIds.length > 0) {
        const { data: rd } = await supabase.from("nexo_resenas").select("rating").in("nexo_id", nexoIds);
        if (rd && rd.length > 0) {
          const prom = rd.reduce((acc:number,r:any) => acc + r.rating, 0) / rd.length;
          setPromedioResenas(prom);
          setCantResenas(rd.length);
        }
      }

      setCargando(false);
    };
    cargar();
  }, [userId]);

  const INSIGNIAS = [
    { min:0, max:99, nombre:"Nuevo", emoji:"🌱", color:"#6a8aaa" },
    { min:100, max:499, nombre:"Bronce", emoji:"🥉", color:"#cd7f32" },
    { min:500, max:999, nombre:"Plata", emoji:"🥈", color:"#a0a0a0" },
    { min:1000, max:4999, nombre:"Oro", emoji:"🥇", color:"#d4a017" },
    { min:5000, max:9999, nombre:"Platino", emoji:"💎", color:"#8e44ad" },
    { min:10000, max:Infinity, nombre:"Diamante", emoji:"👑", color:"#e74c3c" },
  ];
  const bitsAcum = perfil?.bits_totales_acumulados || 0;
  const insignia = INSIGNIAS.find(i => bitsAcum >= i.min && bitsAcum <= i.max) || INSIGNIAS[0];
  const esMiPerfil = miPerfil?.id === userId;

  if (cargando) return <main style={{ paddingTop:"95px", textAlign:"center", color:"#9a9a9a", fontFamily:"'Nunito',sans-serif" }}>Cargando perfil...</main>;
  if (!perfil) return null;

  return (
    <main style={{ paddingTop:"0", paddingBottom:"100px", background:"#f4f4f2", minHeight:"100vh", fontFamily:"'Nunito',sans-serif" }}>
      <Header />

      {/* HERO */}
      <div style={{ background:"linear-gradient(135deg,#1a2a3a,#243b55)", paddingTop:"95px", padding:"95px 16px 20px" }}>
        <div style={{ display:"flex", gap:"14px", alignItems:"flex-start" }}>
          <div style={{ width:"72px", height:"72px", borderRadius:"50%", background:"linear-gradient(135deg,#d4a017,#f0c040)", overflow:"hidden", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"32px", border:"3px solid rgba(212,160,23,0.4)" }}>
            {perfil.avatar_url ? <img src={perfil.avatar_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : "👤"}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"26px", color:"#fff", letterSpacing:"1px", lineHeight:1.1 }}>
              {perfil.nombre_usuario}
            </div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"14px", color:"#d4a017", letterSpacing:"2px" }}>{perfil.codigo}</div>
            <div style={{ display:"flex", gap:"6px", flexWrap:"wrap", marginTop:"6px", alignItems:"center" }}>
              <span style={{ background:insignia.color, borderRadius:"20px", padding:"2px 10px", fontSize:"10px", fontWeight:900, color:"#fff" }}>
                {insignia.emoji} {insignia.nombre.toUpperCase()}
              </span>
              <InsigniaLogro nivel={perfil.insignia_logro} size="xs" />
              {cantResenas > 0 && (
                <span style={{ background:"rgba(212,160,23,0.15)", border:"1px solid rgba(212,160,23,0.4)", borderRadius:"20px", padding:"2px 10px", fontSize:"10px", fontWeight:800, color:"#d4a017" }}>
                  ⭐ {promedioResenas.toFixed(1)} ({cantResenas})
                </span>
              )}
            </div>
            {(perfil.ciudad || perfil.provincia) && (
              <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.55)", fontWeight:600, marginTop:"6px" }}>
                📍 {[perfil.ciudad, perfil.provincia].filter(Boolean).join(", ")}
              </div>
            )}
            {Object.values(repContadores).reduce((a:number,b:number)=>a+b,0) > 0 && (
              <div style={{ marginTop:"8px" }}>
                <InsigniaReputacion contadores={repContadores} size="xs" />
              </div>
            )}
          </div>
        </div>

        {/* BOTONES */}
        {!esMiPerfil && miPerfil && (
          <div style={{ display:"flex", gap:"8px", marginTop:"16px" }}>
            <button onClick={() => router.push(`/chat/${userId}`)}
              style={{ flex:1, background:"linear-gradient(135deg,#d4a017cc,#d4a017)", border:"none", borderRadius:"12px", padding:"11px", fontSize:"13px", fontWeight:900, color:"#fff", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
              💬 Enviar mensaje
            </button>
          </div>
        )}
        {esMiPerfil && (
          <button onClick={() => router.push("/usuario")}
            style={{ marginTop:"12px", width:"100%", background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:"12px", padding:"10px", fontSize:"13px", fontWeight:800, color:"#fff", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
            ✏️ Editar mi perfil
          </button>
        )}
      </div>

      {/* STATS */}
      <div style={{ background:"#1a2a3a", padding:"12px 16px 0", display:"flex", gap:"0", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
        {[
          { label:"Anuncios", value:anuncios.length, emoji:"📣" },
          { label:"Nexos",    value:nexos.length,    emoji:"🏢" },
          { label:"Reseñas",  value:cantResenas,     emoji:"⭐" },
        ].map(s => (
          <div key={s.label} style={{ flex:1, textAlign:"center", padding:"10px 4px" }}>
            <div style={{ fontSize:"20px", fontFamily:"'Bebas Neue',sans-serif", color:"#d4a017" }}>{s.value}</div>
            <div style={{ fontSize:"10px", fontWeight:700, color:"rgba(255,255,255,0.45)", textTransform:"uppercase" }}>{s.emoji} {s.label}</div>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div style={{ background:"#1a2a3a", display:"flex", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
        {[
          { key:"anuncios", label:"📣 Anuncios" },
          { key:"nexos",    label:"🏢 Nexos" },
        ].map(t => (
          <button key={t.key} onClick={() => setTabActiva(t.key as any)}
            style={{ flex:1, background:"none", border:"none", padding:"10px", fontSize:"13px", fontWeight:800, color:tabActiva===t.key?"#d4a017":"rgba(255,255,255,0.4)", cursor:"pointer", fontFamily:"'Nunito',sans-serif", borderBottom:tabActiva===t.key?"3px solid #d4a017":"3px solid transparent" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding:"14px 16px", maxWidth:"600px", margin:"0 auto" }}>

        {/* ANUNCIOS */}
        {tabActiva === "anuncios" && (
          <div>
            {anuncios.length === 0 ? (
              <div style={{ textAlign:"center", padding:"50px 20px", background:"#fff", borderRadius:"16px" }}>
                <div style={{ fontSize:"40px", marginBottom:"12px" }}>📣</div>
                <div style={{ fontSize:"14px", fontWeight:800, color:"#1a2a3a" }}>Sin anuncios activos</div>
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
                {anuncios.map(a => (
                  <div key={a.id} onClick={() => router.push(`/anuncios/${a.id}`)}
                    style={{ background:"#fff", borderRadius:"14px", overflow:"hidden", boxShadow:"0 2px 10px rgba(0,0,0,0.07)", cursor:"pointer" }}>
                    <div style={{ height:"110px", background:"linear-gradient(135deg,#1a2a3a,#243b55)", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      {a.imagenes?.[0] ? <img src={a.imagenes[0]} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <span style={{ fontSize:"36px", opacity:0.3 }}>📦</span>}
                    </div>
                    <div style={{ padding:"10px 12px" }}>
                      <div style={{ fontSize:"12px", fontWeight:800, color:"#1a2a3a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.titulo}</div>
                      {a.precio ? <div style={{ fontSize:"13px", fontWeight:900, color:"#d4a017", marginTop:"2px" }}>{a.moneda==="USD"?"U$D":"$"} {a.precio?.toLocaleString("es-AR")}</div> : <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600, marginTop:"2px" }}>Consultar</div>}
                      {a.ciudad && <div style={{ fontSize:"10px", color:"#9a9a9a", fontWeight:600, marginTop:"2px" }}>📍 {a.ciudad}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* NEXOS */}
        {tabActiva === "nexos" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
            {nexos.length === 0 ? (
              <div style={{ textAlign:"center", padding:"50px 20px", background:"#fff", borderRadius:"16px" }}>
                <div style={{ fontSize:"40px", marginBottom:"12px" }}>🏢</div>
                <div style={{ fontSize:"14px", fontWeight:800, color:"#1a2a3a" }}>Sin nexos públicos</div>
              </div>
            ) : nexos.map(n => (
              <div key={n.id} onClick={() => router.push(`/nexo/${n.id}`)}
                style={{ background:"#fff", borderRadius:"14px", overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,0.06)", cursor:"pointer", display:"flex", alignItems:"stretch", border:`2px solid ${TIPO_COLOR[n.tipo] || "#e8e8e6"}20` }}>
                <div style={{ width:"64px", flexShrink:0, background:`${TIPO_COLOR[n.tipo] || "#e8e8e6"}20`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"24px", overflow:"hidden" }}>
                  {n.avatar_url ? <img src={n.avatar_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : TIPO_EMOJI[n.tipo] || "✨"}
                </div>
                <div style={{ flex:1, padding:"12px 14px" }}>
                  <div style={{ fontSize:"10px", fontWeight:800, color:TIPO_COLOR[n.tipo]||"#9a9a9a", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"2px" }}>{n.tipo}</div>
                  <div style={{ fontSize:"14px", fontWeight:900, color:"#1a2a3a" }}>{n.titulo}</div>
                  {n.ciudad && <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600, marginTop:"2px" }}>📍 {n.ciudad}</div>}
                </div>
                <div style={{ display:"flex", alignItems:"center", paddingRight:"12px", color:"#d4a017", fontSize:"18px" }}>›</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </main>
  );
}
