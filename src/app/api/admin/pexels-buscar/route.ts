import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    if (!q) return NextResponse.json({ error: "q requerido" }, { status: 400 });

    const key = process.env.PEXELS_API_KEY;
    if (!key) return NextResponse.json({ error: "PEXELS_API_KEY no configurada" }, { status: 500 });

    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=12`;
    const r = await fetch(url, { headers: { Authorization: key } });
    if (!r.ok) {
      const txt = await r.text();
      return NextResponse.json({ error: `Pexels HTTP ${r.status}: ${txt.slice(0, 200)}` }, { status: 500 });
    }

    const data = await r.json();
    const fotos = (data.photos || []).map((p: any) => ({
      url: p.src?.large || p.src?.original || "",
      thumbnail: p.src?.medium || p.src?.small || p.src?.tiny || "",
      autor: p.photographer || "",
    }));

    return NextResponse.json({ fotos });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
