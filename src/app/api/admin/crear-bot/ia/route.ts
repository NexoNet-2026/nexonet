import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { nombre, tipo } = await req.json();
    if (!nombre || !tipo) return NextResponse.json({ error: "nombre y tipo requeridos" }, { status: 400 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "ANTHROPIC_API_KEY no configurada" }, { status: 500 });

    const prompt = `Generá una descripción atractiva para un ${tipo} llamado ${nombre} en NexoNet Argentina. Máximo 150 palabras. Solo el texto, sin explicaciones.`;

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const d = await r.json();
    if (!r.ok) {
      return NextResponse.json({ error: d?.error?.message || `HTTP ${r.status}` }, { status: 500 });
    }

    const texto: string = d?.content?.[0]?.text?.trim() || "";
    return NextResponse.json({ descripcion: texto });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
