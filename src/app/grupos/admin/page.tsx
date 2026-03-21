"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function Inner() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params?.get("id");
  useEffect(() => { router.replace(id ? `/nexo/${id}/admin` : "/buscar?tipo=grupos"); }, []);
  return <div style={{ paddingTop: "95px", textAlign: "center", color: "#9a9a9a", fontFamily: "'Nunito',sans-serif" }}>Redirigiendo...</div>;
}

export default function GruposAdminRedirect() {
  return <Suspense fallback={<div>Redirigiendo...</div>}><Inner /></Suspense>;
}
