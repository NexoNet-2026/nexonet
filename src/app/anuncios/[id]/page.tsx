import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import AnuncioClient from "./AnuncioClient";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const { data: a } = await supabase
    .from("anuncios")
    .select("titulo, descripcion, imagenes")
    .eq("id", id)
    .maybeSingle();

  if (!a) return { title: "Anuncio | NexoNet" };

  const title = `${a.titulo} | NexoNet`;
  const description = (a.descripcion || a.titulo || "").slice(0, 160);
  const img = Array.isArray(a.imagenes) && a.imagenes[0] ? a.imagenes[0] : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: img ? [{ url: img }] : undefined,
    },
  };
}

export default function Page() {
  return <AnuncioClient />;
}
