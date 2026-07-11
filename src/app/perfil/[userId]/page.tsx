import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import PerfilClient from "./PerfilClient";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function generateMetadata(
  { params }: { params: Promise<{ userId: string }> }
): Promise<Metadata> {
  const { userId } = await params;
  const { data: u } = await supabase
    .from("usuarios")
    .select("nombre_usuario, avatar_url")
    .eq("id", userId)
    .maybeSingle();

  if (!u) return { title: "Perfil | NexoNet" };

  const nombre = u.nombre_usuario || "Usuario";
  const title = `${nombre} | NexoNet`;
  const description = `Perfil de ${nombre} en NexoNet — descubrí sus anuncios y nexos.`.slice(0, 160);
  const img = u.avatar_url || undefined;

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
  return <PerfilClient />;
}
