"use client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Mensaje = {
  id: number;
  texto: string;
  emisor_id: string;
  receptor_id: string;
  leido: boolean;
  created_at: string;
};

function formatHora(ts: string) {
  const d = new Date(ts);
  const hoy = new Date();
  const esHoy = d.toDateString() === hoy.toDateString();
  const ayer = new Date(hoy); ayer.setDate(hoy.getDate()-1);
  const esAyer = d.toDateString() === ayer.toDateString();
  const hora = d.toLocaleTimeString("es-AR", { hour:"2-digit", minute:"2-digit" });
  if (esHoy) return hora;
  if (esAyer) return `Ayer ${hora}`;
  return `${d.toLocaleDateString("es-AR", { day:"numeric", month:"short" })} ${hora}`;
}

export default function ChatPage() {
  const params  = useParams();
  const router  = useRouter();
  // URL: /chat/[anuncio_id]/[usuario_id]
  const anuncioId  = Number(params.anuncio_id);
  const otroUserId = params.usuario_id as string;

  const [session,   setSession]   = useState<any>(null);
  const [mensajes,  setMensajes]  = useState<Mensaje[]>([]);
  const [texto,     setTexto]     = useState("");
  const [enviando,  setEnviando]  = useState(false);
  const [anuncio,   setAnuncio]   = useState<any>(null);
  const [otroUser,  setOtroUser]  = useState<any>(null);
  const [loading,   setLoading]   = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/login"); return; }
    setSession(session);

    // Cargar anuncio
    const { data: an } = await supabase.from("anuncios").select("id,titulo,imagenes,precio,moneda").eq("id", anuncioId).single();
    if (an) setAnuncio(an);

    // Cargar datos del otro usuario
    const { data: u } = await supabase.from("usuarios").select("id,nombre_usuario,codigo,plan").eq("id", otroUserId).single();
    if (u) setOtroUser(u);

    // Cargar mensajes
    await cargarMensajes(session.user.id);

    // Marcar como leídos
    await supabase.from("mensajes")
      .update({ leido: true })
      .eq("anuncio_id", anuncioId)
      .eq("emisor_id", otroUserId)
      .eq("receptor_id", session.user.id);

    setLoading(false);
  };

  const cargarMensajes = async (myId: string) => {
    const { data } = await supabase
      .from("mensajes")
      .select("*")
      .eq("anuncio_id", anuncioId)
      .or(`and(emisor_id.eq.${myId},receptor_id.eq.${otroUserId}),and(emisor_id.eq.${otroUserId},receptor_id.eq.${myId})`)
      .order("created_at", { ascending: true });

    setMensajes(data || []);
  };

  // Realtime subscription
  useEffect(() => {
    if (!session) return;
    const canal = supabase
      .channel(`chat-${anuncioId}-${session.user.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "mensajes",
        filter: `anuncio_id=eq.${anuncioId}`,
      }, async (payload) => {
        const nuevo = payload.new as Mensaje;
        const involucrado = nuevo.emisor_id === session.user.id || nuevo.receptor_id === session.user.id;
        if (involucrado) {
          await cargarMensajes(session.user.id);
          if (nuevo.emisor_id === otroUserId) {
            await supabase.from("mensajes").update({ leido: true }).eq("id", nuevo.id);
          }
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(canal); };
  }, [session]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  const enviar = async () => {
    if (!texto.trim() || !session || enviando) return;
    setEnviando(true);

    // Cobrar 1 BIT al emisor
    const { data: wallet } = await supabase
      .from("usuarios")
      .select("bits, bits_free, bits_promo")
      .eq("id", session.user.id)
      .single();

    if (!wallet || (wallet.bits_free + wallet.bits_promo + wallet.bits) < 1) {
      alert("No tenés BIT suficientes");
      setEnviando(false);
      return;
    }

    let restante = 1;
    const updates: { bits_free?: number; bits_promo?: number; bits?: number } = {};

    if (wallet.bits_free > 0) {
      const desc = Math.min(wallet.bits_free, restante);
      updates.bits_free = wallet.bits_free - desc;
      restante -= desc;
    }
    if (restante > 0 && wallet.bits_promo > 0) {
      const desc = Math.min(wallet.bits_promo, restante);
      updates.bits_promo = wallet.bits_promo - desc;
      restante -= desc;
    }
    if (restante > 0 && wallet.bits > 0) {
      const desc = Math.min(wallet.bits, restante);
      updates.bits = wallet.bits - desc;
      restante -= desc;
    }

    await supabase.from("usuarios").update(updates).eq("id", session.user.id);

    const msg = texto.trim();
    setTexto("");
    await supabase.from("mensajes").insert({
      anuncio_id:  anuncioId,
      emisor_id:   session.user.id,
      receptor_id: otroUserId,
      texto:       msg,
    });
    // Notificar al receptor en la campanita
    await supabase.from("notificaciones").insert({
      usuario_id:  otroUserId,
      emisor_id:   session.user.id,
      anuncio_id:  anuncioId,
      tipo:        "mensaje",
      mensaje:     `💬 Nuevo mensaje sobre "${anuncio?.titulo || "un anuncio"}"`,
      leida:       false,
    });
    setEnviando(false);
    inputRef.current?.focus();
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); }
  };

  const fmt = (p: number, m: string) =>
    !p ? "Consultar" : `${m==="USD"?"U$D":"$"} ${p.toLocaleString("es-AR")}`;

  if (loading) return (
    <main style={{ paddingTop:"95px", paddingBottom:"130px", background:"#f4f4f2", minHeight:"100vh", fontFamily:"'Nunito',sans-serif" }}>
      <Header /><div style={{ textAlign:"center", padding:"60px", color:"#9a9a9a", fontWeight:700 }}>Cargando chat...</div><BottomNav />
    </main>
  );

  return (
    <main style={{ paddingTop:"95px", paddingBottom:"0", background:"#f4f4f2", minHeight:"100vh", fontFamily:"'Nunito',sans-serif", display:"flex", flexDirection:"column" }}>
      <Header />

      {/* ── BARRA SUPERIOR CHAT ── */}
      <div style={{ position:"fixed", top:"100px", left:0, right:0, zIndex:90, background:"linear-gradient(135deg,#1a2a3a,#243b55)", padding:"10px 16px", display:"flex", alignItems:"center", gap:"12px", boxShadow:"0 2px 12px rgba(0,0,0,0.3)" }}>
        <button onClick={()=>router.back()} style={{ background:"rgba(255,255,255,0.1)", border:"none", borderRadius:"10px", padding:"6px 10px", color:"#fff", fontSize:"18px", cursor:"pointer" }}>‹</button>

        {/* Avatar */}
        <div style={{ width:"40px", height:"40px", borderRadius:"50%", background:"linear-gradient(135deg,#d4a017,#f0c040)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", flexShrink:0 }}>
          {otroUser?.plan === "nexoempresa" ? "🏢" : "👤"}
        </div>

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:900, fontSize:"14px", color:"#fff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {otroUser?.nombre_usuario || "Usuario"}
          </div>
          <div style={{ fontSize:"11px", color:"#d4a017", fontWeight:700 }}>{otroUser?.codigo}</div>
        </div>

        {/* Chip anuncio */}
        {anuncio && (
          <button onClick={()=>router.push(`/anuncios/${anuncioId}`)} style={{ background:"rgba(212,160,23,0.2)", border:"1px solid rgba(212,160,23,0.4)", borderRadius:"10px", padding:"4px 10px", cursor:"pointer", maxWidth:"120px" }}>
            <div style={{ fontSize:"10px", fontWeight:800, color:"#d4a017", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{anuncio.titulo}</div>
            <div style={{ fontSize:"10px", color:"#8a9aaa", fontWeight:600 }}>{fmt(anuncio.precio, anuncio.moneda)}</div>
          </button>
        )}
      </div>

      {/* ── MENSAJES ── */}
      <div style={{ flex:1, overflowY:"auto", padding:"170px 16px 210px", display:"flex", flexDirection:"column", gap:"4px", background:"#eae6df" }}>
        {/* INFO CONTEXTO */}
        {anuncio && otroUser && (
          <div style={{ background:"rgba(255,255,255,0.8)", borderRadius:"12px", padding:"12px 16px", margin:"0 0 8px", textAlign:"center", border:"1px solid rgba(212,160,23,0.2)" }}>
            <div style={{ fontSize:"12px", fontWeight:800, color:"#1a2a3a" }}>💬 Conversación con <span style={{ color:"#d4a017" }}>{otroUser.nombre_usuario}</span></div>
            <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600 }}>sobre el anuncio 
              <a href={`/anuncios/${anuncioId}`} style={{ color:"#d4a017", fontWeight:800, textDecoration:"none" }}> {anuncio.titulo} →</a>
            </div>
          </div>
        )}
        {mensajes.length === 0 && (
          <div style={{ textAlign:"center", padding:"40px 20px", color:"#9a9a9a" }}>
            <div style={{ fontSize:"40px", marginBottom:"12px" }}>💬</div>
            <div style={{ fontSize:"14px", fontWeight:700, color:"#555" }}>Iniciá la conversación</div>
            <div style={{ fontSize:"12px", marginTop:"6px", color:"#888" }}>Este chat es gratuito y privado entre vos y el anunciante.</div>
          </div>
        )}

        {mensajes.map((m, idx) => {
          const esMio = m.emisor_id === session?.user.id;
          const anterior = mensajes[idx - 1];
          const mismoEmisor = anterior?.emisor_id === m.emisor_id;
          const diff = anterior ? (new Date(m.created_at).getTime() - new Date(anterior.created_at).getTime()) / 60000 : 999;
          const showTime = !mismoEmisor || diff > 10;

          return (
            <div key={m.id} style={{ display:"flex", flexDirection:"column", alignItems: esMio ? "flex-end" : "flex-start", marginTop: showTime ? "12px" : "2px" }}>
              {showTime && (
                <div style={{ fontSize:"11px", color:"#888", fontWeight:600, marginBottom:"4px", padding:"2px 10px", background:"rgba(255,255,255,0.6)", borderRadius:"10px", alignSelf:"center" }}>
                  {formatHora(m.created_at)}
                </div>
              )}
              <div style={{
                maxWidth:"78%",
                background: esMio ? "linear-gradient(135deg,#d4a017,#f0c040)" : "#ffffff",
                color: "#1a2a3a",
                borderRadius: esMio ? "18px 4px 18px 18px" : "4px 18px 18px 18px",
                padding:"10px 14px",
                fontSize:"14px",
                fontWeight:600,
                lineHeight:1.5,
                boxShadow: esMio ? "0 2px 6px rgba(212,160,23,0.4)" : "0 1px 4px rgba(0,0,0,0.12)",
                wordBreak:"break-word",
              }}>
                {m.texto}
                <span style={{ fontSize:"10px", color: esMio ? "rgba(26,42,58,0.5)" : "#aaa", float:"right", marginLeft:"8px", marginTop:"4px", display:"block", textAlign:"right" }}>
                  {formatHora(m.created_at)}{esMio && (m.leido ? " ✓✓" : " ✓")}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* ── INPUT ── */}
      <div style={{ position:"fixed", bottom:"130px", left:0, right:0, background:"#fff", borderTop:"1px solid #e8e8e6", padding:"10px 16px", display:"flex", gap:"10px", alignItems:"flex-end", boxShadow:"0 -4px 16px rgba(0,0,0,0.08)" }}>
        <textarea
          ref={inputRef}
          value={texto}
          onChange={e => setTexto(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
          maxLength={500}
          placeholder="Escribí tu mensaje..."
          style={{ flex:1, border:"2px solid #e8e8e6", borderRadius:"20px", padding:"10px 16px", fontSize:"14px", fontFamily:"'Nunito',sans-serif", color:"#1a2a3a", outline:"none", resize:"none", maxHeight:"100px", overflowY:"auto", lineHeight:1.5 }}
        />
        <button
          onClick={enviar}
          disabled={!texto.trim() || enviando}
          style={{ width:"44px", height:"44px", borderRadius:"50%", background:texto.trim() ? "linear-gradient(135deg,#f0c040,#d4a017)" : "#f0f0f0", border:"none", cursor:texto.trim() ? "pointer" : "not-allowed", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px", flexShrink:0, boxShadow:texto.trim() ? "0 3px 0 #a07810" : "none", transition:"all 0.15s" }}
        >
          {enviando ? "⏳" : "➤"}
        </button>
      </div>

      <BottomNav />
    </main>
  );
}
