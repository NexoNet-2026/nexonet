import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const SITE = "https://nexonet.ar";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Regenerar el sitemap cada hora (ISR) en vez de fijarlo al build.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const estaticas: MetadataRoute.Sitemap = [
    { url: `${SITE}/`,                  changeFrequency: "daily",   priority: 1.0 },
    { url: `${SITE}/buscar`,            changeFrequency: "daily",   priority: 0.8 },
    { url: `${SITE}/mapa`,              changeFrequency: "weekly",  priority: 0.6 },
    { url: `${SITE}/legal`,             changeFrequency: "yearly",  priority: 0.3 },
    { url: `${SITE}/legal/terminos`,    changeFrequency: "yearly",  priority: 0.3 },
    { url: `${SITE}/legal/privacidad`,  changeFrequency: "yearly",  priority: 0.3 },
    { url: `${SITE}/legal/cookies`,     changeFrequency: "yearly",  priority: 0.3 },
  ];

  try {
    const [{ data: anuncios }, { data: nexos }] = await Promise.all([
      supabase
        .from("anuncios")
        .select("id, created_at")
        .eq("estado", "activo")
        .order("created_at", { ascending: false })
        .limit(5000),
      supabase
        .from("nexos")
        .select("id, updated_at, created_at")
        .eq("estado", "activo")
        .limit(5000),
    ]);

    const rutasAnuncios: MetadataRoute.Sitemap = (anuncios || []).map((a) => ({
      url: `${SITE}/anuncios/${a.id}`,
      lastModified: a.created_at ? new Date(a.created_at) : undefined,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const rutasNexos: MetadataRoute.Sitemap = (nexos || []).map((n) => ({
      url: `${SITE}/nexo/${n.id}`,
      lastModified: new Date(n.updated_at || n.created_at || Date.now()),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    return [...estaticas, ...rutasAnuncios, ...rutasNexos];
  } catch {
    // Si Supabase no responde, devolvemos al menos las rutas estáticas.
    return estaticas;
  }
}
