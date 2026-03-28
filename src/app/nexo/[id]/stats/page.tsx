"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

const COLOR_TIPO: Record<string, string> = {
  empresa: "#c0392b", servicio: "#27ae60", grupo: "#3a7bd5", anuncio: "#d4a017", trabajo: "#8e44ad",
};

export default function NexoStatsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [nexo, setNexo] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }

      const { data: n } = await supabase.from("nexos").select("*").eq("id", id).single();
      if (!n) { router.push("/"); return; }

      const esOwner = n.usuario_id === session.user.id;
      if (!esOwner) {
        const { data: mm } = await supabase.from("nexo_miembros")
          .select("rol").eq("nexo_id", id).eq("usuario_id", session.user.id).maybeSingle();
        if (!mm || !["creador","admin","moderador"].includes(mm.rol)) {
          router.push(`/nexo/${id}`); return;
        }
      }
      setNexo(n);

      const hoy = new Date();
      const en7dias = new Date(hoy.getTime() + 7 * 86400000).toISOString();

      const [
        { data: todasVisitas },
        { data: miembros },
        { data: sliderItems },
        { data: bitsPromoData },
        { data: conexionesIA },
        { data: flashData },
        { data: ownerData },
      ] = await Promise.all([
        supabase.from("nexo_visitas").select("visitante_id, fecha").eq("nexo_id", id),
        supabase.from("nexo_miembros").select("estado, vence_el, usuario_id").eq("nexo_id", id).eq("estado", "activo"),
        supabase.from("nexo_slider_items").select("id, titulo, descargas, activo, vence_el").eq("nexo_id" as any, id),
        supabase.from("bits_promo_descargas").select("bits_recibidos").eq("nexo_id", id).eq("usuario_id", n.usuario_id),
        supabase.from("busqueda_matches").select("id").eq("anuncio_id" as any, id),
        supabase.from("nexo_flash_envios").select("id, cantidad_destinatarios, bits_consumidos").eq("nexo_id", id),
        supabase.from("usuarios").select("bits_promotor_total").eq("id", n.usuario_id).single(),
      ]);

      const miembrosPorVencer = (miembros || []).filter((m: any) => m.vence_el && new Date(m.vence_el) <= new Date(en7dias));
      let miembrosConNombre: any[] = [];
      if (miembrosPorVencer.length > 0) {
        const uids = miembrosPorVencer.map((m: any) => m.usuario_id);
        const { data: usrs } = await supabase.from("usuarios").select("id, nombre_usuario").in("id", uids);
        const uMap: Record<string,string> = Object.fromEntries((usrs||[]).map((u:any) => [u.id, u.nombre_usuario]));
        miembrosConNombre = miembrosPorVencer.map((m: any) => ({ nombre_usuario: uMap[m.usuario_id] || "---", vence_el: m.vence_el }));
      }

      const visitasArr = todasVisitas || [];
      const descargasArr = sliderItems || [];

      setStats({
        visitasTotal: visitasArr.length,
        visitantesUnicos: new Set(visitasArr.map((v: any) => v.visitante_id)).size,
        miembrosActivos: (miembros || []).length,
        adjuntosTotal: descargasArr.length,
        adjuntosActivos: descargasArr.filter((i: any) => i.activo !== false).length,
        descargasTotal: descargasArr.reduce((acc: number, i: any) => acc + (i.descargas || 0), 0),
        bitsPromoGanados: (ownerData as any)?.bits_promotor_total || (bitsPromoData||[]).reduce((acc:number,b:any)=>acc+(b.bits_recibidos||0),0),
        conexionesIA: (conexionesIA||[]).length,
        flashEnviados: (flashData||[]).length,
        vencimientoNexo: n.siguiente_pago || null,
        adjuntosConVencimiento: descargasArr.filter((i:any)=>i.vence_el).sort((a:any,b:any)=>new Date(a.vence_el).getTime()-new Date(b.vence_el).getTime()).map((i:any)=>({ titulo:i.titulo||"Adjunto", vence_el:i.vence_el })),
        miembrosPorVencer: miembrosConNombre,
      });
      setCargando(false);
    };
    cargar();
  }, [id]);

  const color = nexo ? (COLOR_TIPO[nexo.tipo] || "#d4a017") : "#d4a017";
  const diasRestantes = (fecha: string) => Math.ceil((new Date(fecha).getTime() - Date.now()) / 86400000);
  const formatFecha = (f: string) => new Date(f).toLocaleDateString("es-AR", { day:"2-digit", month:"2-digit", year:"2-digit" });

  if (cargando) return <main style={{ paddingTop:"95px", textAlign:"center", color:"#9a9a9a", fontFamily:"'Nunito',sans-serif" }}>Cargando estadísticas...</main>;
  if (!stats || !nexo) return null;

  const StatCard = ({ emoji, label, value, sub, color: c }: any) => (
    <div style={{ background:"#fff", borderRadius:"16px", padding:"16px", boxShadow:"0 2px 10px rgba(0,0,0,0.06)", display:"flex", flexDirection:"column", gap:"4px" }}>
      <div style={{ fontSize:"22px" }}>{emoji}</div>
      <div style={{ fontSize:"22px", fontWeight:900, color:c||"#1a2a3a", fontFamily:"'Bebas Neue',sans-serif", letterSpacing:"1px" }}>{value}</div>
      <div style={{ fontSize:"11px", fontWeight:800, color:"#1a2a3a", textTransform:"uppercase", letterSpacing:"0.5px" }}>{label}</div>
      {sub && <div style={{ fontSize:"10px", fontWeight:600, color:"#9a9a9a" }}>{sub}</div>}
    </div>
  );

  const SectionTitle = ({ title }: { title: string }) => (
    <div style={{ fontSize:"11px", fontWeight:900, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"1px", marginTop:"8px", marginBottom:"4px" }}>{title}</div>
  );

  return (
    <main style={{ paddingTop:"0", paddingBottom:"100px", background:"#f4f4f2", minHeight:"100vh", fontFamily:"'Nunito',sans-serif" }}>
      <Header />
      <div style={{ background:"linear-gradient(135deg,#1a2a3a,#243b55)", paddingTop:"95px", padding:"95px 16px 20px" }}>
        <button onClick={()=>router.push(`/nexo/${id}/admin`)}
          style={{ background:"rgba(255,255,255,0.1)", border:"none", borderRadius:"10px", padding:"7px 14px", fontSize:"12px", fontWeight:800, color:"#fff", cursor:"pointer", fontFamily:"'Nunito',sans-serif", marginBottom:"14px" }}>
          ← Volver al admin
        </button>
        <div style={{ fontSize:"11px", fontWeight:700, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"1px" }}>📊 Estadísticas</div>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"28px", color:"#fff", letterSpacing:"1px" }}>{nexo.titulo}</div>
      </div>

      <div style={{ padding:"16px", maxWidth:"600px", margin:"0 auto", display:"flex", flexDirection:"column", gap:"8px" }}>

        {stats.vencimientoNexo && (() => {
          const dias = diasRestantes(stats.vencimientoNexo);
          const vencido = dias <= 0;
          const urgente = dias <= 5 && !vencido;
          return (
            <div style={{ background:vencido?"rgba(231,76,60,0.1)":urgente?"rgba(230,126,34,0.1)":"rgba(39,174,96,0.08)", border:`1.5px solid ${vencido?"rgba(231,76,60,0.4)":urgente?"rgba(230,126,34,0.4)":"rgba(39,174,96,0.3)"}`, borderRadius:"14px", padding:"14px 16px" }}>
              <div style={{ fontSize:"12px", fontWeight:900, color:vencido?"#e74c3c":urgente?"#e67e22":"#27ae60" }}>
                {vencido?"⚠️ Plan vencido":urgente?`⏰ Plan vence en ${dias} día${dias!==1?"s":""}`:"✅ Plan activo"}
              </div>
              <div style={{ fontSize:"11px", fontWeight:600, color:"#9a9a9a", marginTop:"2px" }}>Próximo pago: {formatFecha(stats.vencimientoNexo)}</div>
            </div>
          );
        })()}

        <SectionTitle title="Visitas" />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
          <StatCard emoji="👁️" label="Visitas totales" value={stats.visitasTotal} color={color} />
          <StatCard emoji="👤" label="Visitantes únicos" value={stats.visitantesUnicos} color={color} />
        </div>

        <SectionTitle title="Miembros y Conexiones" />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px" }}>
          <StatCard emoji="✅" label="Miembros activos" value={stats.miembrosActivos} />
          <StatCard emoji="🤖" label="Conexiones IA" value={stats.conexionesIA} color="#8e44ad" />
          <StatCard emoji="⚡" label="Flash enviados" value={stats.flashEnviados} color="#e67e22" />
        </div>

        <SectionTitle title="BIT Economía" />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
          <StatCard emoji="💸" label="BIT consumidos" value={stats.visitasTotal} color="#e74c3c" sub="1 BIT por visita" />
          <StatCard emoji="💰" label="BIT Promo ganados" value={stats.bitsPromoGanados} color="#27ae60" sub="Total histórico" />
        </div>

        <SectionTitle title="Archivos adjuntos" />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px" }}>
          <StatCard emoji="📎" label="Total adjuntos" value={stats.adjuntosTotal} />
          <StatCard emoji="🟢" label="Activos" value={stats.adjuntosActivos} color="#27ae60" />
          <StatCard emoji="📥" label="Descargas" value={stats.descargasTotal} color={color} />
        </div>

        {stats.adjuntosConVencimiento.length > 0 && (
          <>
            <SectionTitle title="Vencimientos de adjuntos" />
            {stats.adjuntosConVencimiento.map((a: any, i: number) => {
              const dias = diasRestantes(a.vence_el);
              const vencido = dias <= 0;
              return (
                <div key={i} style={{ background:"#fff", borderRadius:"12px", padding:"12px 14px", display:"flex", justifyContent:"space-between", alignItems:"center", boxShadow:"0 2px 8px rgba(0,0,0,0.05)" }}>
                  <div style={{ fontSize:"13px", fontWeight:800, color:"#1a2a3a" }}>📎 {a.titulo}</div>
                  <div style={{ fontSize:"11px", fontWeight:900, color:vencido?"#e74c3c":dias<=5?"#e67e22":"#27ae60", background:vencido?"rgba(231,76,60,0.1)":dias<=5?"rgba(230,126,34,0.1)":"rgba(39,174,96,0.1)", borderRadius:"8px", padding:"3px 10px" }}>
                    {vencido?"Vencido":`${dias}d`}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {stats.miembrosPorVencer.length > 0 && (
          <>
            <SectionTitle title="Membresías por vencer (7 días)" />
            {stats.miembrosPorVencer.map((m: any, i: number) => {
              const dias = diasRestantes(m.vence_el);
              return (
                <div key={i} style={{ background:"#fff", borderRadius:"12px", padding:"12px 14px", display:"flex", justifyContent:"space-between", alignItems:"center", boxShadow:"0 2px 8px rgba(0,0,0,0.05)" }}>
                  <div style={{ fontSize:"13px", fontWeight:800, color:"#1a2a3a" }}>👤 {m.nombre_usuario}</div>
                  <div style={{ fontSize:"11px", fontWeight:900, color:dias<=0?"#e74c3c":"#e67e22", background:dias<=0?"rgba(231,76,60,0.1)":"rgba(230,126,34,0.1)", borderRadius:"8px", padding:"3px 10px" }}>
                    {dias<=0?"Vencido":`${dias}d — ${formatFecha(m.vence_el)}`}
                  </div>
                </div>
              );
            })}
          </>
        )}

      </div>
      <BottomNav />
    </main>
  );
}
