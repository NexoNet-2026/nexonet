import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import CategoriaClient from "./CategoriaClient";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function generateMetadata(
  { params }: { params: Promise<{ rubro: string }> }
): Promise<Metadata> {
  const { rubro } = await params;
  const { data: r } = await supabase
    .from("rubros")
    .select("id, nombre")
    .eq("id", rubro)
    .maybeSingle();

  const nombre = r?.nombre || "Categoría";
  const title = `${nombre} | NexoNet`;
  const description = `Explorá anuncios de ${nombre} en NexoNet. Comprá, vendé y conectá cerca tuyo.`.slice(0, 160);

  // og:image best-effort: primera imagen de un anuncio activo del rubro
  let img: string | undefined;
  try {
    if (r?.id) {
      const { data: subs } = await supabase.from("subrubros").select("id").eq("rubro_id", r.id);
      const subIds = (subs || []).map((s: { id: number }) => s.id);
      if (subIds.length) {
        const { data: an } = await supabase
          .from("anuncios")
          .select("imagenes")
          .in("subrubro_id", subIds)
          .eq("estado", "activo")
          .not("imagenes", "is", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (an && Array.isArray(an.imagenes) && an.imagenes[0]) img = an.imagenes[0];
      }
    }
  } catch {
    // si el schema difiere, seguimos sin og:image
  }

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
  return <CategoriaClient />;
}
