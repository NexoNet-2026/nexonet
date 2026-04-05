"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import AyudaPopup from "@/components/AyudaPopup";
import HeroBuscador from "@/app/_components/HeroBuscador";
import Slider from "@/app/_components/Slider";
import TarjetaAnuncio from "@/app/_components/TarjetaAnuncio";
import TarjetaNexo from "@/app/_components/TarjetaNexo";
import TarjetaVacia from "@/app/_components/TarjetaVacia";
import { useHomeData } from "@/app/_hooks/useHomeData";
import { supabase } from "@/lib/supabase";
import OnboardingPopup from "@/components/OnboardingPopup";

export default function Home() {
  const router = useRouter();
  const { anuncios, nexos, rubros, subrubros, loading, nexoItems } = useHomeData();
  const [soloPermuto, setSoloPermuto] = useState(false);
  const [perfilHome, setPerfilHome] = useState<any>(null);
  const [mostrarOnboarding, setMostrarOnboarding] = useState(false);

  useEffect(() => {
    const verificar = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: u } = await supabase.from("usuarios")
        .select("id,nombre_usuario,codigo,onboarding_completado")
        .eq("id", session.user.id).single();
      if (u) {
        setPerfilHome(u);
        if (!u.onboarding_completado) setMostrarOnboarding(true);
      }
    };
    verificar();
  }, []);

  const anuFiltrados = soloPermuto ? anuncios.filter(a => a.permuto) : anuncios;
  const recientes = anuFiltrados.slice(0, 12);
  const empresas  = nexos.filter(n => n.tipo === "empresa").slice(0, 10);
  const servicios = nexos.filter(n => n.tipo === "servicio").slice(0, 10);
  const trabajos  = nexos.filter(n => n.tipo === "trabajo").slice(0, 10);

  const SUBTIPOS_GRUPO: {key:string;emoji:string;label:string}[] = [
    {key:"emprendimiento",emoji:"🚀",label:"Emprendimientos"},
    {key:"curso",emoji:"🎓",label:"Cursos"},
    {key:"consorcio",emoji:"🏢",label:"Consorcios"},
    {key:"deportivo",emoji:"⚽",label:"Deportivos"},
    {key:"estudio",emoji:"📚",label:"Estudio"},
    {key:"venta",emoji:"🛒",label:"Venta"},
    {key:"artistas",emoji:"🎨",label:"Artistas"},
    {key:"vecinos",emoji:"🏘️",label:"Vecinos"},
    {key:"generico",emoji:"✨",label:"Grupos"},
  ];

  const sections: { titulo: string; acento: string; tipo: string; emoji: string; textoVacio: string; crearUrl: string; nexoUrl: (id: string) => string }[] = [
    { titulo: "🏢 Empresas",     acento: "#c0392b", tipo: "empresas",  emoji: "🏢", textoVacio: "Sé el primero en crear una empresa",    crearUrl: "/nexo/crear/empresa",  nexoUrl: id => `/nexo/${id}` },
    { titulo: "🛠️ Servicios",   acento: "#27ae60", tipo: "servicios", emoji: "🛠️", textoVacio: "Sé el primero en ofrecer un servicio", crearUrl: "/nexo/crear/servicio", nexoUrl: id => `/nexo/${id}` },
    { titulo: "💼 Busco Trabajo", acento: "#8e44ad", tipo: "trabajo",  emoji: "💼", textoVacio: "Sé el primero en buscar trabajo",       crearUrl: "/nexo/crear/trabajo",  nexoUrl: id => `/nexo/${id}` },
  ];

  const nexosByTipo: Record<string, typeof nexos> = {
    empresas: empresas, servicios: servicios, trabajo: trabajos,
  };

  return (
    <main style={{ paddingTop: "95px", paddingBottom: "130px", background: "#f4f4f2", minHeight: "100vh", fontFamily: "'Nunito',sans-serif" }}>
      <Header />
      <HeroBuscador rubros={rubros} subrubros={subrubros} soloPermuto={soloPermuto} setSoloPermuto={setSoloPermuto} />

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#9a9a9a", fontWeight: 700 }}>Cargando...</div>
      ) : (
        <>
          <Slider titulo="🕐 Recién publicados" acento="#d4a017" verTodos="/buscar" onTituloClick={() => router.push("/buscar")}>
            {recientes.map((a, i) => <TarjetaAnuncio key={a.id} a={a} esPrimero={i === 0 && (a.visitas_semana || 0) > 0} onClick={perfilHome?.id && a.usuario_id === perfilHome.id ? () => router.push("/mis-anuncios") : undefined} />)}
          </Slider>

          {/* ITEMS DE NEXOS */}
          {["novedades","productos","descargas","videos","galeria"].map(tipo => {
            const emojis: Record<string,string> = { novedades:"📢", productos:"🛒", descargas:"📥", videos:"🎬", galeria:"📸" };
            const labels: Record<string,string> = { novedades:"Novedades", productos:"Productos", descargas:"Descargas", videos:"Videos", galeria:"Galerías" };
            const items = nexoItems.filter((i: any) => i.slider_tipo === tipo);
            if (items.length === 0) return null;
            return (
              <Slider key={tipo} titulo={`${emojis[tipo]} ${labels[tipo]}`} acento="#d4a017" verTodos="/buscar">
                {items.map((item: any) => (
                  <div key={item.id} onClick={() => router.push(`/nexo/${item.nexo_id}?slider=${item.slider_tipo}`)}
                    style={{ width:"160px", flexShrink:0, background:"#fff", borderRadius:"16px", overflow:"hidden", boxShadow:"0 2px 10px rgba(0,0,0,0.08)", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
                    <div style={{ height:"100px", background: (item.miniatura_url||item.url) ? `url(${item.miniatura_url||item.url}) center/cover` : "linear-gradient(135deg,#1a2a3a,#243b55)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"32px" }}>
                      {!(item.miniatura_url||item.url) && emojis[tipo]}
                    </div>
                    <div style={{ padding:"10px" }}>
                      <div style={{ fontSize:"12px", fontWeight:800, color:"#1a2a3a", marginBottom:"4px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.titulo}</div>
                      {item.precio_bits > 0 && <div style={{ fontSize:"13px", fontWeight:900, color:"#d4a017" }}>{item.precio_bits} BIT</div>}
                      <div style={{ fontSize:"10px", color:"#9a9a9a", fontWeight:600, marginTop:"4px", display:"flex", alignItems:"center", gap:"4px" }}>
                        {item.nexo_avatar && <img src={item.nexo_avatar} style={{ width:"14px", height:"14px", borderRadius:"50%", objectFit:"cover" }} />}
                        <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.nexo_titulo}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </Slider>
            );
          })}

          {/* DESCARGAS DISPONIBLES */}
          {(() => {
            const descargas = nexoItems
              .filter((i: any) => i.slider_tipo === "descargas" || (i.precio_bits && i.precio_bits > 0))
              .slice(0, 10);
            if (descargas.length === 0) return null;
            return (
              <Slider titulo="📥 Descargas disponibles" acento="#e67e22" verTodos="/buscar">
                {descargas.map((item: any) => (
                  <div key={item.id} onClick={() => router.push(`/nexo/${item.nexo_id}?slider=${item.slider_tipo}`)}
                    style={{ width:"170px", flexShrink:0, background:"#fff", borderRadius:"16px", overflow:"hidden", boxShadow:"0 2px 10px rgba(0,0,0,0.08)", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
                    <div style={{ height:"90px", background: (item.miniatura_url||item.url) ? `url(${item.miniatura_url||item.url}) center/cover` : "linear-gradient(135deg,#1a2a3a,#243b55)", display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
                      {!(item.miniatura_url||item.url) && <span style={{ fontSize:"32px" }}>📥</span>}
                      <div style={{ position:"absolute", top:"6px", right:"6px", background: item.precio_bits > 0 ? "rgba(212,160,23,0.92)" : "rgba(39,174,96,0.92)", borderRadius:"6px", padding:"2px 8px", fontSize:"10px", fontWeight:900, color: item.precio_bits > 0 ? "#1a2a3a" : "#fff" }}>
                        {item.precio_bits > 0 ? `${item.precio_bits} BIT` : "GRATIS"}
                      </div>
                    </div>
                    <div style={{ padding:"10px" }}>
                      <div style={{ fontSize:"12px", fontWeight:800, color:"#1a2a3a", marginBottom:"4px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.titulo || "Archivo"}</div>
                      <div style={{ fontSize:"10px", color:"#9a9a9a", fontWeight:600, display:"flex", alignItems:"center", gap:"4px" }}>
                        {item.nexo_avatar && <img src={item.nexo_avatar} style={{ width:"14px", height:"14px", borderRadius:"50%", objectFit:"cover" }} />}
                        <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.nexo_titulo}</span>
                      </div>
                      {item.nexo_tipo && <div style={{ fontSize:"9px", color:"#b0b0b0", fontWeight:700, textTransform:"uppercase", marginTop:"2px" }}>{item.nexo_tipo}</div>}
                    </div>
                  </div>
                ))}
              </Slider>
            );
          })()}

          {/* GRUPOS POR SUBTIPO */}
          {SUBTIPOS_GRUPO.map(st => {
            const items = nexos.filter(n => n.tipo === "grupo" && n.subtipo === st.key).slice(0, 10);
            if (items.length === 0) return null;
            return (
              <Slider key={st.key} titulo={`${st.emoji} ${st.label}`} acento="#3a7bd5" verTodos="/grupos" onTituloClick={() => router.push("/grupos")}>
                {items.map((n, i) => <TarjetaNexo key={n.id} nexo={n} color="#3a7bd5" onClick={() => router.push(`/nexo/${n.id}`)} esPrimero={i === 0 && (n.visitas_semana || 0) > 0} />)}
              </Slider>
            );
          })}
          {(() => {
            const sinSubtipo = nexos.filter(n =>
              n.tipo === "grupo" &&
              (!n.subtipo || !SUBTIPOS_GRUPO.find(s => s.key === n.subtipo))
            );
            if (sinSubtipo.length === 0) return null;
            return (
              <Slider titulo="👥 Grupos" acento="#3a7bd5" verTodos="/grupos" onTituloClick={() => router.push("/grupos")}>
                {sinSubtipo.map((n,i) => <TarjetaNexo key={n.id} nexo={n} color="#3a7bd5" onClick={() => router.push(`/nexo/${n.id}`)} esPrimero={i===0&&(n.visitas_semana||0)>0} />)}
              </Slider>
            );
          })()}

          {sections.map(s => {
            const items = nexosByTipo[s.tipo] || [];
            if (items.length === 0) return null;
            return (
              <Slider key={s.tipo} titulo={s.titulo} acento={s.acento} verTodos={`/buscar?tipo=${s.tipo}`} onTituloClick={() => router.push(`/buscar?tipo=${s.tipo}`)}>
                {items.map((n, i) => <TarjetaNexo key={n.id} nexo={n} color={s.acento} onClick={() => router.push(s.nexoUrl(n.id))} esPrimero={i === 0 && (n.visitas_semana || 0) > 0} abierto={(n as any).abierto} />)}
              </Slider>
            );
          })}

          {anuFiltrados.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔍</div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "#1a2a3a", marginBottom: "6px" }}>Sin resultados</div>
              <button onClick={() => setSoloPermuto(false)} style={{ background: "linear-gradient(135deg,#d4a017,#f0c040)", border: "none", borderRadius: "12px", padding: "12px 24px", fontSize: "13px", fontWeight: 800, color: "#1a2a3a", cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>Ver todos</button>
            </div>
          )}
        </>
      )}

      <AyudaPopup tipo="general"/>
      {mostrarOnboarding && perfilHome && (
        <OnboardingPopup
          perfil={perfilHome}
          onClose={() => setMostrarOnboarding(false)}
        />
      )}
      <BottomNav />
    </main>
  );
}
