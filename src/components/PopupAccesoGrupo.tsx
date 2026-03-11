"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Props = {
  grupo: {
    id: number;
    nombre: string;
    tipo: "abierto" | "cerrado";
    config?: any;
  };
  userId: string;
  onClose: () => void;
  onExito: () => void;
};

export default function PopupAccesoGrupo({ grupo, userId, onClose, onExito }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [exito,   setExito]   = useState(false);

  const modelo       = grupo.config?.modelo_acceso || "solicitud_libre";
  const esAbierto    = grupo.tipo === "abierto";

  // ¿Tiene invitación FREE pendiente?
  const [tieneInvFree, setTieneInvFree] = useState<boolean|null>(null);
  useState(()=>{
    supabase.from("grupo_invitaciones")
      .select("id,canon_gratis")
      .eq("grupo_id", grupo.id)
      .eq("invitado_id", userId)
      .eq("estado", "pendiente")
      .single()
      .then(({data})=>{
        setTieneInvFree(data?.canon_gratis === true);
      });
  });

  const costo = tieneInvFree ? "GRATIS" : "$500";
  const quienPaga = tieneInvFree
    ? "✅ Tenés una invitación gratuita asignada por el grupo"
    : esAbierto
      ? "💳 El costo de acceso ($500) estará a tu cargo"
      : modelo === "invitacion_gratis"
        ? "🎁 Si el administrador aprueba, el costo lo asume el grupo"
        : modelo === "invitacion_miembro"
          ? "💳 Si el administrador aprueba, el costo ($500) estará a tu cargo"
          : "⚙️ El administrador decidirá quién paga al aprobar tu solicitud";

  const textoBoton = esAbierto
    ? `Unirme al grupo — ${costo}`
    : "Enviar solicitud de acceso";

  const accion = async () => {
    setLoading(true);

    if (esAbierto) {
      // Grupo abierto: entra directo (pago pendiente)
      await supabase.from("grupo_miembros").upsert({
        grupo_id:     grupo.id,
        usuario_id:   userId,
        rol:          "miembro",
        estado:       tieneInvFree ? "activo" : "pendiente_pago",
        canon_gratis: tieneInvFree || false,
        bits_grupo:   tieneInvFree || false,
      }, { onConflict: "grupo_id,usuario_id" });

      // Incrementar contador
      await supabase.rpc("incrementar_miembros", { gid: grupo.id }).catch(()=>
        supabase.from("grupos").update({ miembros_count: (grupo as any).miembros_count + 1 }).eq("id", grupo.id)
      );
    } else {
      // Grupo cerrado: crear solicitud
      const yaExiste = await supabase.from("grupo_miembros")
        .select("id,estado")
        .eq("grupo_id", grupo.id)
        .eq("usuario_id", userId)
        .single();

      if (!yaExiste.data) {
        await supabase.from("grupo_miembros").insert({
          grupo_id:     grupo.id,
          usuario_id:   userId,
          rol:          "miembro",
          estado:       "pendiente",
          canon_gratis: tieneInvFree || false,
          bits_grupo:   false,
        });
      }

      // Notificar al creador
      const { data: g } = await supabase.from("grupos").select("creador_id").eq("id", grupo.id).single();
      if (g?.creador_id) {
        await supabase.from("notificaciones").insert({
          usuario_id: g.creador_id,
          emisor_id:  userId,
          tipo:       "solicitud_grupo",
          mensaje:    `Solicitud de acceso al grupo "${grupo.nombre}"`,
        }).then(()=>{}).catch(()=>{});
      }
    }

    setLoading(false);
    setExito(true);
    setTimeout(()=>{ onExito(); }, 2500);
  };

  return (
    <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"flex-end",padding:"16px"}}>
      <div style={{width:"100%",background:"#fff",borderRadius:"20px 20px 16px 16px",padding:"24px 20px 28px",boxShadow:"0 -8px 40px rgba(0,0,0,0.3)",fontFamily:"'Nunito',sans-serif"}}>

        {exito ? (
          <div style={{textAlign:"center",padding:"20px 0"}}>
            <div style={{fontSize:"52px",marginBottom:"12px"}}>{esAbierto?"🎉":"📨"}</div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"24px",color:"#1a2a3a",letterSpacing:"1px",marginBottom:"8px"}}>
              {esAbierto ? "¡Bienvenido al grupo!" : "¡Solicitud enviada!"}
            </div>
            <div style={{fontSize:"13px",color:"#9a9a9a",fontWeight:600,lineHeight:1.6}}>
              {esAbierto
                ? tieneInvFree
                  ? "Tu invitación gratuita fue aplicada. Ya podés acceder al grupo."
                  : "Tu acceso está pendiente de pago. Te llegará el link de $500."
                : "El administrador revisará tu solicitud y te notificará la respuesta."}
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"20px"}}>
              <div style={{flex:1,paddingRight:"12px"}}>
                <div style={{fontSize:"11px",fontWeight:800,color:"#d4a017",textTransform:"uppercase",letterSpacing:"1px",marginBottom:"4px"}}>
                  {esAbierto ? "🔓 Grupo abierto" : "🔒 Grupo cerrado"}
                </div>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"22px",color:"#1a2a3a",letterSpacing:"1px",lineHeight:1.2}}>
                  {esAbierto ? "Unirme al grupo" : "Solicitar acceso"}
                </div>
                <div style={{fontSize:"13px",fontWeight:700,color:"#9a9a9a",marginTop:"2px"}}>{grupo.nombre}</div>
              </div>
              <button onClick={onClose} style={{background:"#f0f0f0",border:"none",borderRadius:"50%",width:"34px",height:"34px",fontSize:"16px",cursor:"pointer",flexShrink:0}}>✕</button>
            </div>

            {/* Info del proceso */}
            <div style={{background:"linear-gradient(135deg,#1a2a3a,#243b55)",borderRadius:"16px",padding:"16px",marginBottom:"16px"}}>
              {esAbierto ? (
                <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
                  <Paso num="1" texto="Confirmás tu solicitud de acceso" done/>
                  <Paso num="2" texto={tieneInvFree ? "Invitación FREE aplicada ✅" : "Se genera el link de pago de $500"} done={!!tieneInvFree}/>
                  <Paso num="3" texto="Accedés al contenido del grupo" />
                </div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
                  <Paso num="1" texto="Enviás tu solicitud" done/>
                  <Paso num="2" texto="El administrador la revisa y aprueba o rechaza"/>
                  <Paso num="3" texto={
                    tieneInvFree ? "Acceso gratuito con tu invitación FREE ✅"
                    : modelo==="invitacion_gratis" ? "Si aprueban: el grupo paga los $500"
                    : modelo==="invitacion_miembro" ? "Si aprueban: te llega el link de pago $500"
                    : "El administrador define quién paga al aprobar"
                  }/>
                </div>
              )}
            </div>

            {/* Quién paga */}
            <div style={{background:tieneInvFree?"rgba(0,168,132,0.08)":"rgba(212,160,23,0.08)",border:`2px solid ${tieneInvFree?"rgba(0,168,132,0.3)":"rgba(212,160,23,0.3)"}`,borderRadius:"12px",padding:"12px 14px",marginBottom:"20px"}}>
              <div style={{fontSize:"12px",fontWeight:700,color:tieneInvFree?"#00a884":"#a07810",lineHeight:1.5}}>{quienPaga}</div>
            </div>

            {/* Botón */}
            <button onClick={accion} disabled={loading} style={{width:"100%",background:loading?"#f0f0f0":"linear-gradient(135deg,#f0c040,#d4a017)",border:"none",borderRadius:"14px",padding:"15px",fontSize:"15px",fontWeight:900,color:loading?"#bbb":"#1a2a3a",cursor:loading?"not-allowed":"pointer",fontFamily:"'Nunito',sans-serif",boxShadow:loading?"none":"0 4px 0 #a07810",marginBottom:"10px"}}>
              {loading ? "Procesando..." : textoBoton}
            </button>
            <button onClick={onClose} style={{width:"100%",background:"none",border:"none",padding:"10px",fontSize:"13px",fontWeight:700,color:"#9a9a9a",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>
              Cancelar
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Paso({num,texto,done}:{num:string;texto:string;done?:boolean}) {
  return(
    <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
      <div style={{width:"24px",height:"24px",borderRadius:"50%",background:done?"#d4a017":"rgba(255,255,255,0.1)",border:`2px solid ${done?"#d4a017":"rgba(255,255,255,0.2)"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        {done
          ? <span style={{fontSize:"12px",color:"#1a2a3a",fontWeight:900}}>✓</span>
          : <span style={{fontSize:"10px",color:"rgba(255,255,255,0.5)",fontWeight:800}}>{num}</span>}
      </div>
      <span style={{fontSize:"12px",fontWeight:done?800:600,color:done?"#f0c040":"rgba(255,255,255,0.6)",lineHeight:1.4}}>{texto}</span>
    </div>
  );
}
