"use client";
import { useRef, useEffect } from "react";

type TipoBanner = "empresa" | "servicio" | "grupo" | "trabajo" | "anuncio";

interface Props {
  tipo: TipoBanner;
  titulo: string;
  nombreUsuario: string;
  destino: string; // URL path: /nexo/{id} o /anuncios/{id}
}

const SUBTEXTOS: Record<TipoBanner, (t: string) => string> = {
  empresa:  (t) => `${t} te invita a ver su negocio`,
  servicio: (t) => `${t} te invita a ver sus servicios`,
  grupo:    (t) => `${t} te invita a unirte`,
  trabajo:  (t) => `${t} busca trabajo en NexoNet`,
  anuncio:  (t) => `${t} te invita a ver su anuncio`,
};

const TIPO_EMOJI: Record<TipoBanner, string> = {
  empresa: "🏢", servicio: "🛠️", grupo: "👥", trabajo: "💼", anuncio: "📣",
};

const TIPO_COLOR: Record<TipoBanner, string> = {
  empresa: "#c0392b", servicio: "#27ae60", grupo: "#3a7bd5", trabajo: "#8e44ad", anuncio: "#d4a017",
};

export default function BannerCompartir({ tipo, titulo, nombreUsuario, destino }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const url = `nexonet.ar${destino}`;
  const fullUrl = `https://${url}`;

  useEffect(() => {
    console.log('BANNER tipo:', tipo, 'titulo:', titulo, 'destino:', destino);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 1080;
    canvas.height = 1200;

    // Fondo
    const grad = ctx.createLinearGradient(0, 0, 1080, 1200);
    grad.addColorStop(0, "#0f1923");
    grad.addColorStop(0.5, "#1a2a3a");
    grad.addColorStop(1, "#0a1520");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1200);

    // Círculos decorativos
    ctx.beginPath();
    ctx.arc(900, 150, 280, 0, Math.PI * 2);
    ctx.fillStyle = `${TIPO_COLOR[tipo]}15`;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(150, 900, 220, 0, Math.PI * 2);
    ctx.fillStyle = `${TIPO_COLOR[tipo]}10`;
    ctx.fill();

    // Logo NEXONET
    ctx.font = "bold 90px Arial";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "left";
    ctx.fillText("NEXO", 80, 140);
    ctx.fillStyle = "#d4a017";
    ctx.fillText("NET", 80 + ctx.measureText("NEXO").width, 140);
    ctx.font = "28px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.fillText("ARGENTINA", 82, 175);

    // Línea
    ctx.beginPath();
    ctx.moveTo(80, 210);
    ctx.lineTo(1000, 210);
    ctx.strokeStyle = "rgba(212,160,23,0.3)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Badge tipo
    ctx.textAlign = "center";
    ctx.font = "bold 28px Arial";
    ctx.fillStyle = TIPO_COLOR[tipo];
    ctx.fillText(`${TIPO_EMOJI[tipo]} ${tipo.toUpperCase()}`, 540, 290);

    // Título del nexo/anuncio
    ctx.font = "bold 72px Arial";
    ctx.fillStyle = "#fff";
    const tituloCorto = titulo.length > 20 ? titulo.slice(0, 20) + "…" : titulo;
    ctx.fillText(tituloCorto, 540, 400);

    // Subtexto
    ctx.font = "36px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillText(SUBTEXTOS[tipo](nombreUsuario), 540, 470);

    // NexoNet grande
    ctx.font = "bold 100px Arial";
    ctx.fillStyle = "#d4a017";
    ctx.fillText("NexoNet", 540, 610);

    ctx.font = "34px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillText("La red social argentina de conexiones reales", 540, 670);

    // Separador
    ctx.beginPath();
    ctx.moveTo(200, 720);
    ctx.lineTo(880, 720);
    ctx.strokeStyle = "rgba(212,160,23,0.25)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Beneficios
    const beneficios = ["🎁 3.000 BIT gratis al registrarte", "📣 Publicá anuncios y conectate", "🏢 Creá tu empresa digital"];
    ctx.font = "30px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    beneficios.forEach((b, i) => {
      ctx.fillText(b, 540, 790 + i * 52);
    });

    // Botón "Ver en NexoNet"
    const btnGrad = ctx.createLinearGradient(200, 1070, 880, 1070);
    btnGrad.addColorStop(0, "#d4a017");
    btnGrad.addColorStop(1, "#f0c040");
    ctx.fillStyle = btnGrad;
    ctx.beginPath();
    ctx.roundRect(200, 1070, 680, 80, 20);
    ctx.fill();
    ctx.font = "bold 36px Arial";
    ctx.fillStyle = "#1a2a3a";
    ctx.fillText("Ver en NexoNet →", 540, 1122);

  }, [tipo, titulo, nombreUsuario, destino]);

  const descargar = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `nexonet-${tipo}-${titulo.replace(/\s+/g, "-").slice(0, 30)}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const compartir = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `nexonet-${tipo}-${titulo.replace(/\s+/g, "-").slice(0, 30)}.png`, { type: "image/png" });
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: titulo,
          text: `${SUBTEXTOS[tipo](nombreUsuario)}\n\n${fullUrl}`,
          files: [file],
        });
      } else {
        descargar();
        await navigator.clipboard.writeText(fullUrl);
        alert("✅ Banner descargado y link copiado");
      }
    }, "image/png");
  };

  return (
    <div style={{ fontFamily: "'Nunito',sans-serif" }}>
      <canvas ref={canvasRef} style={{ width: "100%", borderRadius: "16px", display: "block" }} />
      <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
        <button onClick={compartir}
          style={{ flex: 2, background: "linear-gradient(135deg,#d4a017,#f0c040)", border: "none", borderRadius: "12px", padding: "14px", fontSize: "14px", fontWeight: 900, color: "#1a2a3a", cursor: "pointer", fontFamily: "'Nunito',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          📤 Compartir banner
        </button>
        <button onClick={descargar}
          style={{ flex: 1, background: "rgba(212,160,23,0.15)", border: "2px solid rgba(212,160,23,0.4)", borderRadius: "12px", padding: "14px", fontSize: "14px", fontWeight: 800, color: "#d4a017", cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>
          ⬇️ Guardar
        </button>
      </div>
    </div>
  );
}
