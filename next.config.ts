import type { NextConfig } from "next";

// Lista de extensiones de assets cacheables (B-01)
const CACHEABLE_EXTENSIONS = ["png", "jpg", "jpeg", "svg", "webp", "ico", "woff", "woff2", "ttf"];

const nextConfig: NextConfig = {
  transpilePackages: ["leaflet", "react-leaflet"],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.rosariogarage.com' },
      { protocol: 'https', hostname: 'rosariogarage.com' },
      { protocol: 'https', hostname: 'www.bienesrosario.com' },
      { protocol: 'https', hostname: 'bienesrosario.com' },
      { protocol: 'https', hostname: 'http2.mlstatic.com' },
      { protocol: 'https', hostname: '*.mlstatic.com' },
      { protocol: 'https', hostname: 'images.evisos.com.ar' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  // Estrategia de cache (B-01 de docs/auditoria-final.md):
  // IMPORTANTE: Next.js aplica TODAS las reglas que matchean, y para un mismo
  // header key, la ÚLTIMA gana. Por eso el catch-all no-store va PRIMERO,
  // y las reglas específicas (que sí queremos cachear) van al FINAL.
  //
  // - Catch-all (.*): no-store. Cubre páginas SSG/SSR para que la CDN no
  //   sirva contenido viejo. Es el comportamiento previo, lo conservamos.
  // - /_next/static/* y /_next/image/*: cache largo, son immutables
  //   (Next genera nombres con hash, cuando cambia algo cambia el nombre).
  // - Assets públicos (íconos, fuentes): cache moderado de 1 día.
  async headers() {
    const longCache = { key: "Cache-Control", value: "public, max-age=31536000, immutable" };
    const mediumCache = { key: "Cache-Control", value: "public, max-age=86400, must-revalidate" };
    const noCache = { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" };

    const assetRules = CACHEABLE_EXTENSIONS.map(ext => ({
      source: `/:path*.${ext}`,
      headers: [mediumCache],
    }));

    return [
      // Default para todo: no-store (va PRIMERO porque la última específica gana).
      { source: "/(.*)", headers: [noCache] },
      // Específicas: pisan el catch-all anterior.
      { source: "/_next/static/:path*", headers: [longCache] },
      { source: "/_next/image/:path*", headers: [longCache] },
      ...assetRules,
    ];
  },
};

export default nextConfig;
