"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import HeroBuscador from "@/app/_components/HeroBuscador";
import Slider from "@/app/_components/Slider";
import TarjetaAnuncio from "@/app/_components/TarjetaAnuncio";
import TarjetaNexo from "@/app/_components/TarjetaNexo";
import TarjetaVacia from "@/app/_components/TarjetaVacia";
import { useHomeData } from "@/app/_hooks/useHomeData";

export default function Home() {
  const router = useRouter();
  const { anuncios, nexos, rubros, subrubros, loading } = useHomeData();
  const [soloPermuto, setSoloPermuto] = useState(false);

  const anuFiltrados = soloPermuto ? anuncios.filter(a => a.permuto) : anuncios;
  const recientes = anuFiltrados.slice(0, 12);
  const grupos    = nexos.filter(n => n.tipo === "grupo").slice(0, 10);
  const empresas  = nexos.filter(n => n.tipo === "empresa").slice(0, 10);
  const servicios = nexos.filter(n => n.tipo === "servicio").slice(0, 10);
  const trabajos  = nexos.filter(n => n.tipo === "trabajo").slice(0, 10);

  const sections: { titulo: string; acento: string; tipo: string; emoji: string; textoVacio: string; crearUrl: string; nexoUrl: (id: string) => string }[] = [
    { titulo: "🏢 Empresas",     acento: "#c0392b", tipo: "empresas",  emoji: "🏢", textoVacio: "Sé el primero en crear una empresa",    crearUrl: "/nexo/crear/empresa",  nexoUrl: id => `/nexo/${id}` },
    { titulo: "👥 Grupos",       acento: "#3a7bd5", tipo: "grupos",    emoji: "👥", textoVacio: "Sé el primero en crear un grupo",       crearUrl: "/nexo/crear/grupo",    nexoUrl: id => `/nexo/${id}` },
    { titulo: "🛠️ Servicios",   acento: "#27ae60", tipo: "servicios", emoji: "🛠️", textoVacio: "Sé el primero en ofrecer un servicio", crearUrl: "/nexo/crear/servicio", nexoUrl: id => `/nexo/${id}` },
    { titulo: "💼 Busco Trabajo", acento: "#8e44ad", tipo: "trabajo",  emoji: "💼", textoVacio: "Sé el primero en buscar trabajo",       crearUrl: "/nexo/crear/trabajo",  nexoUrl: id => `/nexo/${id}` },
  ];

  const nexosByTipo: Record<string, typeof nexos> = {
    empresas: empresas, grupos: grupos, servicios: servicios, trabajo: trabajos,
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
            {recientes.map((a, i) => <TarjetaAnuncio key={a.id} a={a} esPrimero={i === 0 && (a.visitas_semana || 0) > 0} />)}
          </Slider>

          {sections.map(s => {
            const items = nexosByTipo[s.tipo] || [];
            return (
              <Slider key={s.tipo} titulo={s.titulo} acento={s.acento} verTodos={`/buscar?tipo=${s.tipo}`} onTituloClick={() => router.push(`/buscar?tipo=${s.tipo}`)}>
                {items.length > 0
                  ? items.map((n, i) => <TarjetaNexo key={n.id} nexo={n} color={s.acento} onClick={() => router.push(s.nexoUrl(n.id))} esPrimero={i === 0 && (n.visitas_semana || 0) > 0} />)
                  : [<TarjetaVacia key="vacia" emoji={s.emoji} texto={s.textoVacio} color={s.acento} onClick={() => router.push(s.crearUrl)} />]
                }
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

      <BottomNav />
    </main>
  );
}
