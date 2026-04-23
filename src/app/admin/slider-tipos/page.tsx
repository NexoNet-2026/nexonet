"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type SliderTipo = {
  id: number;
  codigo: string;
  label: string;
  icono: string;
  descripcion_publica: string | null;
  descripcion_admin: string | null;
  activo: boolean;
  orden: number;
  created_at: string;
};

type UsoPorCodigo = Record<string, number>;

export default function AdminSliderTiposPage() {
  const router = useRouter();

  const [authed, setAuthed]                 = useState(false);
  const [loading, setLoading]               = useState(true);
  const [tipos, setTipos]                   = useState<SliderTipo[]>([]);
  const [usoSubrubros, setUsoSubrubros]     = useState<UsoPorCodigo>({});
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [toast, setToast]                   = useState<string | null>(null);

  const [showCrear, setShowCrear]           = useState(false);
  const [editando, setEditando]             = useState<SliderTipo | null>(null);

  const [nCodigo, setNCodigo]   = useState("");
  const [nLabel, setNLabel]     = useState("");
  const [nIcono, setNIcono]     = useState("");
  const [nDescPub, setNDescPub] = useState("");
  const [nDescAdm, setNDescAdm] = useState("");
  const [nOrden, setNOrden]     = useState(0);
  const [nActivo, setNActivo]   = useState(true);
  const [errCrear, setErrCrear] = useState<string | null>(null);

  const [eLabel, setELabel]     = useState("");
  const [eIcono, setEIcono]     = useState("");
  const [eDescPub, setEDescPub] = useState("");
  const [eDescAdm, setEDescAdm] = useState("");
  const [eOrden, setEOrden]     = useState(0);
  const [eActivo, setEActivo]   = useState(true);
  const [errEditar, setErrEditar] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push("/login"); return; }
      const { data: u } = await supabase
        .from("usuarios")
        .select("es_admin_sistema")
        .eq("id", session.user.id)
        .single();
      if (!u?.es_admin_sistema) { router.push("/"); return; }
      setAuthed(true);
      cargar();
    });
  }, []);

  const cargar = async () => {
    setLoading(true);
    const [{ data: catalogoData }, { data: subrubrosData }] = await Promise.all([
      supabase.from("slider_tipos").select("*").order("orden", { ascending: true }).order("codigo", { ascending: true }),
      supabase.from("empresa_subrubros").select("sliders_sugeridos"),
    ]);

    const uso: UsoPorCodigo = {};
    (subrubrosData || []).forEach((s: any) => {
      const codigos: string[] = s.sliders_sugeridos || [];
      codigos.forEach(c => { uso[c] = (uso[c] || 0) + 1; });
    });

    setTipos((catalogoData || []) as SliderTipo[]);
    setUsoSubrubros(uso);
    setLoading(false);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const abrirCrear = () => {
    setNCodigo(""); setNLabel(""); setNIcono(""); setNDescPub(""); setNDescAdm("");
    const maxOrden = tipos.reduce((m, t) => Math.max(m, t.orden), 0);
    setNOrden(maxOrden + 1);
    setNActivo(true);
    setErrCrear(null);
    setShowCrear(true);
  };

  const validarCodigoNuevo = (c: string): string | null => {
    const v = c.trim();
    if (!v) return "El código es obligatorio";
    if (!/^[a-z][a-z0-9_]*$/.test(v)) return "Código inválido: minúsculas, números y guión bajo, empezando con letra (ej: lista_precios)";
    if (tipos.some(t => t.codigo === v)) return "Ya existe un tipo con ese código";
    return null;
  };

  const crear = async () => {
    const errCod = validarCodigoNuevo(nCodigo);
    if (errCod)         { setErrCrear(errCod); return; }
    if (!nLabel.trim()) { setErrCrear("El label es obligatorio"); return; }
    if (!nIcono.trim()) { setErrCrear("El ícono es obligatorio"); return; }

    const { error } = await supabase.from("slider_tipos").insert({
      codigo:              nCodigo.trim(),
      label:               nLabel.trim(),
      icono:               nIcono.trim(),
      descripcion_publica: nDescPub.trim() || null,
      descripcion_admin:   nDescAdm.trim() || null,
      orden:               nOrden,
      activo:              nActivo,
    });
    if (error) { setErrCrear("Error al crear: " + error.message); return; }
    setShowCrear(false);
    showToast("Tipo creado ✓");
    cargar();
  };

  const abrirEditar = (t: SliderTipo) => {
    setEditando(t);
    setELabel(t.label);
    setEIcono(t.icono);
    setEDescPub(t.descripcion_publica || "");
    setEDescAdm(t.descripcion_admin || "");
    setEOrden(t.orden);
    setEActivo(t.activo);
    setErrEditar(null);
  };

  const guardarEdicion = async () => {
    if (!editando) return;
    if (!eLabel.trim()) { setErrEditar("El label es obligatorio"); return; }
    if (!eIcono.trim()) { setErrEditar("El ícono es obligatorio"); return; }

    if (!eActivo && editando.activo) {
      const n = usoSubrubros[editando.codigo] || 0;
      if (n > 0) {
        const ok = confirm(
          `"${editando.label}" está sugerido en ${n} subrubro${n !== 1 ? "s" : ""}.\n\n` +
          `Si lo desactivás, los usuarios ya no podrán elegirlo en nuevos nexos ` +
          `(los nexos existentes no se rompen).\n\n¿Continuar?`
        );
        if (!ok) return;
      }
    }

    const { error } = await supabase.from("slider_tipos").update({
      label:               eLabel.trim(),
      icono:               eIcono.trim(),
      descripcion_publica: eDescPub.trim() || null,
      descripcion_admin:   eDescAdm.trim() || null,
      orden:               eOrden,
      activo:              eActivo,
    }).eq("id", editando.id);
    if (error) { setErrEditar("Error al guardar: " + error.message); return; }
    setEditando(null);
    showToast("Cambios guardados ✓");
    cargar();
  };

  const toggleActivo = async (t: SliderTipo) => {
    const nuevo = !t.activo;
    if (!nuevo) {
      const n = usoSubrubros[t.codigo] || 0;
      if (n > 0) {
        const ok = confirm(
          `"${t.label}" está sugerido en ${n} subrubro${n !== 1 ? "s" : ""}.\n\n` +
          `Si lo desactivás, los usuarios ya no podrán elegirlo en nuevos nexos ` +
          `(los nexos existentes no se rompen).\n\n¿Continuar?`
        );
        if (!ok) return;
      }
    }
    const { error } = await supabase.from("slider_tipos").update({ activo: nuevo }).eq("id", t.id);
    if (error) { showToast("Error: " + error.message); return; }
    showToast(nuevo ? "Tipo activado ✓" : "Tipo desactivado ✓");
    cargar();
  };

  const tiposVisibles  = tipos.filter(t => mostrarInactivos || t.activo);
  const totalActivos   = tipos.filter(t => t.activo).length;
  const totalInactivos = tipos.length - totalActivos;

  if (!authed) return (
    <div style={{...S.page, textAlign:"center", paddingTop:100, color:"#9a9a9a"}}>
      Verificando acceso...
    </div>
  );

  return (
    <div style={S.page}>

      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
        <button onClick={() => router.push("/admin")} style={S.btnVolver}>← Admin</button>
        <div style={S.titulo}>Catálogo de sliders</div>
      </div>

      <div style={{...S.card, display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, flexWrap:"wrap", gap:10}}>
        <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13,fontWeight:700,color:"#666"}}>
          <input type="checkbox" checked={mostrarInactivos} onChange={e=>setMostrarInactivos(e.target.checked)} style={{width:16,height:16,cursor:"pointer"}}/>
          Mostrar inactivos ({totalInactivos})
        </label>
        <button onClick={abrirCrear} style={S.btn("#27ae60")}>➕ Nuevo tipo</button>
      </div>

      {loading ? (
        <div style={{...S.card, textAlign:"center", color:"#9a9a9a"}}>Cargando catálogo...</div>
      ) : tiposVisibles.length === 0 ? (
        <div style={{...S.card, textAlign:"center", color:"#9a9a9a"}}>
          {mostrarInactivos ? "No hay tipos en el catálogo." : "No hay tipos activos. Marcá \"Mostrar inactivos\" para ver los desactivados."}
        </div>
      ) : (
        <div style={{...S.card, padding:0, overflow:"hidden"}}>
          <div style={{...S.tablaRow, padding:"10px 14px", fontWeight:900, fontSize:10, color:"#9a9a9a", textTransform:"uppercase" as const, letterSpacing:"1px", borderBottom:"2px solid #e8e8e6", background:"#fafafa"}}>
            <div style={{width:30}}>#</div>
            <div style={{width:32}}></div>
            <div style={{flex:1.5, minWidth:0}}>Código / Label</div>
            <div style={{flex:1.5, minWidth:0}}>Descripción pública</div>
            <div style={{width:60, textAlign:"center" as const}}>Uso</div>
            <div style={{width:56, textAlign:"center" as const}}>Activo</div>
            <div style={{width:70}}></div>
          </div>
          {tiposVisibles.map(t => {
            const usos = usoSubrubros[t.codigo] || 0;
            return (
              <div key={t.id} style={{...S.tablaRow, padding:"12px 14px", opacity:t.activo?1:0.55, borderBottom:"1px solid #f0f0f0"}}>
                <div style={{width:30, fontSize:12, fontWeight:700, color:"#9a9a9a"}}>{t.orden}</div>
                <div style={{width:32, fontSize:22, lineHeight:1}}>{t.icono}</div>
                <div style={{flex:1.5, minWidth:0}}>
                  <div style={{fontSize:13, fontWeight:800, color:"#1a2a3a"}}>{t.label}</div>
                  <div style={{fontSize:10, fontWeight:700, color:"#9a9a9a", letterSpacing:"0.3px", fontFamily:"monospace"}}>{t.codigo}</div>
                </div>
                <div style={{flex:1.5, minWidth:0, fontSize:12, color:"#666", fontWeight:600}}>
                  {t.descripcion_publica || <span style={{color:"#c0392b", fontStyle:"italic", fontSize:11}}>(sin descripción)</span>}
                </div>
                <div style={{width:60, textAlign:"center" as const, fontSize:11, fontWeight:800, color:usos>0?"#27ae60":"#ccc"}}>
                  {usos > 0 ? `${usos} sub` : "—"}
                </div>
                <div style={{width:56, textAlign:"center" as const}}>
                  <div
                    onClick={(e) => { e.stopPropagation(); toggleActivo(t); }}
                    style={{display:"inline-block",width:40,height:22,borderRadius:11,background:t.activo?"#27ae60":"#bbb",position:"relative",cursor:"pointer",transition:"background 0.15s"}}
                    title={t.activo ? "Desactivar" : "Activar"}
                  >
                    <div style={{position:"absolute",top:3,width:16,height:16,borderRadius:"50%",background:"#fff",boxShadow:"0 1px 3px rgba(0,0,0,0.2)",left:t.activo?21:3, transition:"left 0.15s"}}/>
                  </div>
                </div>
                <div style={{width:70, textAlign:"right" as const}}>
                  <button onClick={() => abrirEditar(t)} style={S.btnMini}>Editar</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && tipos.length > 0 && (
        <div style={{fontSize:11, color:"#9a9a9a", fontWeight:600, marginTop:12, textAlign:"center" as const}}>
          {totalActivos} activo{totalActivos!==1?"s":""} · {totalInactivos} inactivo{totalInactivos!==1?"s":""} · {tipos.length} total
        </div>
      )}

      {toast && (
        <div style={{position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",background:"#1a2a3a",color:"#fff",padding:"12px 22px",borderRadius:12,fontSize:13,fontWeight:800,boxShadow:"0 4px 20px rgba(0,0,0,0.3)",zIndex:600,fontFamily:"'Nunito',sans-serif"}}>
          {toast}
        </div>
      )}

      {showCrear && (
        <ModalOverlay onClose={()=>setShowCrear(false)}>
          <div style={S.modalTitulo}>➕ Nuevo tipo de slider</div>
          {errCrear && <div style={S.errorBox}>{errCrear}</div>}
          <div style={S.label}>Código *</div>
          <input value={nCodigo} onChange={e=>setNCodigo(e.target.value.toLowerCase())} placeholder="ej: lista_precios" style={{...S.input, fontFamily:"monospace"}}/>
          <div style={S.hint}>Minúsculas, números y guión bajo. No editable después de crear.</div>
          <div style={S.label}>Ícono (emoji) *</div>
          <input value={nIcono} onChange={e=>setNIcono(e.target.value)} placeholder="📸" maxLength={4} style={{...S.input, fontSize:24, textAlign:"center" as const}}/>
          <div style={S.label}>Label *</div>
          <input value={nLabel} onChange={e=>setNLabel(e.target.value)} placeholder="ej: Lista de precios" style={S.input}/>
          <div style={S.label}>Descripción pública</div>
          <input value={nDescPub} onChange={e=>setNDescPub(e.target.value)} placeholder="Lo que ve el dueño (ej: Precios y tarifas)" style={S.input}/>
          <div style={S.label}>Descripción admin (interna)</div>
          <textarea value={nDescAdm} onChange={e=>setNDescAdm(e.target.value)} placeholder="Notas internas sobre cuándo usar este tipo..." rows={3} style={{...S.input, resize:"vertical" as any}}/>
          <div style={S.label}>Orden</div>
          <input type="number" value={nOrden} onChange={e=>setNOrden(parseInt(e.target.value)||0)} style={S.input}/>
          <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",marginTop:8,marginBottom:4}}>
            <input type="checkbox" checked={nActivo} onChange={e=>setNActivo(e.target.checked)} style={{width:18,height:18,cursor:"pointer"}}/>
            <span style={{fontSize:13, fontWeight:700, color:"#666"}}>Activo al crear</span>
          </label>
          {(nIcono || nLabel || nDescPub) && (
            <>
              <div style={{...S.label, marginTop:16}}>Preview (como se ve en el popup)</div>
              <div style={S.preview}>
                <span style={{fontSize:22}}>{nIcono || "❓"}</span>
                <div>
                  <div style={{fontSize:13, fontWeight:800, color:"#1a2a3a"}}>{nLabel || "Sin label"}</div>
                  <div style={{fontSize:10, color:"#9a9a9a", fontWeight:600}}>{nDescPub || "(sin descripción)"}</div>
                </div>
              </div>
            </>
          )}
          <div style={{display:"flex",gap:10, marginTop:20}}>
            <button onClick={()=>setShowCrear(false)} style={{...S.btn("#bbb"), flex:1}}>Cancelar</button>
            <button onClick={crear} style={{...S.btn("#27ae60"), flex:2}}>Crear tipo</button>
          </div>
        </ModalOverlay>
      )}

      {editando && (
        <ModalOverlay onClose={()=>setEditando(null)}>
          <div style={S.modalTitulo}>✏️ Editar tipo</div>
          {errEditar && <div style={S.errorBox}>{errEditar}</div>}
          <div style={S.label}>Código (readonly)</div>
          <input value={editando.codigo} readOnly style={{...S.input, fontFamily:"monospace", background:"#f4f4f2", color:"#9a9a9a", cursor:"not-allowed"}}/>
          <div style={S.hint}>No editable. Si tiene typo, desactivá éste y creá uno nuevo.</div>
          <div style={S.label}>Ícono (emoji) *</div>
          <input value={eIcono} onChange={e=>setEIcono(e.target.value)} maxLength={4} style={{...S.input, fontSize:24, textAlign:"center" as const}}/>
          <div style={S.label}>Label *</div>
          <input value={eLabel} onChange={e=>setELabel(e.target.value)} style={S.input}/>
          <div style={S.label}>Descripción pública</div>
          <input value={eDescPub} onChange={e=>setEDescPub(e.target.value)} placeholder="Lo que ve el dueño al elegir" style={S.input}/>
          <div style={S.label}>Descripción admin (interna)</div>
          <textarea value={eDescAdm} onChange={e=>setEDescAdm(e.target.value)} rows={3} style={{...S.input, resize:"vertical" as any}}/>
          <div style={S.label}>Orden</div>
          <input type="number" value={eOrden} onChange={e=>setEOrden(parseInt(e.target.value)||0)} style={S.input}/>
          <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",marginTop:8,marginBottom:4}}>
            <input type="checkbox" checked={eActivo} onChange={e=>setEActivo(e.target.checked)} style={{width:18,height:18,cursor:"pointer"}}/>
            <span style={{fontSize:13, fontWeight:700, color:"#666"}}>Activo</span>
          </label>
          <div style={{...S.label, marginTop:16}}>Preview</div>
          <div style={S.preview}>
            <span style={{fontSize:22}}>{eIcono || "❓"}</span>
            <div>
              <div style={{fontSize:13, fontWeight:800, color:"#1a2a3a"}}>{eLabel || "Sin label"}</div>
              <div style={{fontSize:10, color:"#9a9a9a", fontWeight:600}}>{eDescPub || "(sin descripción)"}</div>
            </div>
          </div>
          {(usoSubrubros[editando.codigo] || 0) > 0 && (
            <div style={{background:"rgba(39,174,96,0.1)", border:"1px solid rgba(39,174,96,0.3)", borderRadius:8, padding:"8px 12px", color:"#27ae60", fontWeight:700, fontSize:11, marginTop:12}}>
              📌 Este tipo está sugerido en {usoSubrubros[editando.codigo]} subrubro{usoSubrubros[editando.codigo]!==1?"s":""}.
            </div>
          )}
          <div style={{display:"flex",gap:10, marginTop:20}}>
            <button onClick={()=>setEditando(null)} style={{...S.btn("#bbb"), flex:1}}>Cancelar</button>
            <button onClick={guardarEdicion} style={{...S.btn("#d4a017"), flex:2}}>Guardar cambios</button>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

function ModalOverlay({children, onClose}: {children: React.ReactNode; onClose: () => void}) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"'Nunito',sans-serif"}} onClick={onClose}>
      <div style={{background:"#fff",borderRadius:16,padding:24,maxWidth:480,width:"100%",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

const S = {
  page: { background:"#f6f5f2", minHeight:"100vh", padding:20, maxWidth:820, margin:"0 auto", fontFamily:"'Nunito', sans-serif" } as React.CSSProperties,
  titulo: { fontFamily:"'Bebas Neue', sans-serif", fontSize:32, color:"#1a2a3a", letterSpacing:"1px" } as React.CSSProperties,
  btnVolver: { background:"#9a9a9a", color:"#fff", border:"none", borderRadius:10, padding:"8px 14px", fontSize:13, fontWeight:800, cursor:"pointer", fontFamily:"'Nunito', sans-serif" } as React.CSSProperties,
  card: { background:"#fff", borderRadius:14, padding:16, boxShadow:"0 2px 10px rgba(0,0,0,0.05)" } as React.CSSProperties,
  input: { width:"100%", border:"2px solid #e8e8e6", borderRadius:10, padding:"10px 14px", fontSize:14, fontFamily:"'Nunito', sans-serif", color:"#2c2c2e", outline:"none", boxSizing:"border-box" as const, marginBottom:4 } as React.CSSProperties,
  label: { fontSize:11, fontWeight:800, color:"#666", textTransform:"uppercase" as const, letterSpacing:"1px", marginBottom:6, marginTop:12 } as React.CSSProperties,
  sect: { fontSize:11, fontWeight:900, color:"#9a9a9a", textTransform:"uppercase" as const, letterSpacing:"1px", marginBottom:14, marginTop:16 } as React.CSSProperties,
  hint: { fontSize:10, fontWeight:600, color:"#9a9a9a", marginTop:2, marginBottom:4 } as React.CSSProperties,
  btn: (color:string, disabled?:boolean): React.CSSProperties => ({ background:disabled?"#ddd":color, color:"#fff", border:"none", borderRadius:10, padding:"10px 16px", fontSize:13, fontWeight:800, cursor:disabled?"not-allowed":"pointer", fontFamily:"'Nunito', sans-serif", opacity:disabled?0.6:1 }),
  btnMini: { background:"#d4a017", color:"#fff", border:"none", borderRadius:8, padding:"6px 12px", fontSize:11, fontWeight:800, cursor:"pointer", fontFamily:"'Nunito', sans-serif" } as React.CSSProperties,
  tablaRow: { display:"flex", alignItems:"center", gap:10 } as React.CSSProperties,
  modalTitulo: { fontFamily:"'Bebas Neue', sans-serif", fontSize:24, color:"#1a2a3a", letterSpacing:"1px", marginBottom:16 } as React.CSSProperties,
  errorBox: { background:"rgba(231,76,60,0.1)", border:"1px solid rgba(231,76,60,0.3)", borderRadius:8, padding:10, fontSize:12, fontWeight:700, color:"#c0392b", marginBottom:12 } as React.CSSProperties,
  preview: { display:"flex", alignItems:"center", gap:12, background:"#f9f9f7", border:"2px solid rgba(212,160,23,0.3)", borderRadius:10, padding:12 } as React.CSSProperties,
};
