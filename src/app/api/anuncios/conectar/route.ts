import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { anuncio_id, usuario_id } = await req.json();
    if (!anuncio_id || !usuario_id) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    // Verificar idempotencia - ya conectó antes?
    const { data: yaConecto } = await supabase
      .from('conexiones')
      .select('id')
      .eq('anuncio_id', anuncio_id)
      .eq('usuario_id', usuario_id)
      .single();

    if (yaConecto) {
      const { data: anu } = await supabase.from('anuncios').select('link_externo, telefono, email').eq('id', anuncio_id).single();
      return NextResponse.json({ ok: true, ya_conectado: true, contacto: anu });
    }

    // Traer anuncio y verificar bits
    const { data: anuncio, error: anuError } = await supabase
      .from('anuncios')
      .select('id, bits_conexion, usuario_id, link_externo, telefono, email')
      .eq('id', anuncio_id)
      .single();

    if (anuError || !anuncio) {
      return NextResponse.json({ error: 'Anuncio no encontrado' }, { status: 404 });
    }

    if ((anuncio.bits_conexion || 0) <= 0) {
      return NextResponse.json({ error: 'El anuncio no tiene BIT de conexión disponibles' }, { status: 402 });
    }

    // Descontar BIT del vendedor (atomico con service role)
    const { error: updateError } = await supabase
      .from('anuncios')
      .update({ bits_conexion: anuncio.bits_conexion - 1 })
      .eq('id', anuncio_id)
      .eq('bits_conexion', anuncio.bits_conexion); // optimistic lock

    if (updateError) {
      return NextResponse.json({ error: 'Error al descontar BIT, intenta de nuevo' }, { status: 500 });
    }

    // Registrar conexion
    await supabase.from('conexiones').insert({
      anuncio_id,
      usuario_id,
      vendedor_id: anuncio.usuario_id,
    });

    // Notificar al vendedor
    await supabase.from('notificaciones').insert({
      usuario_id: anuncio.usuario_id,
      tipo: 'sistema',
      leida: false,
      mensaje: 'alguien se conectó con tu anuncio. Se descontó 1 BIT de conexión.',
    });

    return NextResponse.json({
      ok: true,
      contacto: {
        link_externo: anuncio.link_externo,
        telefono: anuncio.telefono,
        email: anuncio.email,
      }
    });

  } catch (err) {
    console.error('Error conectar:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
