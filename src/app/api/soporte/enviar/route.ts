import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const { usuario_id, nombre_usuario, codigo, tipo, mensaje } = await req.json();
  if (!tipo || !mensaje) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
  const { error } = await supabase.from('mensajes_soporte').insert({
    usuario_id: usuario_id || null,
    nombre_usuario: nombre_usuario || null,
    codigo: codigo || null,
    tipo,
    mensaje,
    estado: 'pendiente',
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
