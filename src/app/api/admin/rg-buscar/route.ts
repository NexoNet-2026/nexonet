import { NextResponse } from 'next/server';

function decodeEntities(str: string): string {
  return str
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_: string, n: string) => String.fromCharCode(+n))
    .replace(/\s+/g, ' ').trim();
}

const RBR_MAP: Record<string, string> = {
  autos: '107', utilitarios: '110', camionetas: '109', camiones: '111',
  motos: '108', clasicos: '113', embarcaciones: '114', planes: '116',
  accesorios_autos: '115', accesorios_motos: '117', telefonia: '118',
  electronica: '119', informatica: '120', hogar: '121', deportes: '123',
  indumentaria: '124', herramientas: '126', otros: '127',
};

export async function POST(req: Request) {
  const { categoria, marca, modelo, precio_desde, precio_hasta, km_desde, km_hasta, year_desde, year_hasta, pagina = 0 } = await req.json();

  const rbrId = RBR_MAP[categoria] || '107';
  const offset = pagina * 20;

  const params = new URLSearchParams({
    action: 'finder/search',
    o: String(offset),
    rbrId,
    mrkId: marca || '',
    itmModelDesc: modelo || '',
    itmTransm: '',
    combustible: 'combustible',
    itmClass_price: '1',
    'precio[from]': precio_desde || '',
    'precio[to]': precio_hasta || '',
    itmVendedor: '',
    optKm: 'ALL',
    'km[from]': km_desde || '',
    'km[to]': km_hasta || '',
    'year[from]': year_desde || '',
    'year[to]': year_hasta || '',
  });

  const url = 'https://www.rosariogarage.com/index.php?' + params.toString();

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'es-AR,es;q=0.9',
      },
      signal: AbortSignal.timeout(15000),
    });

    const buffer = await res.arrayBuffer();
    const html = new TextDecoder('iso-8859-1').decode(buffer);

    // Extraer links de anuncios
    const linkRegex = /href="(https:\/\/www\.rosariogarage\.com\/index\.php\?action=carro\/showProduct&itmId=(\d+)&rbrId=\d+)"/g;
    const links: { url: string; itmId: string }[] = [];
    const seen = new Set<string>();
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      if (!seen.has(match[2])) {
        seen.add(match[2]);
        links.push({ url: match[1], itmId: match[2] });
      }
    }

    // Extraer total de anuncios
    const totalMatch = html.match(/(\d+(?:\.\d+)?)\s*anuncios publicados/i);
    const total = totalMatch ? parseInt(totalMatch[1].replace('.', '')) : 0;

    // Extraer marcas disponibles para el filtro
    const marcaRegex = /<option\s+value="(\d+)">([^<]+)<\/option>/g;
    const marcas: { id: string; nombre: string }[] = [];
    const htmlMarcas = html.substring(html.indexOf('mrkId'), html.indexOf('mrkId') + 3000);
    while ((match = marcaRegex.exec(htmlMarcas)) !== null) {
      if (match[1] && match[2].trim()) {
        marcas.push({ id: match[1], nombre: decodeEntities(match[2].trim()) });
      }
    }

    return NextResponse.json({ links, total, pagina, marcas, url_buscada: url });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
