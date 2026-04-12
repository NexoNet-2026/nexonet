import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code  = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code || !state) {
    return NextResponse.redirect('https://nexonet.ar/usuario?mp_error=missing_params');
  }

  try {
    const res = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id:     process.env.MP_CLIENT_ID,
        client_secret: process.env.MP_CLIENT_SECRET,
        code,
        grant_type:   'authorization_code',
        redirect_uri:  process.env.MP_REDIRECT_URI,
      }),
    });

    const token = await res.json();

    if (!token.access_token) {
      console.error('MP OAuth error:', token);
      return NextResponse.redirect('https://nexonet.ar/usuario?mp_error=token_failed');
    }

    await supabase.from('usuarios_mp_tokens').upsert({
      usuario_id:    state,
      mp_user_id:    token.user_id,
      access_token:  token.access_token,
      refresh_token: token.refresh_token,
      expires_in:    token.expires_in,
      token_type:    token.token_type,
      scope:         token.scope,
      created_at:    new Date().toISOString(),
    }, { onConflict: 'usuario_id' });

    await supabase.from('notificaciones').insert({
      usuario_id: state,
      tipo:       'sistema',
      leida:      false,
      mensaje:    '✅ Tu cuenta de MercadoLibre fue conectada correctamente a NexoNet.',
    });

    return NextResponse.redirect('https://nexonet.ar/usuario?mp_conectado=1');

  } catch (err) {
    console.error('MP callback error:', err);
    return NextResponse.redirect('https://nexonet.ar/usuario?mp_error=server_error');
  }
}
