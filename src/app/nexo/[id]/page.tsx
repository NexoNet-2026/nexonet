// v3 - fix esAdmin y hero padding
"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";
import PopupCompra, { MetodoPago } from "@/components/PopupCompra";
import FlashEnvio from "@/components/nexo/FlashEnvio";
import { isNexoAbierto } from "@/lib/horarios";
import ResenaWidget, { EstrellasMini } from "@/components/nexo/ResenaWidget";
import InsigniaLogro from "@/app/_components/InsigniaLogro";
import InsigniaReputacion from "@/app/_components/InsigniaReputacion";
import BotonDarInsignia from "@/app/_components/BotonDarInsignia";
import BannerCompartir from "@/components/BannerCompartir";

const TIPO_COLORES: Record<string,string> = {
  anuncio:"#d4a017", empresa:"#c0392b", servicio:"#27ae60", trabajo:"#8e44ad", grupo:"#3a7bd5",
};
const TIPO_EMOJIS: Record<string,string> = {
  anuncio:"📣", empresa:"🏢", servicio:"🛠️", trabajo:"💼", grupo:"👥",
};
const SUBTIPO_EMOJIS: Record<string,string> = {
  emprendimiento:"🚀", curso:"🎓", consorcio:"🏢", deportivo:"⚽",
  estudio:"📚", venta:"🛒", artistas:"🎨", vecinos:"🏘️", generico:"✨",
};

export default function NexoPage() {
  return (
    <Suspense fallback={<div style={{paddingTop:"95px",textAlign:"center",fontFamily:"'Nunito',sans-serif",color:"#9a9a9a"}}>Cargando...</div>}>
      <NexoPageInner />
    </Suspense>
  );
}

