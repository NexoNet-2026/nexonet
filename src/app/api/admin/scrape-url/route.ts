import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { url } = await req.json();
  if (!url) return NextResponse.json({ error: 'URL requerida' }, { status: 400 });

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-AR,es;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    });

    const html = await res.text();

    const getMeta = (property: string): string => {
      const patterns = [
        new RegExp('<meta[^>]*property=["\']' + property + '["\'][^>]*content=["\']([^"\']*)["\']', 'i'),
        new RegExp('<meta[^>]*content=["\']([^"\']*)["\'][^>]*property=["\']' + property + '["\']', 'i'),
        new RegExp('<meta[^>]*name=["\']' + property + '["\'][^>]*content=["\']([^"\']*)["\']', 'i'),
      ];
      for (const p of patterns) {
        const m = html.match(p);
        if (m?.[1]) return m[1].trim();
      }
      return '';
    };

    const getTitle = (): string => {
      const og = getMeta('og:title');
      if (og) return og;
      const t = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      return t?.[1]?.trim() || '';
    };

    const getPrice = (): string => {
      const og = getMeta('og:price:amount') || getMeta('product:price:amount');
      if (og) return og;
      // ML pattern
      const mlPrice = html.match(/"price":(\d+(?:\.\d+)?)/);
      if (mlPrice) return mlPrice[1];
      return '';
    };

    const titulo = getTitle();
    const descripcion = getMeta('og:description') || getMeta('description');
    const imagen = getMeta('og:image');
    const precio = getPrice();

    return NextResponse.json({ titulo, descripcion, imagen, precio });
  } catch (e: any) {
    return NextResponse.json({ error: 'No se pudo obtener el contenido: ' + e.message }, { status: 500 });
  }
}
