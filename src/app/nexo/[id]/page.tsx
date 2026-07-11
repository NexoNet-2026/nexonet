import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import NexoClient from "./NexoClient";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const { data: n } = await supabase
    .from("nexos")
    .select("titulo, descripcion, avatar_url, banner_url")
    .eq("id", id)
    .maybeSingle();

  if (!n) return { title: "Nexo | NexoNet" };

  const title = `${n.titulo} | NexoNet`;
  const description = (n.descripcion || n.titulo || "").slice(0, 160);
  const img = n.banner_url || n.avatar_url || undefined;

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
  return <NexoClient />;
}
