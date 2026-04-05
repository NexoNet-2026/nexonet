"use client";
import { useRef, useEffect } from "react";

interface Props {
  nombreUsuario: string;
  codigo: string;
}

export default function BannerPromotor({ nombreUsuario, codigo }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 1080;
    canvas.height = 1200;

    // Fondo degradado
    const grad = ctx.createLinearGradient(0, 0, 1080, 1080);
    grad.addColorStop(0, "#0f1923");
    grad.addColorStop(0.5, "#1a2a3a");
    grad.addColorStop(1, "#0a1520");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1200);

    // Círculos decorativos
    ctx.beginPath();
    ctx.arc(900, 150, 280, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(212,160,23,0.06)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(150, 900, 220, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(212,160,23,0.04)";
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

    // Línea dorada
    ctx.beginPath();
    ctx.moveTo(80, 210);
    ctx.lineTo(1000, 210);
    ctx.strokeStyle = "rgba(212,160,23,0.3)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Texto principal
    ctx.textAlign = "center";
    ctx.font = "bold 58px Arial";
    ctx.fillStyle = "#fff";
    ctx.fillText(`${nombreUsuario}`, 540, 380);

    ctx.font = "38px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillText("te invita a ser parte de", 540, 450);

    // Texto NexoNet grande
    ctx.font = "bold 110px Arial";
    ctx.fillStyle = "#d4a017";
    ctx.fillText("NexoNet", 540, 590);

    ctx.font = "36px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.fillText("La red social argentina de conexiones reales", 540, 650);

    // Separador
    ctx.beginPath();
    ctx.moveTo(200, 710);
    ctx.lineTo(880, 710);
    ctx.strokeStyle = "rgba(212,160,23,0.25)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Beneficios
    const beneficios = ["🎁 3.000 BIT gratis al registrarte", "📣 Publicá anuncios y conectate", "🏢 Creá tu empresa digital"];
    ctx.font = "30px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    beneficios.forEach((b, i) => {
      ctx.fillText(b, 540, 770 + i * 52);
    });

    // Caja código
    ctx.fillStyle = "rgba(212,160,23,0.12)";
    ctx.beginPath();
    ctx.roundRect(200, 940, 680, 100, 20);
    ctx.fill();
    ctx.strokeStyle = "rgba(212,160,23,0.5)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = "24px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText("Registrate en nexonet.ar con el código", 540, 978);
    ctx.font = "bold 38px Arial";
    ctx.fillStyle = "#d4a017";
    ctx.fillText(codigo, 540, 1022);

    // Botón "Registrate gratis"
    const btnGrad = ctx.createLinearGradient(200, 1070, 880, 1070);
    btnGrad.addColorStop(0, "#d4a017");
    btnGrad.addColorStop(1, "#f0c040");
    ctx.fillStyle = btnGrad;
    ctx.beginPath();
    ctx.roundRect(200, 1070, 680, 80, 20);
    ctx.fill();
    ctx.font = "bold 36px Arial";
    ctx.fillStyle = "#1a2a3a";
    ctx.textAlign = "center";
    ctx.fillText("🎁 Registrate gratis", 540, 1122);

  }, [nombreUsuario, codigo]);

  const descargar = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `nexonet-invitacion-${nombreUsuario}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const compartir = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `nexonet-${nombreUsuario}.png`, { type:"image/png" });
      const link = `https://nexonet.ar/registro?ref=${codigo}`;
      if (navigator.share && navigator.canShare({ files:[file] })) {
        await navigator.share({
          title: "Unite a NexoNet",
          text: `${nombreUsuario} te invita a NexoNet Argentina 🇦🇷\n\nRegistrate con mi código y empezá con 3.000 BIT gratis!\n${link}`,
          files: [file],
        });
      } else {
        descargar();
        await navigator.clipboard.writeText(link);
        alert("✅ Banner descargado y link copiado");
      }
    }, "image/png");
  };

  return (
    <div style={{ fontFamily:"'Nunito',sans-serif" }}>
      <canvas ref={canvasRef} style={{ width:"100%", borderRadius:"16px", display:"block" }} />
      <a href={`https://nexonet.ar/registro?ref=${codigo}`} target="_blank" rel="noopener noreferrer"
        style={{ display:"block", marginTop:"12px", background:"linear-gradient(135deg,#d4a017,#f0c040)", border:"none", borderRadius:"12px", padding:"14px", fontSize:"15px", fontWeight:900, color:"#1a2a3a", cursor:"pointer", fontFamily:"'Nunito',sans-serif", textAlign:"center", textDecoration:"none", boxShadow:"0 3px 0 #a07810" }}>
        🎁 Registrate gratis
      </a>
      <div style={{ display:"flex", gap:"10px", marginTop:"10px" }}>
        <button onClick={compartir}
          style={{ flex:2, background:"linear-gradient(135deg,#d4a017,#f0c040)", border:"none", borderRadius:"12px", padding:"14px", fontSize:"14px", fontWeight:900, color:"#1a2a3a", cursor:"pointer", fontFamily:"'Nunito',sans-serif", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px" }}>
          📤 Compartir banner
        </button>
        <button onClick={descargar}
          style={{ flex:1, background:"rgba(212,160,23,0.15)", border:"2px solid rgba(212,160,23,0.4)", borderRadius:"12px", padding:"14px", fontSize:"14px", fontWeight:800, color:"#d4a017", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
          ⬇️ Guardar
        </button>
      </div>
    </div>
  );
}
