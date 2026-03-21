"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GruposCategoriaRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/buscar?tipo=grupos"); }, []);
  return <div style={{ paddingTop: "95px", textAlign: "center", color: "#9a9a9a", fontFamily: "'Nunito',sans-serif" }}>Redirigiendo...</div>;
}
