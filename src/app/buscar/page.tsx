CAMBIOS A APLICAR EN src/app/buscar/page.tsx:

── 1. REEMPLAZAR el estado de bits (línea ~45) ──────────────────────────────

// ANTES:
const [bits, setBits] = useState(0);

// DESPUÉS:
const [bitsNexo,  setBitsNexo]  = useState(0);
const [bitsFree,  setBitsFree]  = useState(0);
const [bitsPromo, setBitsPromo] = useState(0);
const bits = bitsNexo + bitsFree + bitsPromo; // total para mostrar


── 2. REEMPLAZAR la carga de bits en useEffect (línea ~52) ──────────────────

// ANTES:
supabase.from("usuarios").select("bits,bits_free,bits_promo").eq("id", s.user.id).single()
  .then(({ data }) => {
    if (data) setBits(Math.max(0,data.bits||0)+Math.max(0,data.bits_free||0)+Math.max(0,data.bits_promo||0));
  });

// DESPUÉS:
supabase.from("usuarios").select("bits,bits_free,bits_promo").eq("id", s.user.id).single()
  .then(({ data }) => {
    if (data) {
      setBitsNexo(Math.max(0, data.bits || 0));
      setBitsFree(Math.max(0, data.bits_free || 0));
      setBitsPromo(Math.max(0, data.bits_promo || 0));
    }
  });


── 3. REEMPLAZAR ejecutarConexion (buscar la función) ───────────────────────

// ANTES:
const ejecutarConexion = async () => {
  ...
  await supabase.from("usuarios").update({ bits: bits - ids.length }).eq("id", session.user.id);
  setBits(prev => prev - ids.length);
  ...
};

// DESPUÉS: recibe el metodo como parámetro
const ejecutarConexion = async (metodo: MetodoPago) => {
  if (seleccionados.size === 0) return;
  setConectando(true);
  const ids = Array.from(seleccionados);
  const costo = ids.length;

  // Verificar saldo según método
  if (metodo === "bit_free" && bitsFree < costo) {
    alert(`No tenés suficientes BIT FREE. Necesitás ${costo}, tenés ${bitsFree}.`);
    setConectando(false); return;
  }
  if (metodo === "bit_nexo" && bitsNexo < costo) {
    alert(`No tenés suficientes BIT Nexo. Necesitás ${costo}, tenés ${bitsNexo}.`);
    setConectando(false); return;
  }

  const { data: anuData } = await supabase.from("anuncios").select("id,usuario_id,conexiones").in("id", ids);
  if (anuData) {
    await Promise.all(anuData.map((a:any) => supabase.from("anuncios").update({ conexiones: (a.conexiones||0)+1 }).eq("id",a.id)));
    await supabase.from("notificaciones").insert(anuData.map((a:any) => ({
      usuario_id: a.usuario_id, emisor_id: session.user.id,
      anuncio_id: a.id, tipo: "conexion", mensaje: mensajeConexion
    })));

    // Descontar del bolsillo correcto
    if (metodo === "bit_free") {
      await supabase.from("usuarios").update({ bits_free: bitsFree - costo }).eq("id", session.user.id);
      setBitsFree(prev => prev - costo);
    } else if (metodo === "bit_nexo") {
      await supabase.from("usuarios").update({ bits: bitsNexo - costo }).eq("id", session.user.id);
      setBitsNexo(prev => prev - costo);
    }

    for (const a of anuData) {
      const anuncio = anuncios.find(x => x.id === a.id);
      if (anuncio?.owner_whatsapp) { abrirWA(anuncio.owner_whatsapp, anuncio.id, anuncio.titulo); break; }
    }
  }
  setResultadoConex(`✅ Mensaje enviado a ${ids.length} anuncio${ids.length!==1?"s":""}. Usaste ${ids.length} BIT.`);
  setConectando(false); setSeleccionados(new Set()); setMensajeConexion(MENSAJES_PRESET[0]);
  setTimeout(() => cancelarConexion(), 3000);
};


── 4. REEMPLAZAR el PopupCompra (cerca del final) ───────────────────────────

// ANTES:
{popupPago && (
  <PopupCompra
    ...
    bits={{ free: bits, nexo: 0, promo: 0 }}
    ...
    onPagar={async (metodo: MetodoPago) => {
      setPopupPago(false);
      if (metodo === "bit_free" || metodo === "bit_nexo") await ejecutarConexion();
      else alert("Próximamente");
    }}
  />
)}

// DESPUÉS:
{popupPago && (
  <PopupCompra
    titulo={`Conectar con ${seleccionados.size} anuncio${seleccionados.size!==1?"s":""}`}
    emoji="🔗" costo={`${seleccionados.size} BIT`}
    descripcion="Se enviará tu mensaje a los anuncios seleccionados"
    bits={{ free: bitsFree, nexo: bitsNexo, promo: bitsPromo }}
    onClose={() => setPopupPago(false)}
    onPagar={async (metodo: MetodoPago) => {
      setPopupPago(false);
      if (metodo === "bit_free" || metodo === "bit_nexo") await ejecutarConexion(metodo);
      else alert("Próximamente");
    }}
  />
)}
