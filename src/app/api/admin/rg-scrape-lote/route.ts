import { NextResponse } from 'next/server';

function decodeEntities(str: string): string {
  return str
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_: string, n: string) => String.fromCharCode(+n))
    .replace(/\s+/g, ' ').trim();
}

function cleanTitle(title: string): string {
  const separators = [' - Clasificados', ' | ', ' – ', ' — '];
  let t = title;
  for (const sep of separators) {
    const idx = t.indexOf(sep);
    if (idx > 20) { t = t.substring(0, idx); break; }
  }
  return decodeEntities(t).trim();
}

async function scrapeAnuncio(url: string): Promise<{ url: string; titulo: string; precio: string; imagen: string; error?: string }> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'es-AR,es;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    });
    const buffer = await res.arrayBuffer();
    const html = new TextDecoder('iso-8859-1').decode(buffer);

    // Título desde og:title o title tag
    const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*?)["']/i);
    const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const titulo = cleanTitle(ogTitle?.[1] || titleTag?.[1] || '');

    // Precio
    const precioMatch = html.match(/\$\s*([\d.,]+)/);
    const precio = precioMatch ? precioMatch[1].replace(/\./g, '').replace(',', '.') : '';

    // Imagen principal
    const ogImg = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*?)["']/i);
    const imgSrc = html.match(/resources_production\/gallery[^"' ]+\.(?:jpg|jpeg|png)/i);
    const imagen = ogImg?.[1] || (imgSrc ? 'https://www.rosariogarage.com/' + imgSrc[0] : '');

    return { url, titulo, precio, imagen };
  } catch (e: any) {
    return { url, titulo: '', precio: '', imagen: '', error: e.message };
  }
}

export async function POST(req: Request) {
  const { urls } = await req.json();
  if (!urls || !Array.isArray(urls)) return NextResponse.json({ error: 'urls requeridas' }, { status: 400 });

  // Procesar de a 3 en paralelo para no sobrecargar
  const resultados = [];
  for (let i = 0; i < urls.length; i += 3) {
    const lote = urls.slice(i, i + 3);
    const res = await Promise.all(lote.map(scrapeAnuncio));
    resultados.push(...res);
    if (i + 3 < urls.length) await new Promise(r => setTimeout(r, 500));
  }

  return NextResponse.json({ resultados });
}
