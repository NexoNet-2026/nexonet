"use client";
import { useRef, useState } from "react";

const CARD_W = 202;

export default function Slider({ titulo, acento, verTodos, onTituloClick, children }: {
  titulo: string; acento: string; verTodos: string; onTituloClick?: () => void; children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const items = Array.isArray(children) ? children : [children];
  const total = items.length;
  const [idx, setIdx] = useState(0);

  const scrollTo = (i: number) => {
    const el = ref.current; if (!el) return;
    const c = Math.max(0, Math.min(i, total - 1));
    setIdx(c);
    el.scrollTo({ left: c * CARD_W, behavior: "smooth" });
  };
  const onScroll = () => { if (ref.current) setIdx(Math.round(ref.current.scrollLeft / CARD_W)); };

  return (
    <div style={{ marginBottom: "8px", background: "#fff", paddingBottom: "12px", borderBottom: "6px solid #f4f4f2" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px 10px" }}>
        <div onClick={onTituloClick} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: onTituloClick ? "pointer" : "default" }}>
          <div style={{ width: "3px", height: "18px", background: acento, borderRadius: "2px" }} />
          <span style={{ fontSize: "16px", fontWeight: 900, color: "#1a2a3a" }}>{titulo}</span>
          {onTituloClick && <span style={{ fontSize: "13px", color: acento }}>→</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button onClick={() => scrollTo(idx - 1)} disabled={idx === 0}
            style={{ width: "28px", height: "28px", borderRadius: "50%", border: `2px solid ${acento}`, background: idx === 0 ? "transparent" : acento, color: idx === 0 ? acento : "#1a2a3a", fontSize: "13px", cursor: idx === 0 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: idx === 0 ? 0.35 : 1 }}>‹</button>
          <button onClick={() => scrollTo(idx + 1)} disabled={idx >= total - 1}
            style={{ width: "28px", height: "28px", borderRadius: "50%", border: `2px solid ${acento}`, background: idx >= total - 1 ? "transparent" : acento, color: idx >= total - 1 ? acento : "#1a2a3a", fontSize: "13px", cursor: idx >= total - 1 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: idx >= total - 1 ? 0.35 : 1 }}>›</button>
          <a href={verTodos} style={{ fontSize: "12px", fontWeight: 700, color: acento, textDecoration: "none" }}>Ver todos →</a>
        </div>
      </div>
      <div ref={ref} onScroll={onScroll}
        style={{ display: "flex", gap: "12px", padding: "0 16px 8px", overflowX: "auto", scrollbarWidth: "none", scrollSnapType: "x mandatory" }}>
        {items.map((child, i) => <div key={i} style={{ scrollSnapAlign: "start", flexShrink: 0 }}>{child}</div>)}
      </div>
      {total > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "5px", paddingTop: "6px" }}>
          {items.map((_, i) => <div key={i} onClick={() => scrollTo(i)} style={{ width: i === idx ? "18px" : "6px", height: "6px", borderRadius: "3px", background: i === idx ? acento : "rgba(0,0,0,0.15)", cursor: "pointer", transition: "all .25s" }} />)}
        </div>
      )}
    </div>
  );
}
