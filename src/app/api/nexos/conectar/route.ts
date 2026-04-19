import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const nexo_id = body.nexo_id;
    const usuario_id = body.usuario_id;
    if (!nexo_id || !usuario_id) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    // 1. Idempotencia
    const { data: yaConecto } = await supabase
      .from('conexiones_nexo')
      .select('id')
      .eq('nexo_id', nexo_id)
      .eq('usuario_id', usuario_id)
      .single();

    if (yaConecto) {
      const { data: nx } = await supabase.from('nexos').select('whatsapp, link_externo, telefono').eq('id', nexo_id).single();
      return NextResponse.json({ ok: true, ya_conectado: true, contacto: nx });
    }

    // 2. Traer nexo
    const { data: nexo, error: nexoError } = await supabase
      .from('nexos')
      .select('id, conexiones, usuario_id, whatsapp, link_externo, telefono')
      .eq('id', nexo_id)
      .single();

    if (nexoError || !nexo) {
      return NextResponse.json({ error: 'Nexo no encontrado' }, { status: 404 });
    }

    // 3. Saldo usuario
    const { data: usuario, error: usuError } = await supabase
      .from('usuarios')
      .select('bits_free, bits, bits_promo')
      .eq('id', usuario_id)
      .single();

    if (usuError || !usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const bits_free = usuario.bits_free || 0;
    const bits = usuario.bits || 0;
    const bits_promo = usuario.bits_promo || 0;
    const total = bits_free + bits + bits_promo;

    if (total <= 0) {
      return NextResponse.json({ error: 'No tenés BIT disponibles para conectar' }, { status: 402 });
    }

    // 4. Descontar 1 BIT (prioridad: free → bits → promo)
    const update: any = {};
    if (bits_free >= 1) update.bits_free = bits_free - 1;
    else if (bits >= 1) update.bits = bits - 1;
    else update.bits_promo = bits_promo - 1;

    await supabase.from('usuarios').update(update).eq('id', usuario_id);

    // 5. Incrementar contador
    await supabase
      .from('nexos')
      .update({ conexiones: (nexo.conexiones || 0) + 1 })
      .eq('id', nexo_id);

    // 6. Registrar conexion
    await supabase.from('conexiones_nexo').insert({
      nexo_id,
      usuario_id,
      vendedor_id: nexo.usuario_id,
    });

    // 7. Notificar al creador
    await supabase.from('notificaciones').insert({
      usuario_id: nexo.usuario_id,
      tipo: 'sistema',
      nexo_id,
      leida: false,
      mensaje: 'alguien se conectó con tu nexo.',
    });

    // 8. Devolver contacto
    return NextResponse.json({
      ok: true,
      contacto: {
        whatsapp: nexo.whatsapp,
        link_externo: nexo.link_externo,
        telefono: nexo.telefono,
      }
    });

  } catch (err) {
    console.error('Error conectar nexo:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