function NexoPageInner() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const sliderParam = searchParams?.get("slider");
  const id     = params?.id as string;

  const [nexo,      setNexo]      = useState<any>(null);
  const [páginas,   setpáginas]   = useState<any[]>([]);
  const [items,     setItems]     = useState<Record<string,any[]>>({});
  const [miembros,  setMiembros]  = useState<any[]>([]);
  const [mensajes,  setMensajes]  = useState<any[]>([]);
  const [perfil,    setPerfil]    = useState<any>(null);
  const [miMiembro, setMiMiembro] = useState<any>(null);
  const [tabActiva, setTabActiva] = useState<string>("");
  const [texto,     setTexto]     = useState("");
  const [enviando,  setEnviando]  = useState(false);
  const [cargando,  setCargando]  = useState(true);
  const [waSoporte, setWaSoporte] = useState("5493413251818");
  const [visor,     setVisor]     = useState<any>(null);
  const [pagandoDescarga, setPagandoDescarga] = useState<string|null>(null);
  const [descargasPagadas, setDescargasPagadas] = useState<Set<string>>(new Set());
  const [ownerInsignia, setOwnerInsignia] = useState<string>("ninguna");
  const [repContadores, setRepContadores] = useState<Record<string,number>>({});
  const [renovando, setRenovando] = useState(false);
  const [popupPagoDescarga, setPopupPagoDescarga] = useState<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const tabBarRef = useRef<HTMLDivElement>(null);
  const [horarios, setHorarios] = useState<any[]>([]);
  const [abierto, setAbierto] = useState<boolean | null>(null);
  const [promedioResenas, setPromedioResenas] = useState(0);
  const [cantResenas, setCantResenas] = useState(0);

  useEffect(() => {
    const cargar = async () => {
      const { data:{ session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      const { data: u } = userId ? await supabase.from("usuarios").select("*").eq("id",userId).single() : { data:null };
      setPerfil(u);

      const { data: n } = await supabase.from("nexos")
        .select("*")
        .eq("id", id).single();
      // Always fetch owner data separately to avoid FK join issues
      let ownerData: any = null;
      if (n?.usuario_id) {
        const { data: od } = await supabase.from("usuarios").select("id,nombre,nombre_usuario,codigo,avatar_url,plan,bits,insignia_logro").eq("id", n.usuario_id).single();
        ownerData = od;
      }
      const nexoConOwner = n ? { ...n, usuarios: ownerData } : n;
      setNexo(nexoConOwner);
      if (ownerData?.insignia_logro) setOwnerInsignia(ownerData.insignia_logro);

      // Fetch reputation badges for nexo owner
      if (n?.usuario_id) {
        const { data: repData } = await supabase
          .from("insignias_reputacion")
          .select("tipo")
          .eq("receptor_id", n.usuario_id);
        if (repData) {
          const cont: Record<string,number> = {};
          repData.forEach((r: any) => { cont[r.tipo] = (cont[r.tipo] || 0) + 1; });
          setRepContadores(cont);
        }
      }

      const { data: sls } = await supabase.from("nexo_sliders")
        .select("*").eq("nexo_id", id).eq("activo",true).order("orden");
      // Inyectar chat grupal si está habilitado
      const chatTab = n?.tipo === "grupo" && n?.config?.chat_habilitado
        ? [{ id:"chat_grupal", titulo:"💬 Chat", tipo:"mensajes", nexo_id:id, activo:true, orden:-1 }]
        : [];
      const resenaTab = (n?.tipo === "empresa" || n?.tipo === "servicio")
        ? [{ id:"resenas_tab", titulo:"⭐ Reseñas", tipo:"resenas", nexo_id:id, activo:true, orden:999 }]
        : [];
      const allPages = [...chatTab, ...(sls || []), ...resenaTab];
      setpáginas(allPages);
      if (allPages.length) setTabActiva(allPages[0].id);

      if (userId) {
        const { data: mm } = await supabase.from("nexo_miembros")
          .select("*").eq("nexo_id",id).eq("usuario_id",userId).order("created_at",{ascending:false}).limit(1).maybeSingle();
        setMiMiembro(mm);

        // Descargas pagadas por este usuario
        const { data: pagos } = await supabase.from("nexo_descargas_pagos")
          .select("descarga_id").eq("nexo_id",id).eq("comprador_id",userId);
        setDescargasPagadas(new Set((pagos||[]).map((p:any)=>p.descarga_id)));
      }

      const { data: mbs } = await supabase.from("nexo_miembros")
        .select("*")
        .eq("nexo_id",id).eq("estado","activo").order("created_at");
      if (mbs && mbs.length > 0) {
        // Fetch user data separately (avoids FK join issues with auth.users)
        const uids = mbs.map((m:any) => m.usuario_id).filter(Boolean);
        const { data: usrs } = await supabase.from("usuarios").select("id,nombre,nombre_usuario,codigo,avatar_url,plan").in("id", uids);
        if (usrs) {
          const uMap: Record<string,any> = Object.fromEntries(usrs.map((u:any) => [u.id, u]));
          mbs.forEach((m:any) => { m.usuarios = uMap[m.usuario_id] || null; });
        }
      }
      setMiembros(mbs||[]);

      // Cobrar 1 BIT al dueño por visita de tipo empresa (1 vez por usuario por día)
      if (n && n.tipo === "empresa" && userId && n.usuario_id !== userId) {
        const hoy = new Date().toISOString().slice(0, 10);
        const { data: yaVisito } = await supabase.from("nexo_visitas")
          .select("id")
          .eq("nexo_id", id)
          .eq("visitante_id", userId)
          .eq("fecha", hoy)
          .maybeSingle();

        if (!yaVisito) {
          const duenoBits = ownerData?.bits ?? 0;
          if (typeof duenoBits === "number" && duenoBits >= 1) {
            // Registrar visita
            await supabase.from("nexo_visitas").insert({
              nexo_id: id,
              visitante_id: userId,
              fecha: hoy,
            });
            // Descontar 1 BIT al dueño
            await supabase.from("usuarios")
              .update({ bits: duenoBits - 1 })
              .eq("id", n.usuario_id);
          }
        }
      }

      setCargando(false);
      // Fetch horarios para empresa/servicio
      if (n?.tipo === "empresa" || n?.tipo === "servicio") {
        const { data: hs } = await supabase.from("nexo_horarios")
          .select("dia, hora_desde, hora_hasta, cerrado")
          .eq("nexo_id", id).order("dia");
        if (hs && hs.length > 0) {
          setHorarios(hs);
          setAbierto(isNexoAbierto(hs));
        }
      }
      // Fetch promedio reseñas
      if (n?.tipo === "empresa" || n?.tipo === "servicio") {
        const { data: resData } = await supabase.from("nexo_resenas")
          .select("rating").eq("nexo_id", id);
        if (resData && resData.length > 0) {
          const prom = resData.reduce((acc: number, r: any) => acc + r.rating, 0) / resData.length;
          setPromedioResenas(prom);
          setCantResenas(resData.length);
        }
      }
      supabase.from("config_global").select("valor").eq("clave","whatsapp_soporte").single().then(({data})=>{if(data?.valor)setWaSoporte(data.valor);});
    };
    cargar();
  }, [id]);

  // Cargar items al cambiar de tab
  useEffect(() => {
    if (!tabActiva) return;
    const slider = páginas.find(s => s.id === tabActiva);
    if (!slider) return;
    if (items[tabActiva]) return; // ya cargados

    const cargarItems = async () => {
      if (slider.tipo === "mensajes" || slider.tipo === "chat") {
        const { data } = await supabase.from("nexo_mensajes")
          .select("*, usuarios(nombre_usuario,codigo,avatar_url,plan)")
          .eq("nexo_id",id).order("created_at", { ascending:true }).limit(100);
        setMensajes(data||[]);
      } else {
        const { data } = await supabase.from("nexo_slider_items")
          .select("*").eq("slider_id",tabActiva).order("orden");
        setItems(prev => ({ ...prev, [tabActiva]: data||[] }));
      }
    };
    cargarItems();
  }, [tabActiva]);

  useEffect(() => {
    if (páginas.find(s=>s.id===tabActiva)?.tipo === "mensajes") {
      setTimeout(()=>bottomRef.current?.scrollIntoView({behavior:"smooth"}),100);
    }
  }, [mensajes.length, tabActiva]);

  const esAdmin = !!(
    (perfil?.id && nexo?.usuario_id && String(perfil.id) === String(nexo.usuario_id)) ||
    (miMiembro?.estado === "activo" && (miMiembro?.rol === "creador" || miMiembro?.rol === "moderador" || miMiembro?.rol === "admin" || miMiembro?.rol === "admin_pago_pendiente"))
  );
  const esMiembro = miMiembro?.estado === "activo";
  const [solicitandoAdmin, setSolicitandoAdmin] = useState(false);
  const [popupUnirse, setPopupUnirse] = useState(false);
  const [popupPagoAdmin, setPopupPagoAdmin] = useState(false);
  const [popupSolAdmin, setPopupSolAdmin] = useState(false);
  const [popupBaja, setPopupBaja] = useState(false);
  const [motivoBaja, setMotivoBaja] = useState("");
  const [flashOpen, setFlashOpen] = useState(false);
  const [flashItem, setFlashItem] = useState<any>(null);
  const [popupBannerCompartir, setPopupBannerCompartir] = useState(false);
  const colorNexo = TIPO_COLORES[nexo?.tipo] || "#d4a017";
  const emojiNexo = nexo?.subtipo ? SUBTIPO_EMOJIS[nexo.subtipo] : TIPO_EMOJIS[nexo?.tipo] || "✨";

  // Abrir popup pago admin automáticamente desde notificación
  useEffect(() => {
    console.log('PAGO_ADMIN CHECK', searchParams?.get('pago_admin'), miMiembro?.rol);
    if (searchParams?.get("pago_admin") === "1" && miMiembro?.rol === "admin_pago_pendiente") {
      setPopupPagoAdmin(true);
    }
  }, [searchParams, miMiembro]);

  const unirse = async () => {
    if (!perfil) { router.push("/login"); return; }
    const acceso = nexo?.config?.tipo_acceso || "libre";

    if (acceso === "aprobacion") {
      const { data: mm } = await supabase.from("nexo_miembros")
        .insert({ nexo_id:id, usuario_id:perfil.id, rol:"miembro", estado:"pendiente", bits_pagados:0 })
        .select().single();
      setMiMiembro(mm);
      const { data: creadorNexo } = await supabase.from("nexos").select("usuario_id, titulo").eq("id", id).single();
      if (creadorNexo) {
        await supabase.from("notificaciones").insert({ usuario_id: creadorNexo.usuario_id, tipo: "sistema", nexo_id: id, mensaje: "👋 " + perfil.nombre_usuario + " solicitó unirse a \"" + creadorNexo.titulo + "\"", leida: false });
      }
      alert("Tu solicitud fue enviada. El administrador la revisará.");
      return;
    }
    setPopupUnirse(true);
  };

  const confirmarUnirse = async (metodo: MetodoPago) => {
    if (!perfil) return;

    if (metodo === "bit_free") {
      const saldo = perfil.bits_free || 0;
      if (saldo < 500) { alert(`No tenés suficientes BIT Free. Tenés ${saldo}, necesitás 500.`); return; }
      const { error: e1 } = await supabase.from("usuarios").update({ bits_free: saldo - 500, bits_gastados_grupo: (perfil.bits_gastados_grupo||0) + 500 }).eq("id", perfil.id);
      if (e1) { console.error("Error descontando BIT Free:", e1); alert("Error: " + e1.message); return; }
      setPerfil((p:any) => ({...p, bits_free: saldo - 500, bits_gastados_grupo: (p.bits_gastados_grupo||0) + 500}));
    } else {
      const saldo = perfil.bits || 0;
      if (saldo < 500) { alert(`No tenés suficientes BIT Nexo. Tenés ${saldo}, necesitás 500.`); return; }
      const { error: e1 } = await supabase.from("usuarios").update({ bits: saldo - 500, bits_gastados_grupo: (perfil.bits_gastados_grupo||0) + 500 }).eq("id", perfil.id);
      if (e1) { console.error("Error descontando BIT:", e1); alert("Error: " + e1.message); return; }
      setPerfil((p:any) => ({...p, bits: saldo - 500, bits_gastados_grupo: (p.bits_gastados_grupo||0) + 500}));
    }

    // Comisión en cascada via service role
    {
      const { data: current } = await supabase.from("usuarios").select("referido_por").eq("id", perfil.id).single();
      if (current?.referido_por) {
        const { data: promotor } = await supabase.from("usuarios").select("codigo").eq("id", current.referido_por).single();
        if (promotor) {
          const esNAN = promotor.codigo === "NAN-5194178";
          const comision = Math.floor(500 * (esNAN ? 0.30 : 0.20));
          if (comision > 0) {
            await fetch("/api/admin/asignar-bit", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ usuario_id: current.referido_por, columna: "bits_promo", cantidad: comision, nota: "Comisión por unión a grupo" }),
            });
          }
        }
      }
    }

    const { data: mm } = await supabase.from("nexo_miembros")
      .upsert({ nexo_id:id, usuario_id:perfil.id, rol:"miembro", estado:"activo", bits_pagados:500, fecha_pago:new Date().toISOString(), vence_el:new Date(Date.now()+30*24*60*60*1000).toISOString() }, { onConflict:"nexo_id,usuario_id" })
      .select().single();
    setMiMiembro(mm);
    setMiembros(prev => [...prev, {...mm, usuarios:perfil}]);
    const { data: creadorNexo2 } = await supabase.from("nexos").select("usuario_id, titulo").eq("id", id).single();
    if (creadorNexo2) {
      await supabase.from("notificaciones").insert({ usuario_id: creadorNexo2.usuario_id, tipo: "sistema", nexo_id: id, mensaje: "🎉 " + perfil.nombre_usuario + " se unió a \"" + creadorNexo2.titulo + "\"", leida: false });
    }
  };

  const confirmarPagoAdmin = async (metodo: MetodoPago) => {
    if (!perfil || !miMiembro) return;

    if (metodo === "bit_free") {
      const saldo = perfil.bits_free || 0;
      if (saldo < 500) { alert(`No tenés suficientes BIT Free. Tenés ${saldo}, necesitás 500.`); return; }
      const { error: e1 } = await supabase.from("usuarios").update({ bits_free: saldo - 500, bits_gastados_grupo: (perfil.bits_gastados_grupo||0) + 500 }).eq("id", perfil.id);
      if (e1) { console.error("Error descontando BIT Free:", e1); alert("Error: " + e1.message); return; }
      setPerfil((p: any) => ({ ...p, bits_free: saldo - 500, bits_gastados_grupo: (p.bits_gastados_grupo||0) + 500 }));
    } else {
      const saldo = perfil.bits || 0;
      if (saldo < 500) { alert(`No tenés suficientes BIT Nexo. Tenés ${saldo}, necesitás 500.`); return; }
      const { error: e1 } = await supabase.from("usuarios").update({ bits: saldo - 500, bits_gastados_grupo: (perfil.bits_gastados_grupo||0) + 500 }).eq("id", perfil.id);
      if (e1) { console.error("Error descontando BIT:", e1); alert("Error: " + e1.message); return; }
      setPerfil((p: any) => ({ ...p, bits: saldo - 500, bits_gastados_grupo: (p.bits_gastados_grupo||0) + 500 }));
    }
    // Acreditar BIT Promo al admin que aprobó (30% NAN / 20% resto)
    const aprobadorId = miMiembro.aprobado_por || nexo.usuario_id;
    const comisionAdmin = aprobadorId === "f9b23e04-c591-44bf-9efb-51966c30a083" ? 150 : 100;
    await fetch("/api/admin/asignar-bit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario_id: aprobadorId, columna: "bits_promo", cantidad: comisionAdmin, nota: "Comisión por aprobación de admin" }),
    });
    await supabase.from("nexo_miembros").update({ rol: "admin" }).eq("id", miMiembro.id);
    setMiMiembro((m: any) => ({ ...m, rol: "admin" }));
    await supabase.from("notificaciones").insert({
      usuario_id: aprobadorId, tipo: "sistema", nexo_id: nexo.id,
      mensaje: `✅ ${perfil.nombre_usuario} completó el pago y es admin en "${nexo.titulo}"`, leida: false,
    });
  };

  const enviarMensaje = async () => {
    if (!texto.trim() || !perfil || enviando) return;
    setEnviando(true);
    const { data: nuevo } = await supabase.from("nexo_mensajes")
      .insert({ nexo_id:id, usuario_id:perfil.id, texto:texto.trim() })
      .select("*, usuarios(nombre_usuario,codigo,avatar_url,plan)").single();
    if (nuevo) setMensajes(prev=>[...prev,nuevo]);
    setTexto("");
    setEnviando(false);
  };

  const abrirDescarga = async (url: string) => {
    // Intentar URL firmada (funciona si el bucket es privado)
    try {
      const storagePath = url.includes("/nexos/") ? url.split("/nexos/")[1]?.split("?")[0] : null;
      const bucket = url.includes("/nexos-descargas/") ? "nexos-descargas" : "nexos";
      const path = url.includes("/nexos-descargas/") ? url.split("/nexos-descargas/")[1]?.split("?")[0] : storagePath;
      if (path) {
        const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 300);
        if (data?.signedUrl) { window.open(data.signedUrl, "_blank"); return; }
      }
    } catch (_) {}
    // Fallback a URL directa (bucket público)
    window.open(url, "_blank");
  };

  const pagarDescarga = async (descarga: any, metodo?: MetodoPago) => {
    if (!perfil) { router.push("/login"); return; }
    if (metodo === "bit_free") { alert("Las descargas no se pueden pagar con BIT Free"); return; }

    const costo = descarga.precio_bits;
    const saldo = perfil.bits || 0;
    if (saldo < costo) { alert(`No tenés suficientes BIT Nexo. Tenés ${saldo}, necesitás ${costo}.`); return; }

    setPagandoDescarga(descarga.id);
    try {
      const res = await fetch("/api/nexo/pagar-descarga", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comprador_id: perfil.id,
          nexo_id: id,
          descarga_id: descarga.id,
          precio_bits: costo,
        }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Error al pagar descarga"); return; }

      setPerfil((p: any) => ({ ...p, bits: (p.bits || 0) - costo, bits_gastados_adjuntos: (p.bits_gastados_adjuntos || 0) + costo }));
      setDescargasPagadas(prev => new Set([...prev, descarga.id]));
      await abrirDescarga(descarga.url);
    } catch (err: any) {
      console.error("Error inesperado en pagarDescarga:", err);
      alert("Error inesperado: " + (err?.message || "Intentá de nuevo"));
    } finally {
      setPagandoDescarga(null);
    }
  };

  useEffect(() => {
    if (!sliderParam || páginas.length === 0) return;
    const target = páginas.find(s => s.tipo === sliderParam);
    if (target) setTabActiva(target.id);
    const intentar = (intentos: number) => {
      const el = document.getElementById(`slider-${sliderParam}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (intentos > 0) {
        setTimeout(() => intentar(intentos - 1), 400);
      }
    };
    setTimeout(() => intentar(5), 600);
  }, [sliderParam, páginas]);

  if (cargando) return <main style={{ paddingTop:"95px", textAlign:"center", color:"#9a9a9a", fontFamily:"'Nunito',sans-serif" }}>Cargando...</main>;
  if (!nexo)    return <main style={{ paddingTop:"95px", textAlign:"center", color:"#9a9a9a", fontFamily:"'Nunito',sans-serif" }}>Nexo no encontrado</main>;

  const sliderActual = páginas.find(s=>s.id===tabActiva);
  const esChat       = sliderActual?.tipo === "mensajes" || sliderActual?.tipo === "chat";

  return (
    <main style={{ paddingTop:"0", paddingBottom:"90px", background:"#f4f4f2", minHeight:"100vh", fontFamily:"'Nunito',sans-serif" }}>
      <Header />

      {/* HERO CON BANNER */}
      <div style={{ position:"relative", minHeight:"200px", background: nexo.banner_url ? `url(${nexo.banner_url}) center/cover no-repeat` : `linear-gradient(135deg,#1a2a3a,#243b55)`, paddingTop:"95px" }}>
        {nexo.banner_url && <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.52)" }} />}
        <div style={{ position:"relative", zIndex:1, padding:"16px 16px 20px" }}>
          <div style={{ display:"flex", alignItems:"flex-end", gap:"14px" }}>
            <div style={{ width:"72px", height:"72px", borderRadius:"18px", overflow:"hidden", flexShrink:0, border:`3px solid ${colorNexo}60`, background:"#1a2a3a", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"30px" }}>
              {nexo.avatar_url ? <img src={nexo.avatar_url} alt={nexo.titulo} style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : emojiNexo}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:"11px", fontWeight:700, color:"rgba(255,255,255,0.55)", marginBottom:"2px", textTransform:"uppercase", letterSpacing:"1px" }}>
                {TIPO_EMOJIS[nexo.tipo]} {nexo.tipo}{nexo.subtipo?` · ${nexo.subtipo}`:""}
              </div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"26px", color:"#fff", letterSpacing:"1px", lineHeight:1.1 }}>{nexo.titulo}</div>
              <div style={{ display:"flex", alignItems:"center", gap:"6px", flexWrap:"wrap", marginTop:"4px" }}>
                <InsigniaLogro nivel={ownerInsignia} size="xs" />
                <InsigniaReputacion contadores={repContadores} size="xs" />
              </div>
              <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.65)", fontWeight:600, marginTop:"4px", display:"flex", gap:"12px", flexWrap:"wrap" }}>
                {nexo.ciudad && <span>📍 {nexo.ciudad}</span>}
                {nexo.precio && <span style={{ color:colorNexo, fontWeight:800 }}>$ {parseFloat(nexo.precio).toLocaleString("es-AR")} {nexo.moneda}</span>}
                {(nexo.tipo === "empresa" || nexo.tipo === "servicio") && nexo.config?.tipo_factura && (
                  <span style={{ background:"rgba(212,160,23,0.15)", border:"1px solid rgba(212,160,23,0.4)", borderRadius:"20px", padding:"2px 10px", fontSize:"11px", fontWeight:800, color:"#d4a017" }}>
                    🧾 Factura {nexo.config.tipo_factura}
                  </span>
                )}
                {(nexo.tipo === "empresa" || nexo.tipo === "servicio") && nexo.config?.personal_asegurado && (
                  <span style={{ background:"rgba(39,174,96,0.15)", border:"1px solid rgba(39,174,96,0.4)", borderRadius:"20px", padding:"2px 10px", fontSize:"11px", fontWeight:800, color:"#27ae60" }}>
                    👷 Personal asegurado
                  </span>
                )}
                {nexo.tipo==="grupo" && <span>👥 {miembros.length} miembro{miembros.length!==1?"s":""}</span>}
                {(nexo.tipo === "empresa" || nexo.tipo === "servicio") && abierto !== null && (
                  <span style={{
                    background: abierto ? "rgba(0,255,136,0.15)" : "rgba(255,34,68,0.15)",
                    border: `1.5px solid ${abierto ? "#00ff88" : "#ff2244"}`,
                    color: abierto ? "#00ff88" : "#ff4466",
                    borderRadius: "20px", padding: "2px 10px",
                    fontSize: "11px", fontWeight: 900,
                  }}>
                    {abierto ? "● ABIERTO" : "● CERRADO"}
                  </span>
                )}
                {(nexo.tipo === "empresa" || nexo.tipo === "servicio") && cantResenas > 0 && (
                  <EstrellasMini rating={promedioResenas} count={cantResenas} />
                )}
              </div>
              {nexo.usuarios && (
                <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.45)", fontWeight:600, marginTop:"4px" }}>
                  Creado por <span onClick={() => router.push(`/perfil/${nexo.usuario_id}`)} style={{ color:"rgba(255,255,255,0.75)", fontWeight:800, cursor:"pointer", textDecoration:"underline", textDecorationColor:"rgba(255,255,255,0.3)" }}>{nexo.usuarios.nombre || nexo.usuarios.nombre_usuario || "---"}</span>
                </div>
              )}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"6px", flexShrink:0, maxWidth:"120px" }}>
              {perfil?.id === nexo.usuario_id ? (
                <button onClick={()=>setPopupBannerCompartir(true)} style={{ background:"linear-gradient(135deg,#d4a017,#f0c040)", border:"none", borderRadius:"10px", padding:"7px 8px", fontSize:"11px", fontWeight:900, color:"#1a2a3a", cursor:"pointer", fontFamily:"'Nunito',sans-serif", display:"flex", alignItems:"center", justifyContent:"center", gap:"4px" }}>
                  🎨 Compartir banner
                </button>
              ) : (
                <button onClick={async () => {
                  const url = `${window.location.origin}/nexo/${nexo.id}`;
                  if (navigator.share) {
                    await navigator.share({ title: nexo.titulo, text: `Mirá "${nexo.titulo}" en NexoNet`, url });
                  } else {
                    await navigator.clipboard.writeText(url);
                    alert("✅ Link copiado");
                  }
                }} style={{ background:"rgba(58,123,213,0.15)", border:"1px solid rgba(58,123,213,0.4)", borderRadius:"10px", padding:"7px 8px", fontSize:"11px", fontWeight:800, color:"#7fb3f5", cursor:"pointer", fontFamily:"'Nunito',sans-serif", display:"flex", alignItems:"center", justifyContent:"center", gap:"4px" }}>
                  📤 Compartir
                </button>
              )}
              {esAdmin && (
                <button onClick={()=>router.push(`/nexo/${id}/admin`)}
                  style={{ background:`${colorNexo}cc`, border:"none", borderRadius:"10px", padding:"7px 8px", fontSize:"11px", fontWeight:900, color:nexo.tipo==="anuncio"?"#1a2a3a":"#fff", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
                  ⚙️ Admin
                </button>
              )}
              {esAdmin && (
                <button onClick={() => setFlashOpen(true)}
                  style={{ background: "linear-gradient(135deg,#e67e22,#d35400)", border: "none",
                    borderRadius: "10px", padding: "7px 8px", fontSize: "11px", fontWeight: 900,
                    color: "#fff", cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>
                  ⚡ Flash
                </button>
              )}
              {perfil && !esMiembro && !esAdmin && nexo?.tipo !== "grupo" && (() => {
                const limiteAlcanzado = (nexo?.conexiones_recibidas ?? 0) >= (nexo?.limite_conexiones ?? 500);
                return (
                  <button onClick={async () => {
                    if (limiteAlcanzado) { alert("Este nexo alcanzó su límite de conexiones."); return; }
                    if (!perfil) return;
                    const { data: miData } = await supabase.from("usuarios").select("bits,bits_free,bits_promo").eq("id", perfil.id).single();
                    if (!miData) return;
                    const totalMio = (miData.bits_free||0) + (miData.bits||0) + (miData.bits_promo||0);
                    if (totalMio < 1) { alert("Necesitás al menos 1 BIT para conectarte."); return; }
                    let nf = miData.bits_free||0, nn = miData.bits||0, np = miData.bits_promo||0;
                    if (nf >= 1) nf -= 1; else if (nn >= 1) nn -= 1; else np -= 1;
                    await supabase.from("usuarios").update({ bits_free: nf, bits: nn, bits_promo: np }).eq("id", perfil.id);
                    const { data: duData } = await supabase.from("usuarios").select("bits,bits_free,bits_promo").eq("id", nexo.usuario_id).single();
                    if (duData) {
                      let df = duData.bits_free||0, dn = duData.bits||0, dp = duData.bits_promo||0;
                      if (df >= 1) df -= 1; else if (dn >= 1) dn -= 1; else if (dp >= 1) dp -= 1;
                      await supabase.from("usuarios").update({ bits_free: df, bits: dn, bits_promo: dp }).eq("id", nexo.usuario_id);
                    }
                    await supabase.from("nexos").update({ conexiones_recibidas: (nexo.conexiones_recibidas || 0) + 1 }).eq("id", nexo.id);
                    await supabase.from("notificaciones").insert({
                      usuario_id: nexo.usuario_id, emisor_id: perfil.id,
                      tipo: "conexion", mensaje: `💼 ${perfil.nombre_usuario} se conectó con tu ${nexo.tipo} "${nexo.titulo}"`, leida: false,
                    });
                    alert("✅ ¡Conexión realizada!");
                  }} disabled={limiteAlcanzado}
                    style={{ width:"100%", background: limiteAlcanzado ? "#e8e8e6" : "linear-gradient(135deg,#27ae60,#1e8449)", border:"none", borderRadius:"14px", padding:"7px 8px", fontSize:"11px", fontWeight:900, color: limiteAlcanzado ? "#9a9a9a" : "#fff", cursor: limiteAlcanzado ? "not-allowed" : "pointer", fontFamily:"'Nunito',sans-serif", boxShadow: limiteAlcanzado ? "none" : "0 4px 0 #155a2e", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", marginBottom:"4px" }}>
                    <span>🔗</span>
                    <span>{limiteAlcanzado ? "Límite alcanzado" : "Conectar — 1 BIT"}</span>
                  </button>
                );
              })()}
              {!esAdmin && !miMiembro && nexo.tipo==="grupo" && (
                <button onClick={unirse}
                  style={{ background:`${colorNexo}cc`, border:"none", borderRadius:"10px", padding:"7px 8px", fontSize:"11px", fontWeight:900, color:"#fff", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
                  {nexo.config?.tipo_acceso==="aprobacion"?"⏳ Solicitar ingreso":"👥 Unirse (500 BIT)"}
                </button>
              )}
              {miMiembro?.estado==="pendiente" && <div style={{ background:"rgba(230,126,34,0.2)", border:"1px solid rgba(230,126,34,0.4)", borderRadius:"10px", padding:"7px 12px", fontSize:"11px", fontWeight:800, color:"#e67e22" }}>⏳ Pendiente</div>}
              {miMiembro?.estado==="vencido" && (
                <button onClick={async()=>{
                  if (!perfil) return;
                  const bitsTotal = (perfil.bits||0)+(perfil.bits_free||0)+(perfil.bits_promo||0);
                  if (bitsTotal<500){alert("Necesitás 500 BIT para renovar tu membresía");return;}
                  const campo = (perfil.bits_free||0)>=500?"bits_free":(perfil.bits||0)>=500?"bits":"bits_promo";
                  await supabase.from("usuarios").update({[campo]:(perfil[campo]||0)-500}).eq("id",perfil.id);
                  setPerfil((p:any)=>({...p,[campo]:(p[campo]||0)-500}));
                  const comRenovar = nexo.usuario_id === "f9b23e04-c591-44bf-9efb-51966c30a083" ? 150 : 100;
                  const {data:dueno} = await supabase.from("usuarios").select("bits_promo,bits_promotor_total").eq("id",nexo.usuario_id).single();
                  if(dueno) await supabase.from("usuarios").update({bits_promo:(dueno.bits_promo||0)+comRenovar,bits_promotor_total:(dueno.bits_promotor_total||0)+comRenovar}).eq("id",nexo.usuario_id);
                  await supabase.from("nexo_miembros").update({estado:"activo",vence_el:new Date(Date.now()+30*24*60*60*1000).toISOString(),fecha_pago:new Date().toISOString(),bits_pagados:(miMiembro.bits_pagados||0)+500}).eq("id",miMiembro.id);
                  setMiMiembro((m:any)=>({...m,estado:"activo",vence_el:new Date(Date.now()+30*24*60*60*1000).toISOString()}));
                  alert("✅ Membresía renovada por 30 días");
                }} style={{background:"linear-gradient(135deg,#e74c3c,#c0392b)",border:"none",borderRadius:"10px",padding:"8px 14px",fontSize:"12px",fontWeight:900,color:"#fff",cursor:"pointer",fontFamily:"'Nunito',sans-serif",display:"flex",alignItems:"center",gap:"6px"}}>
                  ⚠️ Membresía vencida — 💳 Renovar (500 BIT)
                </button>
              )}
              {miMiembro?.estado==="vencido" && (
                <a href={`https://wa.me/${waSoporte}?text=${encodeURIComponent("Hola NexoNet, necesito ayuda con mi membresía en " + (nexo?.titulo||""))}`} target="_blank" rel="noopener noreferrer"
                  style={{background:"#25D366",color:"#fff",borderRadius:"10px",padding:"8px 16px",fontSize:"12px",fontWeight:800,textDecoration:"none",fontFamily:"'Nunito',sans-serif"}}>
                  💬 WhatsApp soporte
                </a>
              )}
              {miMiembro?.rol === "admin_solicitado" && <div style={{ background:"rgba(212,160,23,0.15)", border:"1px solid rgba(212,160,23,0.4)", borderRadius:"10px", padding:"7px 12px", fontSize:"11px", fontWeight:800, color:"#d4a017" }}>⭐ Admin solicitado</div>}
              {miMiembro?.rol === "admin_pago_pendiente" && (
                <button onClick={()=>setPopupPagoAdmin(true)} style={{ background:"linear-gradient(135deg,#f0c040,#d4a017)", border:"none", borderRadius:"10px", padding:"8px 12px", fontSize:"11px", fontWeight:900, color:"#1a2a3a", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
                  💳 Pagar admin (500 BIT)
                </button>
              )}
              {esMiembro && !esAdmin && miMiembro?.rol === "miembro" && nexo?.tipo === "grupo" && (
                <button disabled={solicitandoAdmin} onClick={() => setPopupSolAdmin(true)}
                  style={{ background:"linear-gradient(135deg,#f0c040,#d4a017)", border:"none", borderRadius:"10px", padding:"8px 12px", fontSize:"11px", fontWeight:900, color:"#1a2a3a", cursor:"pointer", fontFamily:"'Nunito',sans-serif", opacity:solicitandoAdmin?0.5:1 }}>
                  ⭐ Ser admin (500 BIT)
                </button>
              )}
              {perfil && nexo?.usuario_id !== perfil?.id && (
                <BotonDarInsignia receptorId={nexo.usuario_id} nexoId={nexo.id} sessionUserId={perfil.id} />
              )}
              {nexo.tipo==="grupo" && nexo.config?.chat_habilitado && (esMiembro||esAdmin) && (
                <button onClick={()=>setTabActiva("chat_grupal")}
                  style={{background:`${colorNexo}cc`,border:"none",borderRadius:"10px",padding:"7px 14px",fontSize:"12px",fontWeight:900,color:"#fff",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>
                  💬 Chat
                </button>
              )}
              {(esMiembro || esAdmin) && perfil?.id !== nexo?.usuario_id && miMiembro?.rol !== "creador" && (
                <button onClick={() => { setMotivoBaja(""); setPopupBaja(true); }}
                  style={{ background:"rgba(231,76,60,0.1)", border:"1px solid rgba(231,76,60,0.3)", borderRadius:"10px", padding:"7px 12px", fontSize:"11px", fontWeight:800, color:"#e74c3c", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
                  🚪 Solicitar baja
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {(nexo.tipo === "empresa" || nexo.tipo === "servicio") && horarios.length > 0 && (
        <HorariosWidget horarios={horarios} abierto={abierto} color={colorNexo} />
      )}

      {/* BANNER PAGO ADMIN PENDIENTE */}
      {miMiembro?.rol === "admin_pago_pendiente" && (
        <div style={{ padding:"10px 16px", background:"rgba(212,160,23,0.1)", borderBottom:"2px solid rgba(212,160,23,0.3)" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:"10px" }}>
            <div>
              <div style={{ fontSize:"12px", fontWeight:800, color:"#d4a017" }}>⭐ Fuiste aprobado como admin</div>
              <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600 }}>Pagá 500 BIT para confirmar tu rol</div>
            </div>
            <button onClick={()=>setPopupPagoAdmin(true)}
              style={{ background:"linear-gradient(135deg,#f0c040,#d4a017)", border:"none", borderRadius:"10px", padding:"8px 14px", fontSize:"12px", fontWeight:900, color:"#1a2a3a", cursor:"pointer", fontFamily:"'Nunito',sans-serif", whiteSpace:"nowrap" }}>
              💳 Pagar 500 BIT
            </button>
          </div>
        </div>
      )}

      {/* BANNER RENOVACIÓN EMPRESA */}
      {(nexo?.tipo==="empresa" || nexo?.tipo==="servicio") && nexo?.usuario_id===perfil?.id && nexo?.siguiente_pago && (() => {
        const ahora = new Date();
        const sigPago = new Date(nexo.siguiente_pago);
        const diasRest = Math.ceil((sigPago.getTime() - ahora.getTime()) / (1000*60*60*24));
        const esTrial = !!nexo.trial_hasta && new Date(nexo.trial_hasta) >= ahora;
        const vencido = diasRest <= 0;
        const proximo = diasRest > 0 && diasRest <= 5;

        if (!vencido && !proximo) return null;
        return (
          <div style={{padding:"10px 16px",background:vencido?"rgba(231,76,60,0.1)":"rgba(230,126,34,0.1)",borderBottom:vencido?"2px solid rgba(231,76,60,0.3)":"2px solid rgba(230,126,34,0.3)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"10px"}}>
              <div>
                <div style={{fontSize:"12px",fontWeight:800,color:vencido?"#e74c3c":"#e67e22"}}>
                  {vencido ? "⚠️ Tu empresa está pausada — renovar para reactivar" : `⏰ ${esTrial?"Trial":"Plan"} vence en ${diasRest} día${diasRest!==1?"s":""}`}
                </div>
                <div style={{fontSize:"11px",color:"#9a9a9a",fontWeight:600}}>Costo: 10.000 BIT/mes</div>
              </div>
              <button onClick={async()=>{
                setRenovando(true);
                const endpoint = nexo?.tipo === "servicio" ? "/api/servicio/renovar" : "/api/empresa/renovar";
                const res = await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({nexo_id:nexo.id,usuario_id:perfil.id})});
                const data = await res.json();
                if (data.ok) {
                  setNexo((n:any)=>({...n,siguiente_pago:data.siguiente_pago,estado:"activo"}));
                  alert("✅ Empresa renovada por 30 días");
                } else { alert(data.error||"Error al renovar"); }
                setRenovando(false);
              }} disabled={renovando}
                style={{background:vencido?"linear-gradient(135deg,#e74c3c,#c0392b)":"linear-gradient(135deg,#e67e22,#d35400)",border:"none",borderRadius:"10px",padding:"8px 14px",fontSize:"12px",fontWeight:900,color:"#fff",cursor:"pointer",fontFamily:"'Nunito',sans-serif",whiteSpace:"nowrap",opacity:renovando?0.6:1}}>
                {renovando?"⏳":"🔄 Renovar"}
              </button>
            </div>
          </div>
        );
      })()}

      {/* TAB BAR SLIDER */}
      <div ref={tabBarRef} style={{ position:"sticky", top:"60px", zIndex:100, background:"#1a2a3a", boxShadow:"0 3px 14px rgba(0,0,0,0.28)", overflowX:"auto", scrollbarWidth:"none", display:"flex" }}>
        {páginas.map(s => (
          <button key={s.id} onClick={()=>setTabActiva(s.id)}
            style={{ flex:"0 0 auto", minWidth:"72px", background:"none", border:"none", cursor:"pointer",
                     padding:"10px 8px 6px", display:"flex", flexDirection:"column", alignItems:"center", gap:"3px",
                     borderBottom: tabActiva===s.id ? `3px solid ${colorNexo}` : "3px solid transparent" }}>
            <span style={{ fontSize:"17px" }}>{SLIDER_EMOJIS[s.tipo]||"📋"}</span>
            <span style={{ fontSize:"9px", fontWeight:800, color: tabActiva===s.id ? colorNexo : "rgba(255,255,255,0.45)", textTransform:"uppercase", letterSpacing:"0.5px", whiteSpace:"nowrap" }}>
              {s.titulo.length > 8 ? s.titulo.slice(0,7)+"…" : s.titulo}
            </span>
          </button>
        ))}
      </div>

      {/* CONTENIDO DEL SLIDER */}
      <div id={sliderActual ? `slider-${sliderActual.tipo}` : undefined} style={{ padding: esChat ? "0" : "14px", maxWidth:"600px", margin:"0 auto" }}>
        {sliderActual && <SliderContenido
          slider={sliderActual}
          items={items[tabActiva]||[]}
          mensajes={mensajes}
          perfil={perfil}
          nexo={nexo}
          esAdmin={esAdmin}
          esMiembro={esMiembro || nexo.usuario_id===perfil?.id}
          descargasPagadas={descargasPagadas}
          pagandoDescarga={pagandoDescarga}
          miembros={miembros}
          texto={texto}
          setTexto={setTexto}
          enviando={enviando}
          onEnviar={enviarMensaje}
          onVisor={setVisor}
          onPagarDescarga={setPopupPagoDescarga}
          onAbrirDescarga={abrirDescarga}
          onFlash={(item: any) => { setFlashItem(item); setFlashOpen(true); }}
          bottomRef={bottomRef}
          colorNexo={colorNexo}
          onUnirse={() => setPopupUnirse(true)}
        />}
      </div>

      {/* VISOR */}
      {visor && (
        <div style={{ position:"fixed", inset:0, zIndex:600, background:"rgba(0,0,0,0.94)", display:"flex", alignItems:"center", justifyContent:"center" }}
          onClick={()=>setVisor(null)}>
          <button onClick={()=>setVisor(null)} style={{ position:"absolute", top:"16px", right:"16px", background:"rgba(255,255,255,0.15)", border:"none", borderRadius:"50%", width:"44px", height:"44px", fontSize:"20px", color:"#fff", cursor:"pointer" }}>✕</button>
          <div onClick={e=>e.stopPropagation()} style={{ maxWidth:"92vw", maxHeight:"85vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
            {visor.tipo==="imagen" && <img src={visor.url} alt="" style={{ maxWidth:"92vw", maxHeight:"82vh", borderRadius:"12px", objectFit:"contain" }} />}
            {visor.tipo==="video"  && <video src={visor.url} controls autoPlay style={{ maxWidth:"92vw", maxHeight:"82vh", borderRadius:"12px" }} />}
            {visor.tipo==="pdf"    && <iframe src={visor.url} style={{ width:"88vw", height:"80vh", borderRadius:"12px", border:"none" }} />}
            {(!visor.tipo||visor.tipo==="documento"||visor.tipo==="archivo") && (
              <div style={{ background:"rgba(255,255,255,0.1)", borderRadius:"16px", padding:"40px", textAlign:"center" }}>
                <div style={{ fontSize:"64px", marginBottom:"16px" }}>📄</div>
                <div style={{ fontSize:"14px", fontWeight:700, color:"#fff", marginBottom:"20px" }}>{visor.titulo||visor.url?.split("/").pop()}</div>
                <a href={visor.url} target="_blank" rel="noopener noreferrer" style={{ background:"linear-gradient(135deg,#d4a017,#f0c040)", borderRadius:"12px", padding:"12px 24px", fontSize:"14px", fontWeight:900, color:"#1a2a3a", textDecoration:"none" }}>📥 Descargar</a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* POPUP BAJA DE GRUPO */}
      {popupBaja && (
        <div style={{ position:"fixed", inset:0, zIndex:800, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Nunito',sans-serif" }} onClick={() => setPopupBaja(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background:"#fff", borderRadius:"20px", padding:"28px 24px", maxWidth:"380px", width:"90%", textAlign:"center" }}>
            <div style={{ fontSize:"48px", marginBottom:"12px" }}>🚪</div>
            <div style={{ fontSize:"18px", fontWeight:900, color:"#1a2a3a", marginBottom:"8px" }}>Solicitar baja del grupo</div>
            <div style={{ fontSize:"13px", color:"#666", fontWeight:600, marginBottom:"16px" }}>Tu solicitud será enviada al equipo de NexoNet.</div>
            <textarea
              value={motivoBaja}
              onChange={e => setMotivoBaja(e.target.value)}
              placeholder="Motivo (opcional)..."
              rows={3}
              maxLength={500}
              style={{ width:"100%", border:"2px solid #e8e8e6", borderRadius:"12px", padding:"10px 14px", fontSize:"13px", fontFamily:"'Nunito',sans-serif", outline:"none", resize:"vertical", boxSizing:"border-box", marginBottom:"16px" }}
            />
            <div style={{ display:"flex", gap:"10px" }}>
              <button onClick={() => setPopupBaja(false)} style={{ flex:1, background:"#f0f0f0", border:"none", borderRadius:"12px", padding:"14px", fontSize:"14px", fontWeight:800, color:"#666", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>Cancelar</button>
              <button onClick={async () => {
                await supabase.from("nexo_miembros").update({ estado: "inactivo" }).eq("id", miMiembro.id);
                await fetch("/api/nexo/solicitar-baja", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ usuario_id: perfil.id, nexo_id: nexo.id, nexo_titulo: nexo.titulo, motivo: motivoBaja.trim(), creador_id: nexo.usuario_id }),
                });
                setPopupBaja(false);
                router.push("/");
              }} style={{ flex:1, background:"linear-gradient(135deg,#e74c3c,#c0392b)", border:"none", borderRadius:"12px", padding:"14px", fontSize:"14px", fontWeight:900, color:"#fff", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
                Confirmar baja
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP PAGO ADMIN */}
      {popupPagoAdmin && (
        <PopupCompra
          titulo="⭐ Confirmar admin"
          emoji="⭐"
          costo="500 BIT"
          descripcion={`Pago para ser admin de "${nexo?.titulo}"`}
          bits={{ free: Math.max(0, perfil?.bits_free||0), nexo: Math.max(0, perfil?.bits||0), promo: Math.max(0, perfil?.bits_promo||0) }}
          onClose={() => setPopupPagoAdmin(false)}
          onPagar={async (metodo: MetodoPago) => {
            setPopupPagoAdmin(false);
            await confirmarPagoAdmin(metodo);
          }}
        />
      )}

      {/* POPUP SOLICITAR ADMIN */}
      {popupSolAdmin && (
        <div style={{ position:"fixed", inset:0, zIndex:800, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Nunito',sans-serif" }} onClick={() => setPopupSolAdmin(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background:"#fff", borderRadius:"20px", padding:"28px 24px", maxWidth:"380px", width:"90%", textAlign:"center" }}>
            <div style={{ fontSize:"48px", marginBottom:"12px" }}>⭐</div>
            <div style={{ fontSize:"18px", fontWeight:900, color:"#1a2a3a", marginBottom:"8px" }}>Solicitar ser admin</div>
            <div style={{ fontSize:"13px", color:"#666", fontWeight:600, marginBottom:"20px" }}>Tu solicitud será enviada a los admins de &quot;{nexo?.titulo}&quot;. Si te aprueban, se te indicará el pago de 500 BIT.</div>
            <div style={{ display:"flex", gap:"10px" }}>
              <button onClick={() => setPopupSolAdmin(false)} style={{ flex:1, background:"#f0f0f0", border:"none", borderRadius:"12px", padding:"14px", fontSize:"14px", fontWeight:800, color:"#666", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>Cancelar</button>
              <button disabled={solicitandoAdmin} onClick={async () => {
                setPopupSolAdmin(false);
                setSolicitandoAdmin(true);
                await supabase.from("nexo_miembros").update({ rol: "admin_solicitado" }).eq("id", miMiembro.id);
                setMiMiembro((m:any) => ({...m, rol:"admin_solicitado"}));
                const { data: adminsNexo } = await supabase.from("nexo_miembros").select("usuario_id").eq("nexo_id",id).in("rol",["creador","admin"]).eq("estado","activo");
                const adminIds = [...new Set([nexo.usuario_id, ...(adminsNexo||[]).map((a:any)=>a.usuario_id)])];
                await supabase.from("notificaciones").insert(adminIds.map(uid=>({ usuario_id:uid, tipo:"solicitud_admin", mensaje:`⭐ ${perfil.nombre_usuario} solicita ser admin en "${nexo.titulo}"`, leida:false, nexo_id:nexo.id })));
                setSolicitandoAdmin(false);
              }} style={{ flex:1, background:"linear-gradient(135deg,#f0c040,#d4a017)", border:"none", borderRadius:"12px", padding:"14px", fontSize:"14px", fontWeight:900, color:"#1a2a3a", cursor:"pointer", fontFamily:"'Nunito',sans-serif", opacity:solicitandoAdmin?0.5:1 }}>
                ⭐ Solicitar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP UNIRSE AL GRUPO */}
      {popupUnirse && (
        <PopupCompra
          titulo="👥 Unirse al grupo"
          emoji="👥"
          costo="500 BIT"
          descripcion={nexo?.titulo}
          bits={{ free: Math.max(0, perfil?.bits_free||0), nexo: Math.max(0, perfil?.bits||0), promo: Math.max(0, perfil?.bits_promo||0) }}
          onClose={() => setPopupUnirse(false)}
          onPagar={async (metodo: MetodoPago) => {
            setPopupUnirse(false);
            await confirmarUnirse(metodo);
          }}
        />
      )}

      {/* POPUP CONFIRMAR PAGO DESCARGA */}
      {popupPagoDescarga && (
        <PopupCompra
          titulo="📥 Descargar archivo"
          emoji="📥"
          costo={`${popupPagoDescarga.precio_bits} BIT`}
          descripcion={popupPagoDescarga.titulo || "Archivo"}
          bits={{ free: 0, nexo: Math.max(0, perfil?.bits||0), promo: Math.max(0, perfil?.bits_promo||0) }}
          onClose={() => setPopupPagoDescarga(null)}
          onPagar={async (metodo: MetodoPago) => {
            const item = popupPagoDescarga;
            setPopupPagoDescarga(null);
            await pagarDescarga(item, metodo);
          }}
        />
      )}

      {flashOpen && perfil && (
        <FlashEnvio
          nexoId={id}
          nexoTitulo={nexo.titulo}
          usuarioId={perfil.id}
          color={colorNexo}
          perfil={perfil}
          itemContexto={flashItem ? { id: flashItem.id, titulo: flashItem.titulo, url: flashItem.url, tipo: "adjunto" } : undefined}
          onClose={() => { setFlashOpen(false); setFlashItem(null); }}
        />
      )}

      {popupBannerCompartir && nexo && (
        <div style={{ position:"fixed", inset:0, zIndex:600, background:"rgba(0,0,0,0.75)", display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }} onClick={()=>setPopupBannerCompartir(false)}>
          <div style={{ background:"#fff", borderRadius:"20px", padding:"20px", maxWidth:"440px", width:"100%", maxHeight:"90vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px" }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"20px", color:"#1a2a3a", letterSpacing:"1px" }}>🎨 Banner para compartir</div>
              <button onClick={()=>setPopupBannerCompartir(false)} style={{ background:"none", border:"none", fontSize:"22px", cursor:"pointer", color:"#9a9a9a" }}>✕</button>
            </div>
            <BannerCompartir tipo={nexo.tipo} titulo={nexo.titulo} nombreUsuario={perfil?.nombre_usuario||""} destino={`/nexo/${id}`} />
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}

const SLIDER_EMOJIS: Record<string,string> = {
  galeria:"📸", videos:"🎬", documentos:"📄", descargas:"📥", productos:"🛒",
  novedades:"📢", proveedores:"🏭", faq:"❓", facturas:"🧾", calendario:"📅",
  equipo:"👤", servicios:"🛠️", portfolio:"🎨", testimonios:"💬", certificados:"🏅",
  mensajes:"💬", chat:"💬", personalizado:"✨", resenas:"⭐", clientes:"🤝", lista_precios:"💲",
};

function SliderContenido({ slider, items, mensajes, perfil, nexo, esAdmin, esMiembro, descargasPagadas, pagandoDescarga, miembros, texto, setTexto, enviando, onEnviar, onVisor, onPagarDescarga, onAbrirDescarga, onFlash, bottomRef, colorNexo, onUnirse }: any) {
  const tipo = slider.tipo;

  // Bloquear contenido de grupo a no miembros (excepto chat y reseñas)
  if (nexo?.tipo === "grupo" && !esMiembro && !esAdmin && tipo !== "mensajes" && tipo !== "chat" && tipo !== "resenas") {
    return (
      <div style={{ textAlign:"center", padding:"50px 20px" }}>
        <div style={{ fontSize:"48px", marginBottom:"12px" }}>🔒</div>
        <div style={{ fontSize:"16px", fontWeight:900, color:"#1a2a3a", marginBottom:"8px" }}>Contenido exclusivo para miembros</div>
        <div style={{ fontSize:"13px", color:"#666", fontWeight:600, marginBottom:"20px" }}>Unite al grupo para acceder a este contenido.</div>
        {onUnirse && (
          <button onClick={onUnirse} style={{ background:"linear-gradient(135deg,#f0c040,#d4a017)", border:"none", borderRadius:"14px", padding:"14px 28px", fontSize:"14px", fontWeight:900, color:"#1a2a3a", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
            👥 Unirse al grupo
          </button>
        )}
      </div>
    );
  }

  // CHAT
  if (tipo==="mensajes"||tipo==="chat") {
    return (
      <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 230px)" }}>
        <div style={{ flex:1, overflowY:"auto", padding:"12px 14px", display:"flex", flexDirection:"column", gap:"8px" }}>
          {mensajes.length===0 && (
            <div style={{ textAlign:"center", padding:"50px 20px", color:"#9a9a9a" }}>
              <div style={{ fontSize:"40px", marginBottom:"12px" }}>💬</div>
              <div style={{ fontWeight:800, color:"#1a2a3a" }}>Sin mensajes todavía</div>
              <div style={{ fontSize:"12px", marginTop:"4px", fontWeight:600 }}>Sé el primero en escribir</div>
            </div>
          )}
          {mensajes.map((m:any)=>{
            const esMio = m.usuario_id===perfil?.id;
            return (
              <div key={m.id} style={{ display:"flex", flexDirection:esMio?"row-reverse":"row", alignItems:"flex-end", gap:"8px" }}>
                {!esMio && (
                  <div style={{ width:"30px", height:"30px", borderRadius:"50%", background:"linear-gradient(135deg,#1a2a3a,#243b55)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"13px", flexShrink:0, overflow:"hidden" }}>
                    {m.usuarios?.avatar_url ? <img src={m.usuarios.avatar_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : "👤"}
                  </div>
                )}
                <div style={{ maxWidth:"72%", display:"flex", flexDirection:"column", alignItems:esMio?"flex-end":"flex-start" }}>
                  {!esMio && <div style={{ fontSize:"10px", fontWeight:800, color:colorNexo, marginBottom:"2px", marginLeft:"4px" }}>{m.usuarios?.nombre_usuario}</div>}
                  <div style={{ background:esMio?`linear-gradient(135deg,${colorNexo}cc,${colorNexo})`:"#fff", borderRadius:esMio?"16px 4px 16px 16px":"4px 16px 16px 16px", padding:"10px 14px", boxShadow:"0 2px 8px rgba(0,0,0,0.08)" }}>
                    {m.texto && <div style={{ fontSize:"14px", fontWeight:600, color:esMio?"#fff":"#2c2c2e", lineHeight:1.5 }}>{m.texto}</div>}
                  </div>
                  <div style={{ fontSize:"10px", color:"#bbb", fontWeight:600, marginTop:"3px", marginLeft:"4px", marginRight:"4px" }}>
                    {new Date(m.created_at).toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"})}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        {(esMiembro||esAdmin) && (
          <div style={{ padding:"10px 14px", background:"#fff", borderTop:"1px solid #e8e8e6", display:"flex", gap:"8px", alignItems:"flex-end" }}>
            <textarea value={texto} onChange={e=>setTexto(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();onEnviar();} }}
              placeholder="Escribí un mensaje..." rows={1}
              style={{ flex:1, border:"2px solid #e8e8e6", borderRadius:"14px", padding:"10px 14px", fontSize:"14px", fontFamily:"'Nunito',sans-serif", outline:"none", resize:"none" }} />
            <button onClick={onEnviar} disabled={enviando||!texto.trim()}
              style={{ width:"44px", height:"44px", borderRadius:"50%", background:texto.trim()?`linear-gradient(135deg,${colorNexo}cc,${colorNexo})`:"#f4f4f2", border:"none", cursor:texto.trim()?"pointer":"default", fontSize:"18px", flexShrink:0 }}>
              {enviando?"⏳":"➤"}
            </button>
          </div>
        )}
        {!esMiembro && !esAdmin && (
          <div style={{ padding:"14px", background:"#fff8e0", textAlign:"center", fontSize:"13px", fontWeight:700, color:"#d4a017", borderTop:"1px solid #f0e0b0" }}>
            🔒 Unite al grupo para escribir
          </div>
        )}
      </div>
    );
  }

  // DESCARGAS
  if (tipo==="descargas" || tipo==="lista_precios") {
    return <DescargasSlider items={items} perfil={perfil} nexo={nexo} esAdmin={esAdmin} esMiembro={esMiembro} descargasPagadas={descargasPagadas} pagandoDescarga={pagandoDescarga} onPagarDescarga={onPagarDescarga} onAbrirDescarga={onAbrirDescarga} onFlash={onFlash} colorNexo={colorNexo} />;
  }

  if (tipo === "resenas") {
    return <ResenaWidget nexoId={nexo.id} perfil={perfil} color={colorNexo} usuarioIdNexo={nexo.usuario_id} />;
  }

  // MIEMBROS
  if (tipo==="equipo") {
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
        <div style={{ fontSize:"11px", fontWeight:800, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"4px" }}>
          {miembros.length} miembro{miembros.length!==1?"s":""}
        </div>
        {miembros.map((m:any)=>(
          <div key={m.id} style={{ background:"#fff", borderRadius:"14px", padding:"14px 16px", display:"flex", alignItems:"center", gap:"12px" }}>
            <div style={{ width:"44px", height:"44px", borderRadius:"50%", background:"linear-gradient(135deg,#1a2a3a,#243b55)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px", overflow:"hidden", flexShrink:0 }}>
              {m.usuarios?.avatar_url ? <img src={m.usuarios.avatar_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : "👤"}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:"14px", fontWeight:900, color:"#1a2a3a" }}>{m.usuarios?.nombre_usuario||"---"}</div>
              <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600 }}>{m.usuarios?.codigo}</div>
            </div>
            <RolBadge rol={m.rol} color={colorNexo} />
          </div>
        ))}
        {miembros.length===0 && <EmptySlider emoji="👥" texto="Sin miembros todavía" sub="" />}
      </div>
    );
  }

  // GENÉRICO — galería, videos, docs, productos, novedades, etc.
  return (
    <div>
      {items.length===0 && <EmptySlider emoji={SLIDER_EMOJIS[tipo]||"📋"} texto={`Sin contenido en "${slider.titulo}"`} sub={esAdmin?"Agregá contenido desde el panel admin":"Todavía no hay contenido"} />}
      {(tipo==="galeria"||tipo==="portfolio") && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
          {items.map((item:any)=>(
            <div key={item.id} onClick={()=>onVisor({...item, tipo:"imagen"})} style={{ borderRadius:"14px", overflow:"hidden", cursor:"pointer", background:"#1a2a3a", aspectRatio:"1", display:"flex", alignItems:"center", justifyContent:"center" }}>
              {item.url ? <img src={item.url} alt={item.titulo||""} style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <span style={{ fontSize:"36px", opacity:0.4 }}>📸</span>}
            </div>
          ))}
        </div>
      )}
      {tipo==="videos" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
          {items.map((item:any)=>(
            <div key={item.id} style={{ background:"#fff", borderRadius:"16px", overflow:"hidden", boxShadow:"0 2px 10px rgba(0,0,0,0.07)" }}>
              <div style={{ position:"relative", background:"#000", cursor:"pointer" }} onClick={()=>onVisor({...item,tipo:"video"})}>
                <video src={item.url} style={{ width:"100%", maxHeight:"200px", objectFit:"cover", display:"block" }} />
                <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.35)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"48px" }}>▶️</div>
              </div>
              {item.titulo && <div style={{ padding:"12px 14px", fontSize:"14px", fontWeight:800, color:"#1a2a3a" }}>{item.titulo}</div>}
              {item.descripcion && <div style={{ padding:"0 14px 12px", fontSize:"12px", color:"#9a9a9a", fontWeight:600 }}>{item.descripcion}</div>}
            </div>
          ))}
        </div>
      )}
      {(tipo==="documentos"||tipo==="facturas"||tipo==="certificados") && (
        <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
          {items.map((item:any)=>(
            <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration:"none" }}>
              <div style={{ background:"#fff", borderRadius:"14px", padding:"14px 16px", display:"flex", gap:"14px", alignItems:"center", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
                <div style={{ width:"44px", height:"44px", borderRadius:"12px", background:"rgba(212,160,23,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"22px", flexShrink:0 }}>📄</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:"14px", fontWeight:900, color:"#1a2a3a" }}>{item.titulo||"Documento"}</div>
                  <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600 }}>{item.descripcion||""}</div>
                </div>
                <span style={{ fontSize:"18px", color:"#3a7bd5" }}>↗️</span>
              </div>
            </a>
          ))}
        </div>
      )}
      {(tipo==="productos"||tipo==="servicios") && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
          {items.map((item:any)=>(
            <div key={item.id} style={{ background:"#fff", borderRadius:"16px", overflow:"hidden", boxShadow:"0 2px 10px rgba(0,0,0,0.07)" }}>
              <div style={{ height:"110px", background:"linear-gradient(135deg,#1a2a3a,#243b55)", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
                {item.url ? <img src={item.url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <span style={{ fontSize:"36px", opacity:0.4 }}>{SLIDER_EMOJIS[tipo]}</span>}
              </div>
              <div style={{ padding:"10px 12px" }}>
                <div style={{ fontSize:"13px", fontWeight:900, color:"#1a2a3a", marginBottom:"3px" }}>{item.titulo||"Item"}</div>
                {item.precio_bits ? <div style={{ fontSize:"12px", fontWeight:800, color:colorNexo }}>$ {item.precio_bits?.toLocaleString()}</div> : null}
              </div>
            </div>
          ))}
        </div>
      )}
      {(tipo==="novedades"||tipo==="faq"||tipo==="testimonios"||tipo==="personalizado"||tipo==="calendario"||tipo==="proveedores"||tipo==="clientes") && (
        <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
          {items.map((item:any)=>(
            <div key={item.id} style={{ background:"#fff", borderRadius:"14px", padding:"16px", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
              {item.miniatura_url && <img src={item.miniatura_url} alt="" style={{ width:"100%", maxHeight:"160px", objectFit:"cover", borderRadius:"10px", marginBottom:"10px" }} />}
              {item.titulo && <div style={{ fontSize:"14px", fontWeight:900, color:"#1a2a3a", marginBottom:"6px" }}>{item.titulo}</div>}
              {item.descripcion && <div style={{ fontSize:"13px", color:"#555", fontWeight:600, lineHeight:1.6 }}>{item.descripcion}</div>}
              {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ display:"inline-block", marginTop:"8px", fontSize:"12px", fontWeight:700, color:colorNexo, textDecoration:"none" }}>🔗 Ver más</a>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DescargasSlider({ items, perfil, nexo, esAdmin, esMiembro, descargasPagadas, pagandoDescarga, onPagarDescarga, onAbrirDescarga, onFlash, colorNexo }: any) {
  const [solicitudes, setSolicitudes] = useState<Set<string>>(new Set());
  const [enviandoSol, setEnviandoSol] = useState<string|null>(null);

  useEffect(() => {
    if (!perfil) return;
    supabase.from("nexo_descarga_solicitudes").select("descarga_id").eq("solicitante_id", perfil.id).eq("nexo_id", nexo.id).eq("estado", "pendiente")
      .then(({ data }) => {
        if (data) setSolicitudes(new Set(data.map((s: any) => s.descarga_id)));
      });
  }, [perfil, nexo.id]);

  const solicitarAcceso = async (itemId: string) => {
    if (!perfil) return;
    setEnviandoSol(itemId);
    try {
      await supabase.from("nexo_descarga_solicitudes").insert({
        descarga_id: itemId, nexo_id: nexo.id, solicitante_id: perfil.id, estado: "pendiente",
      });
      await supabase.from("notificaciones").insert({
        usuario_id: nexo.usuario_id, tipo: "sistema",
        mensaje: `📩 ${perfil.nombre_usuario || perfil.nombre || "Un usuario"} solicitó acceso a una descarga en tu nexo`,
        leida: false,
      });
      setSolicitudes(prev => new Set([...prev, itemId]));
    } catch (err) { console.error("Error solicitando acceso:", err); }
    setEnviandoSol(null);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
      {items.length===0 && <EmptySlider emoji="📥" texto="Sin archivos todavía" sub="El administrador puede agregar descargas desde el panel admin" />}
      {items.map((item:any)=>{
        const gratis      = !item.precio_bits || item.precio_bits===0;
        const yaPago      = descargasPagadas.has(item.id);
        const procesando  = pagandoDescarga===item.id;
        const vis         = item.visibilidad || "publica";
        const bloqueadoMiembros = vis === "miembros" && !esMiembro && !esAdmin;
        const bloqueadoSolicitud = vis === "solicitud" && !esAdmin;
        const yaSolicito  = solicitudes.has(item.id);

        return (
          <div key={item.id} style={{ background:"#fff", borderRadius:"16px", overflow:"hidden", boxShadow:"0 2px 10px rgba(0,0,0,0.07)" }}>
            <div style={{ height:"120px", background:"linear-gradient(135deg,#1a2a3a,#243b55)", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden" }}>
              {item.tipo==="imagen" && item.url && <img src={item.url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />}
              {item.tipo==="video"  && item.url && <><video src={item.url} style={{ width:"100%", height:"100%", objectFit:"cover" }} /><div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"40px" }}>▶️</div></>}
              {(!item.tipo||item.tipo==="pdf"||item.tipo==="documento") && <span style={{ fontSize:"52px", opacity:0.4 }}>{item.tipo==="pdf"?"📕":"📄"}</span>}
              <div style={{ position:"absolute", top:"8px", right:"8px", background:gratis?"rgba(39,174,96,0.92)":"rgba(212,160,23,0.92)", borderRadius:"8px", padding:"4px 10px", fontSize:"11px", fontWeight:900, color:gratis?"#fff":"#1a2a3a" }}>
                {gratis?"GRATIS":`${item.precio_bits} BIT`}
              </div>
            </div>
            <div style={{ padding:"14px 16px" }}>
              <div style={{ fontSize:"14px", fontWeight:900, color:"#1a2a3a", marginBottom:"4px" }}>{item.titulo||"Archivo"}</div>
              {item.descripcion && <div style={{ fontSize:"12px", color:"#9a9a9a", fontWeight:600, marginBottom:"10px", lineHeight:1.5 }}>{item.descripcion}</div>}
              <div style={{ display:"flex", gap:"8px", alignItems:"center", marginBottom:"12px" }}>
                {item.tipo && <span style={{ background:"#f0f0f0", borderRadius:"6px", padding:"2px 8px", fontSize:"10px", fontWeight:800, color:"#666", textTransform:"uppercase" }}>{item.tipo}</span>}
                <span style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600 }}>📥 {item.descargas||0} descargas</span>
              </div>
              {bloqueadoMiembros ? (
                <div style={{ width:"100%", background:"#f4f4f2", borderRadius:"12px", padding:"12px", fontSize:"14px", fontWeight:800, color:"#9a9a9a", textAlign:"center" }}>
                  🔒 Solo para miembros
                </div>
              ) : bloqueadoSolicitud ? (
                yaSolicito ? (
                  <div style={{ width:"100%", background:"#f4f4f2", borderRadius:"12px", padding:"12px", fontSize:"14px", fontWeight:800, color:"#9a9a9a", textAlign:"center" }}>
                    ⏳ Solicitud enviada
                  </div>
                ) : (
                  <button onClick={()=>solicitarAcceso(item.id)} disabled={enviandoSol===item.id}
                    style={{ width:"100%", background:"linear-gradient(135deg,#8e44ad,#6c3483)", border:"none", borderRadius:"12px", padding:"12px", fontSize:"14px", fontWeight:900, color:"#fff", cursor:"pointer", fontFamily:"'Nunito',sans-serif", boxShadow:"0 3px 0 #4a235a" }}>
                    {enviandoSol===item.id?"⏳ Enviando...":"📩 Solicitar acceso"}
                  </button>
                )
              ) : gratis || yaPago ? (
                perfil ? (
                  <button onClick={()=>onAbrirDescarga(item.url)}
                    style={{ width:"100%", border:"none", cursor:"pointer", fontFamily:"'Nunito',sans-serif", textAlign:"center", background:"linear-gradient(135deg,#27ae60,#1e8449)", borderRadius:"12px", padding:"12px", fontSize:"14px", fontWeight:900, color:"#fff", boxShadow:"0 3px 0 #155a2e" }}>
                    📥 {yaPago?"Descargar de nuevo":"Descargar gratis"}
                  </button>
                ) : (
                  <button onClick={()=>window.location.href="/login"}
                    style={{ width:"100%", border:"none", cursor:"pointer", fontFamily:"'Nunito',sans-serif", textAlign:"center", background:"linear-gradient(135deg,#3a7bd5,#2962b0)", borderRadius:"12px", padding:"12px", fontSize:"14px", fontWeight:900, color:"#fff", boxShadow:"0 3px 0 #1e4a8a" }}>
                    🔑 Iniciá sesión para descargar
                  </button>
                )
              ) : perfil ? (
                <button onClick={()=>onPagarDescarga(item)} disabled={!!procesando}
                  style={{ width:"100%", background:`linear-gradient(135deg,${colorNexo}cc,${colorNexo})`, border:"none", borderRadius:"12px", padding:"12px", fontSize:"14px", fontWeight:900, color:"#fff", cursor:"pointer", fontFamily:"'Nunito',sans-serif", boxShadow:`0 3px 0 ${colorNexo}88` }}>
                  {procesando?"⏳ Procesando...":`💰 Pagar ${item.precio_bits} BIT y descargar`}
                </button>
              ) : (
                <button onClick={()=>window.location.href="/login"}
                  style={{ width:"100%", border:"none", cursor:"pointer", fontFamily:"'Nunito',sans-serif", textAlign:"center", background:"linear-gradient(135deg,#3a7bd5,#2962b0)", borderRadius:"12px", padding:"12px", fontSize:"14px", fontWeight:900, color:"#fff", boxShadow:"0 3px 0 #1e4a8a" }}>
                  🔑 Iniciá sesión para descargar
                </button>
              )}
              {esAdmin && (
                <button onClick={() => onFlash(item)}
                  style={{ marginTop: "8px", width: "100%", background: "linear-gradient(135deg,#e67e22,#d35400)",
                    border: "none", borderRadius: "12px", padding: "10px", fontSize: "13px", fontWeight: 900,
                    color: "#fff", cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>
                  ⚡ Flash a este archivo
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const DIAS_LABELS = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];

function HorariosWidget({ horarios, abierto, color }: { horarios: any[]; abierto: boolean | null; color: string }) {
  const [expandido, setExpandido] = useState(false);
  const hoy = (new Date().getDay() + 6) % 7;
  const horarioHoy = horarios.find(h => h.dia === hoy);

  return (
    <div style={{ background:"#fff", borderBottom:`3px solid ${abierto ? "#00ff88" : abierto === false ? "#ff2244" : "#e8e8e6"}`, padding:"12px 16px", fontFamily:"'Nunito',sans-serif" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer" }} onClick={() => setExpandido(e => !e)}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <span style={{
            background: abierto ? "rgba(0,255,136,0.12)" : "rgba(255,34,68,0.12)",
            border: `1.5px solid ${abierto ? "#00ff88" : "#ff2244"}`,
            color: abierto ? "#00cc66" : "#ff2244",
            borderRadius: "20px", padding: "3px 12px",
            fontSize: "12px", fontWeight: 900,
          }}>
            {abierto ? "● Abierto ahora" : "● Cerrado ahora"}
          </span>
          {horarioHoy && !horarioHoy.cerrado && (
            <span style={{ fontSize:"12px", fontWeight:700, color:"#9a9a9a" }}>
              {horarioHoy.hora_desde?.slice(0,5)} – {horarioHoy.hora_hasta?.slice(0,5)}
            </span>
          )}
        </div>
        <span style={{ fontSize:"12px", color:"#9a9a9a", fontWeight:700 }}>{expandido ? "▲" : "▼ Ver horarios"}</span>
      </div>

      {expandido && (
        <div style={{ marginTop:"12px", display:"flex", flexDirection:"column", gap:"6px" }}>
          {DIAS_LABELS.map((dia, i) => {
            const h = horarios.find(x => x.dia === i);
            const esHoy = i === hoy;
            return (
              <div key={i} style={{
                display:"flex", alignItems:"center", justifyContent:"space-between",
                padding:"7px 10px", borderRadius:"10px",
                background: esHoy ? `${color}10` : "transparent",
                border: esHoy ? `1.5px solid ${color}40` : "1.5px solid transparent",
              }}>
                <span style={{ fontSize:"12px", fontWeight: esHoy ? 900 : 700, color: esHoy ? "#1a2a3a" : "#555", width:"32px" }}>{dia}</span>
                {!h || h.cerrado ? (
                  <span style={{ fontSize:"12px", fontWeight:700, color:"#e74c3c" }}>Cerrado</span>
                ) : (
                  <span style={{ fontSize:"12px", fontWeight:700, color:"#27ae60" }}>
                    {h.hora_desde?.slice(0,5)} – {h.hora_hasta?.slice(0,5)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RolBadge({ rol, color }: { rol:string; color:string }) {
  const map: Record<string,{bg:string;c:string;l:string}> = {
    creador:   { bg:color,                     c:"#fff", l:"👑 Creador"  },
    moderador: { bg:"rgba(58,123,213,0.15)",   c:"#3a7bd5", l:"🛡️ Mod"  },
    miembro:   { bg:"rgba(39,174,96,0.12)",    c:"#27ae60", l:"✅ Miembro"},
  };
  const s = map[rol]||map.miembro;
  return <span style={{ background:s.bg, color:s.c, borderRadius:"20px", padding:"3px 10px", fontSize:"10px", fontWeight:900 }}>{s.l}</span>;
}

function EmptySlider({ emoji, texto, sub }: { emoji:string; texto:string; sub:string }) {
  return (
    <div style={{ textAlign:"center", padding:"50px 20px", background:"#fff", borderRadius:"16px" }}>
      <div style={{ fontSize:"48px", marginBottom:"12px" }}>{emoji}</div>
      <div style={{ fontSize:"15px", fontWeight:900, color:"#1a2a3a", marginBottom:"6px" }}>{texto}</div>
      {sub && <div style={{ fontSize:"12px", color:"#9a9a9a", fontWeight:600 }}>{sub}</div>}
    </div>
  );
}
