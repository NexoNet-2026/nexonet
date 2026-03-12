"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Header() {
  const [usuario, setUsuario] = useState<{ nombre_usuario: string; codigo: string } | null>(null);

  useEffect(() => {
    const cargarUsuario = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase
          .from("usuarios")
          .select("nombre_usuario, codigo")
          .eq("id", session.user.id)
          .single();
        if (data) setUsuario(data);
      }
    };
    cargarUsuario();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        supabase.from("usuarios").select("nombre_usuario, codigo").eq("id", session.user.id).single()
          .then(({ data }) => { if (data) setUsuario(data); });
      } else {
        setUsuario(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100 }}>

      {/* FRANJA PRINCIPAL */}
      <header style={{
        height: "60px",
        background: "linear-gradient(135deg, #1a2a3a 0%, #243b55 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
      }}>

        {/* LOGO */}
        <Link href="/" style={{ textDecoration: "none", display: "flex", flexDirection: "column", lineHeight: 1 }}>
          <div style={{ fontSize: "22px", letterSpacing: "1px", fontFamily: "'Bebas Neue', sans-serif" }}>
            <span style={{ color: "#c8c8c8" }}>Nexo</span>
            <span style={{ color: "#d4a017" }}>Net</span>
          </div>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "#8a9aaa", letterSpacing: "3px", textTransform: "uppercase" }}>
            Argentina
          </div>
        </Link>

        {/* BOTÓN HOME */}
        <Link href="/" style={{
          display: "flex", alignItems: "center", gap: "6px", textDecoration: "none",
          background: "linear-gradient(135deg, #d4a017, #f0c040)",
          borderRadius: "20px", padding: "7px 16px",
          boxShadow: "0 4px 0 rgba(0,0,0,0.4), 0 0 12px rgba(212,160,23,0.3)",
        }}>
          <span style={{ fontSize: "16px" }}>🏠</span>
          <span style={{ fontSize: "11px", fontWeight: 900, color: "#1a2a3a", textTransform: "uppercase", letterSpacing: "1.5px" }}>HOME</span>
        </Link>

        {/* USUARIO si logueado */}
        {usuario ? (
          <Link href="/usuario" style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <span style={{ fontSize: "13px", fontWeight: 800, color: "#fff", maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {usuario.nombre_usuario}
            </span>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "13px", color: "#d4a017", letterSpacing: "2px" }}>
              {usuario.codigo}
            </span>
          </Link>
        ) : (
          <div style={{ width: "80px" }} />
        )}

      </header>

      {/* FRANJA NEXO PROMOTOR → apunta a /promotor */}
      <Link href="/promotor" style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        background: "linear-gradient(90deg, #b8860b, #d4a017, #f0c040, #d4a017, #b8860b)",
        padding: "7px 16px",
        textDecoration: "none",
        cursor: "pointer",
      }}>
        <span style={{ fontSize: "14px" }}>⭐</span>
        <span style={{ fontSize: "12px", fontWeight: 800, color: "#1a2a3a" }}>NEXO PROMOTOR</span>
        <span style={{ fontSize: "10px", color: "#1a2a3a", fontWeight: 700 }}>—</span>
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "20px", color: "#1a2a3a" }}>30%</span>
        <span style={{ fontSize: "12px", fontWeight: 800, color: "#1a2a3a" }}>de ganancia</span>
        <span style={{ fontSize: "12px", color: "#1a2a3a", fontWeight: 800 }}>→</span>
      </Link>

    </div>
  );
}
