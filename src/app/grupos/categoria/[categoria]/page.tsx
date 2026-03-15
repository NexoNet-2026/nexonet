"use client";
import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

type Grupo = {
  id: string; nombre: string; descripcion: string | null;
  imagen: string | null; ciudad: string | null; provincia: string | null;
  miembros_count: number; pago_ingreso_admin: boolean;
  config: any; categoria_id: number; subcategoria_id: number | null; activo: boolean;
};

type GrupoCategoria = { id: number; nombre: string; emoji: string };
type GrupoSubcategoria = { id: number; nombre: string; categoria_id: number };

export default function GruposCategoriaPage() {
  return (
    <Suspense fallback={<div style={{paddingTop:"95px",textAlign:"center",color:"#9a9a9a",fontFamily:"'Nunito',sans-serif",background:"#f4f4f2",minHeight:"100vh"}}>Cargando...</div>}>
      <GruposCategoriaInner />
    </Suspense>
  );
}

function GruposCategoriaInner() {
  const params    = useParams();
  const router    = useRouter();
  const searchP   = useSearchParams();
  const catSlug   = params?.categoria as string;

  const [categoria,     setCategoria]     = useState<GrupoCategoria | null>(null);
  const [subcategorias, setSubcategorias] = useState<GrupoSubcategoria[]>([]);
  const [grupos,        setGrupos]        = useState<Grupo[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [subSel,        setSubSel]        = useState<number | null>(null);
  const [busqueda,      setBusqueda]      = useState("");
  const [provincia,     setProvincia]     = useState(searchP?.get("provincia") || "");
  const [ciudad,        setCiudad]        = useState(searchP?.get("ciudad") || "");

  const COLOR = "#3a7bd5";

  useEffect(() => {
    const cargar = async () => {
      const { data: cats } = await supabase
        .from("grupo_categorias")
        .select("id,nombre,emoji")
        .eq("id", Number(catSlug))
        .single();

      if (!cats) { setLoading(false); return; }
      setCategoria(cats);

      // Subcategorias
      const { data: subs } = await supabase
        .from("grupo_subcategorias")
        .select("id,nombre,categoria_id")
        .eq("categoria_id", cats.id)
        .order("nombre");
      if (subs) setSubcategorias(subs);

      // Grupos de esta categoría
      const { data: gs } = await supabase
        .from("grupos")
        .select("id,nombre,descripcion,imagen,ciudad,provincia,miembros_count,pago_ingreso_admin,config,categoria_id,subcategoria_id,activo")
        .eq("activo", true)
        .eq("categoria_id", cats.id)
        .order("miembros_count", { ascending: false });
      if (gs) setGrupos(gs);

      setLoading(false);
    };
    cargar();
  }, [catSlug]);

  const gruposFiltrados = grupos.filter(g => {
    if (subSel !== null && g.subcategoria_id !== subSel) return false;
    if (busqueda && !g.nombre.toLowerCase().includes(busqueda.toLowerCase())) return false;
    if (provincia && g.provincia !== provincia) return false;
    if (ciudad && g.ciudad !== ciudad) return false;
    return true;
  });

  const acceso = (g: Grupo) => {
    const tipo = g.config?.tipo_acceso || "libre";
    if (tipo === "pago") return { label:"💰 Pago", color:"#d4a017" };
    if (tipo === "aprobacion") return { label:"⏳ Solicitar", color:"#e67e22" };
    return { label:"Unirse →", color:"#27ae60" };
  };

  if (loading) return (
    <main style={{paddingTop:"95px",paddingBottom:"130px",background:"#f4f4f2",minHeight:"100vh",fontFamily:"'Nunito',sans-serif"}}>
      <Header /><div style={{textAlign:"center",padding:"60px",color:"#9a9a9a",fontWeight:700}}>Cargando...</div><BottomNav />
    </main>
  );

  if (!categoria) return (
    <main style={{paddingTop:"95px",paddingBottom:"130px",background:"#f4f4f2",minHeight:"100vh",fontFamily:"'Nunito',sans-serif"}}>
      <Header /><div style={{textAlign:"center",padding:"60px",color:"#9a9a9a",fontWeight:700}}>Categoría no encontrada</div><BottomNav />
    </main>
  );

  return (
    <main style={{paddingTop:"95px",paddingBottom:"130px",background:"#f4f4f2",minHeight:"100vh",fontFamily:"'Nunito',sans-serif"}}>
      <Header />

      {/* HEADER */}
      <div style={{background:"linear-gradient(135deg,#1a2a3a,#243b55)",padding:"16px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"12px"}}>
          <button onClick={()=>router.back()}
            style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:"10px",padding:"8px 14px",color:"#fff",fontSize:"13px",fontWeight:700,cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>
            ← Volver
          </button>
          <div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"24px",color:COLOR,letterSpacing:"1px"}}>
              {categoria.emoji} {categoria.nombre}
            </div>
            <div style={{fontSize:"12px",color:"rgba(255,255,255,0.5)",fontWeight:600}}>
              {gruposFiltrados.length} grupo{gruposFiltrados.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        {/* BUSCADOR */}
        <div style={{display:"flex",gap:"8px"}}>
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder={`Buscar en ${categoria.nombre}...`}
            style={{flex:1,background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:"12px",padding:"11px 16px",fontSize:"14px",color:"#fff",fontFamily:"'Nunito',sans-serif",outline:"none"}}
          />
          <button onClick={()=>router.push(`/buscar?tipo=grupos`)}
            style={{background:COLOR,border:"none",borderRadius:"12px",padding:"11px 16px",fontSize:"20px",cursor:"pointer"}}>
            🗺️
          </button>
        </div>
      </div>

      {/* SUBCATEGORÍAS */}
      {subcategorias.length > 0 && (
        <div style={{background:"#fff",padding:"12px 16px",borderBottom:"2px solid #f0f0f0",overflowX:"auto",whiteSpace:"nowrap",scrollbarWidth:"none"}}>
          <button onClick={()=>setSubSel(null)}
            style={{display:"inline-block",marginRight:"8px",padding:"6px 14px",borderRadius:"20px",border:`2px solid ${subSel===null?COLOR:"#e8e8e6"}`,background:subSel===null?COLOR:"#fff",color:subSel===null?"#fff":"#1a2a3a",fontSize:"12px",fontWeight:800,cursor:"pointer",fontFamily:"'Nunito',sans-serif",whiteSpace:"nowrap"}}>
            Todos
          </button>
          {subcategorias.map(s => (
            <button key={s.id} onClick={()=>setSubSel(subSel===s.id?null:s.id)}
              style={{display:"inline-block",marginRight:"8px",padding:"6px 14px",borderRadius:"20px",border:`2px solid ${subSel===s.id?COLOR:"#e8e8e6"}`,background:subSel===s.id?COLOR:"#fff",color:subSel===s.id?"#fff":"#1a2a3a",fontSize:"12px",fontWeight:800,cursor:"pointer",fontFamily:"'Nunito',sans-serif",whiteSpace:"nowrap"}}>
              {s.nombre}
            </button>
          ))}
        </div>
      )}

      {/* LISTA DE GRUPOS */}
      <div style={{padding:"12px 16px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
        {gruposFiltrados.length === 0 && (
          <div style={{gridColumn:"1/-1",textAlign:"center",padding:"60px 20px"}}>
            <div style={{fontSize:"48px",marginBottom:"12px"}}>👥</div>
            <div style={{fontSize:"16px",fontWeight:900,color:"#1a2a3a",marginBottom:"6px"}}>No hay grupos en esta categoría</div>
            <button onClick={()=>router.push("/publicar")}
              style={{background:`linear-gradient(135deg,${COLOR}cc,${COLOR})`,border:"none",borderRadius:"12px",padding:"12px 24px",fontSize:"13px",fontWeight:900,color:"#fff",cursor:"pointer",fontFamily:"'Nunito',sans-serif",marginTop:"12px"}}>
              ➕ Crear el primero
            </button>
          </div>
        )}
        {gruposFiltrados.map(g => {
          const ac = acceso(g);
          return (
            <div key={g.id} onClick={()=>router.push(`/grupos/${g.id}`)}
              style={{background:"#fff",borderRadius:"16px",overflow:"hidden",boxShadow:"0 2px 10px rgba(0,0,0,0.06)",cursor:"pointer",border:"2px solid #e8e8e6"}}>
              {/* Imagen */}
              <div style={{height:"100px",background:"linear-gradient(135deg,#1a2a3a,#243b55)",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",position:"relative"}}>
                {g.imagen
                  ? <img src={g.imagen} alt={g.nombre} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  : <span style={{fontSize:"40px",opacity:0.4}}>{categoria.emoji}</span>
                }
                <div style={{position:"absolute",top:"6px",right:"6px",background:g.pago_ingreso_admin?"rgba(192,57,43,0.85)":"rgba(37,99,62,0.85)",borderRadius:"6px",padding:"2px 8px",fontSize:"9px",fontWeight:800,color:"#fff"}}>
                  {g.pago_ingreso_admin?"🔒":"🟢"}
                </div>
              </div>
              {/* Info */}
              <div style={{padding:"10px 12px"}}>
                <div style={{fontSize:"13px",fontWeight:900,color:"#1a2a3a",marginBottom:"4px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.nombre}</div>
                {g.descripcion && (
                  <div style={{fontSize:"11px",color:"#9a9a9a",fontWeight:600,marginBottom:"6px",overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" as any}}>
                    {g.descripcion}
                  </div>
                )}
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span style={{fontSize:"10px",color:"#9a9a9a",fontWeight:600}}>👥 {g.miembros_count || 0}</span>
                  <span style={{fontSize:"10px",fontWeight:900,color:ac.color,background:`${ac.color}15`,padding:"3px 10px",borderRadius:"20px"}}>
                    {ac.label}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* BOTÓN CREAR */}
      <div style={{padding:"0 16px 16px"}}>
        <button onClick={()=>router.push(`/publicar`)}
          style={{width:"100%",background:"linear-gradient(135deg,#1a2a3a,#243b55)",border:"2px dashed rgba(58,123,213,0.4)",borderRadius:"16px",padding:"16px",fontSize:"13px",fontWeight:800,color:COLOR,cursor:"pointer",fontFamily:"'Nunito',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px"}}>
          ➕ Crear grupo en {categoria.nombre}
        </button>
      </div>

      <BottomNav />
    </main>
  );
}
