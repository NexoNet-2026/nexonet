"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const sp = useSearchParams();
  const otroId = params?.userId as string;
  const nexoId = sp.get("nexo");

  const [perfil, setPerfil] = useState<any>(null);
  const [otro, setOtro] = useState<any>(null);
  const [nexo, setNexo] = useState<any>(null);
  const [mensajes, setMensajes] = useState<any[]>([]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cargar = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }

      const [{ data: u }, { data: o }] = await Promise.all([
        supabase.from("usuarios").select("*").eq("id", session.user.id).single(),
        supabase.from("usuarios").select("id,nombre,nombre_usuario,avatar_url,codigo").eq("id", otroId).single(),
      ]);
      setPerfil(u);
      setOtro(o);

      if (nexoId) {
        const { data: n } = await supabase.from("nexos").select("id,titulo,avatar_url,tipo").eq("id", nexoId).single();
        setNexo(n);
      }

      // Cargar mensajes entre los dos usuarios
      const { data: msgs } = await supabase.from("mensajes")
        .select("*")
        .or(`and(emisor_id.eq.${session.user.id},receptor_id.eq.${otroId}),and(emisor_id.eq.${otroId},receptor_id.eq.${session.user.id})`)
        .order("created_at", { ascending: true })
        .limit(100);
      setMensajes(msgs || []);

      // Marcar como leídos
      await supabase.from("mensajes")
        .update({ leido: true })
        .eq("receptor_id", session.user.id)
        .eq("emisor_id", otroId)
        .eq("leido", false);

      setCargando(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    };
    cargar();
  }, [otroId]);

  useEffect(() => {
    if (!perfil) return;
    const canal = supabase.channel(`chat_${[perfil.id, otroId].sort().join("_")}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "mensajes",
        filter: `receptor_id=eq.${perfil.id}`,
      }, async (payload) => {
        if (payload.new.emisor_id === otroId) {
          setMensajes(prev => [...prev, payload.new]);
          await supabase.from("mensajes").update({ leido: true }).eq("id", payload.new.id);
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(canal); };
  }, [perfil, otroId]);

  const enviar = async () => {
    if (!texto.trim() || !perfil || enviando) return;
    setEnviando(true);
    const { data: nuevo } = await supabase.from("mensajes").insert({
      emisor_id: perfil.id,
      receptor_id: otroId,
      texto: texto.trim(),
      leido: false,
      nexo_id: nexoId || null,
    }).select().single();
    if (nuevo) setMensajes(prev => [...prev, nuevo]);
    // Notificar al receptor
    await supabase.from("notificaciones").insert({
      usuario_id: otroId,
      emisor_id: perfil.id,
      tipo: "mensaje",
      mensaje: `💬 ${perfil.nombre_usuario}: ${texto.trim().slice(0, 60)}`,
      leida: false,
      nexo_id: nexoId || null,
    });
    setTexto("");
    setEnviando(false);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  if (cargando) return <main style={{ paddingTop:"95px", textAlign:"center", color:"#9a9a9a", fontFamily:"'Nunito',sans-serif" }}>Cargando chat...</main>;

  const TIPO_COLOR: Record<string,string> = { empresa:"#c0392b", servicio:"#27ae60", grupo:"#3a7bd5", trabajo:"#8e44ad", anuncio:"#d4a017" };
  const nexoColor = nexo ? (TIPO_COLOR[nexo.tipo] || "#d4a017") : "#d4a017";

  return (
    <main style={{ paddingTop:"0", paddingBottom:"0", background:"#f4f4f2", minHeight:"100vh", fontFamily:"'Nunito',sans-serif", display:"flex", flexDirection:"column" }}>
      <Header />

      {/* HEADER CHAT */}
      <div style={{ position:"sticky", top:"60px", zIndex:100, background:"#1a2a3a", padding:"12px 16px", display:"flex", alignItems:"center", gap:"12px", boxShadow:"0 2px 12px rgba(0,0,0,0.25)" }}>
        <button onClick={() => router.back()} style={{ background:"rgba(255,255,255,0.1)", border:"none", borderRadius:"10px", padding:"7px 12px", color:"#fff", fontSize:"13px", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>←</button>
        <div style={{ width:"40px", height:"40px", borderRadius:"50%", background:"linear-gradient(135deg,#243b55,#1a2a3a)", overflow:"hidden", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px" }}>
          {otro?.avatar_url ? <img src={otro.avatar_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : "👤"}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:"14px", fontWeight:900, color:"#fff" }}>{otro?.nombre_usuario || otro?.nombre || "Usuario"}</div>
          {nexo && <div style={{ fontSize:"11px", color:nexoColor, fontWeight:700 }}>re: {nexo.titulo}</div>}
        </div>
      </div>

      {/* MENSAJES */}
      <div style={{ flex:1, overflowY:"auto", padding:"14px 16px", display:"flex", flexDirection:"column", gap:"8px", paddingBottom:"80px", marginTop:"0" }}>
        {mensajes.length === 0 && (
          <div style={{ textAlign:"center", padding:"60px 20px", color:"#9a9a9a" }}>
            <div style={{ fontSize:"48px", marginBottom:"12px" }}>💬</div>
            <div style={{ fontSize:"15px", fontWeight:800, color:"#1a2a3a", marginBottom:"6px" }}>Iniciá la conversación</div>
            <div style={{ fontSize:"12px", fontWeight:600 }}>Los mensajes son privados</div>
          </div>
        )}
        {mensajes.map((m: any) => {
          const esMio = m.emisor_id === perfil?.id;
          return (
            <div key={m.id} style={{ display:"flex", flexDirection:esMio?"row-reverse":"row", alignItems:"flex-end", gap:"8px" }}>
              <div style={{ maxWidth:"75%", display:"flex", flexDirection:"column", alignItems:esMio?"flex-end":"flex-start" }}>
                <div style={{
                  background: esMio ? "linear-gradient(135deg,#d4a017cc,#d4a017)" : "#fff",
                  borderRadius: esMio ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                  padding: "10px 14px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}>
                  <div style={{ fontSize:"14px", fontWeight:600, color:esMio?"#fff":"#2c2c2e", lineHeight:1.5 }}>{m.texto}</div>
                </div>
                <div style={{ fontSize:"10px", color:"#bbb", fontWeight:600, marginTop:"3px" }}>
                  {new Date(m.created_at).toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"})}
                  {esMio && <span style={{ marginLeft:"4px" }}>{m.leido ? "✓✓" : "✓"}</span>}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div style={{ position:"fixed", bottom:"60px", left:0, right:0, background:"#fff", borderTop:"1px solid #e8e8e6", padding:"10px 14px", display:"flex", gap:"8px", alignItems:"flex-end", zIndex:100 }}>
        <textarea value={texto} onChange={e => setTexto(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); } }}
          placeholder="Escribí un mensaje..." rows={1} maxLength={500}
          style={{ flex:1, border:"2px solid #e8e8e6", borderRadius:"14px", padding:"10px 14px", fontSize:"14px", fontFamily:"'Nunito',sans-serif", outline:"none", resize:"none" }} />
        <button onClick={enviar} disabled={enviando || !texto.trim()}
          style={{ width:"44px", height:"44px", borderRadius:"50%", background:texto.trim()?"linear-gradient(135deg,#d4a017cc,#d4a017)":"#f4f4f2", border:"none", cursor:texto.trim()?"pointer":"default", fontSize:"18px", flexShrink:0 }}>
          {enviando ? "⏳" : "➤"}
        </button>
      </div>

      <BottomNav />
    </main>
  );
}
