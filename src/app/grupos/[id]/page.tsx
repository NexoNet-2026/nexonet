"use client";
import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function GrupoIdRedirect() {
  const router = useRouter();
  const params = useParams();
  useEffect(() => { router.replace(`/nexo/${params?.id}`); }, []);
  return <div style={{ paddingTop: "95px", textAlign: "center", color: "#9a9a9a", fontFamily: "'Nunito',sans-serif" }}>Redirigiendo...</div>;
}
