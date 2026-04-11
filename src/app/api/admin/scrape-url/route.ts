import { NextResponse } from 'next/server';

function decodeEntities(str: string): string {
  return str
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_: string, n: string) => String.fromCharCode(+n))
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanTitle(title: string): string {
  const separators = [' - Clasificados', ' | ', ' – ', ' — '];
  let t = title;
  for (const sep of separators) {
    const idx = t.indexOf(sep);
    if (idx > 20) { t = t.substring(0, idx); break; }
  }
  return decodeEntities(t);
}

function getPrice(html: string): string {
  const og = html.match(/<meta[^>]*property=["']og:price:amount["'][^>]*content=["']([^"']*?)["']/i);
  if (og?.[1]) return og[1];
  const jsonPrice = html.match(/["']price["']\s*:\s*["']?(\d+(?:[.,]\d+)?)["']?/);
  if (jsonPrice?.[1]) return jsonPrice[1].replace(/\./g, '').replace(',', '.');
  // Patrón RosarioGarage: buscar precio en el HTML
  const rgPrice = html.match(/\$\s*([\d.,]+)/);
  if (rgPrice?.[1]) return rgPrice[1].replace(/\./g, '').replace(',', '.');
  return '';
}

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

    // Detectar encoding del sitio
    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get('content-type') || '';
    const isIso = contentType.includes('iso-8859-1') || contentType.includes('latin');
    const decoder = new TextDecoder(isIso ? 'iso-8859-1' : 'utf-8');
    const html = decoder.decode(buffer);

    const getMeta = (property: string): string => {
      const patterns = [
        new RegExp('<meta[^>]*property=["\']' + property + '["\'][^>]*content=["\']([^"\']*)["\']', 'i'),
        new RegExp('<meta[^>]*content=["\']([^"\']*)["\'][^>]*property=["\']' + property + '["\']', 'i'),
        new RegExp('<meta[^>]*name=["\']' + property + '["\'][^>]*content=["\']([^"\']*)["\']', 'i'),
      ];
      for (const p of patterns) {
        const m = html.match(p);
        if (m?.[1]) return decodeEntities(m[1].trim());
      }
      return '';
    };

    const getTitle = (): string => {
      const og = getMeta('og:title');
      if (og && og.length > 5) return cleanTitle(og);
      const t = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      return t?.[1] ? cleanTitle(t[1]) : '';
    };

    const getImage = (): string => {
      const og = getMeta('og:image');
      if (og) return og;
      const imgMatch = html.match(/https?:\/\/[^"' ]*resources_production[^"' ]+\.(?:jpg|jpeg|png)/i);
      return imgMatch?.[0] || '';
    };

    const getDescription = (): string => {
      const og = getMeta('og:description') || getMeta('description');
      // Limpiar si la descripción incluye el nombre del sitio
      const clean = decodeEntities(og);
      const cutIdx = clean.indexOf('Rosariogarage');
      return cutIdx > 30 ? clean.substring(0, cutIdx).trim() : clean;
    };

    return NextResponse.json({
      titulo: getTitle(),
      descripcion: getDescription(),
      imagen: getImage(),
      precio: getPrice(html),
    });
  } catch (e: any) {
    return NextResponse.json({ error: 'No se pudo obtener: ' + e.message }, { status: 500 });
  }
}
