import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('[conectar] body recibido:', body);
    const anuncio_id = parseInt(body.anuncio_id);
    const usuario_id = body.usuario_id;
    console.log('[conectar] anuncio_id:', anuncio_id, 'usuario_id:', usuario_id);
    if (!anuncio_id || !usuario_id) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    // 1. Verificar idempotencia - ya conectó antes?
    const { data: yaConecto, error: yaConectoError } = await supabase
      .from('conexiones')
      .select('id')
      .eq('anuncio_id', anuncio_id)
      .eq('usuario_id', usuario_id)
      .single();
    console.log('[conectar] idempotencia yaConecto:', yaConecto, 'error:', yaConectoError);

    if (yaConecto) {
      const { data: anu } = await supabase.from('anuncios').select('link_externo, telefono, email').eq('id', anuncio_id).single();
      console.log('[conectar] ya conectado antes, devolviendo contacto:', anu);
      return NextResponse.json({ ok: true, ya_conectado: true, contacto: anu });
    }

    // 2. Traer anuncio
    const { data: anuncio, error: anuError } = await supabase
      .from('anuncios')
      .select('id, conexiones, usuario_id, link_externo, telefono, email')
      .eq('id', anuncio_id)
      .single();
    console.log('[conectar] anuncio traido:', anuncio, 'error:', anuError);

    if (anuError || !anuncio) {
      return NextResponse.json({ error: 'Anuncio no encontrado' }, { status: 404 });
    }

    // 3. Traer saldo del usuario que conecta
    const { data: usuario, error: usuError } = await supabase
      .from('usuarios')
      .select('bits_free, bits, bits_promo')
      .eq('id', usuario_id)
      .single();
    console.log('[conectar] saldo usuario:', usuario, 'error:', usuError);

    if (usuError || !usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const bits_free = usuario.bits_free || 0;
    const bits = usuario.bits || 0;
    const bits_promo = usuario.bits_promo || 0;
    const total = bits_free + bits + bits_promo;
    console.log('[conectar] bits_free:', bits_free, 'bits:', bits, 'bits_promo:', bits_promo, 'total:', total);

    if (total <= 0) {
      return NextResponse.json({ error: 'No tenés BIT disponibles para conectar' }, { status: 402 });
    }

    // 4. Descontar 1 BIT del usuario (prioridad: free → bits → promo)
    const update: any = {};
    if (bits_free >= 1) update.bits_free = bits_free - 1;
    else if (bits >= 1) update.bits = bits - 1;
    else update.bits_promo = bits_promo - 1;
    console.log('[conectar] update a aplicar en usuarios:', update);

    const { data: updateUsuData, error: updateUsuError } = await supabase.from('usuarios').update(update).eq('id', usuario_id).select();
    console.log('[conectar] resultado update usuarios:', updateUsuData, 'error:', updateUsuError);

    // 5. Incrementar contador de conexiones del anuncio
    const { data: updateAnuData, error: updateAnuError } = await supabase
      .from('anuncios')
      .update({ conexiones: (anuncio.conexiones || 0) + 1 })
      .eq('id', anuncio_id)
      .select();
    console.log('[conectar] resultado update anuncios:', updateAnuData, 'error:', updateAnuError);

    // 6. Registrar conexion
    const { data: insertConexData, error: insertConexError } = await supabase.from('conexiones').insert({
      anuncio_id,
      usuario_id,
      vendedor_id: anuncio.usuario_id,
    }).select();
    console.log('[conectar] resultado insert conexiones:', insertConexData, 'error:', insertConexError);

    // 7. Notificar al vendedor
    const { data: insertNotifData, error: insertNotifError } = await supabase.from('notificaciones').insert({
      usuario_id: anuncio.usuario_id,
      tipo: 'sistema',
      leida: false,
      mensaje: 'alguien se conectó con tu anuncio.',
    }).select();
    console.log('[conectar] resultado insert notificaciones:', insertNotifData, 'error:', insertNotifError);

    // 8. Devolver contacto
    console.log('[conectar] OK, devolviendo contacto');
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
