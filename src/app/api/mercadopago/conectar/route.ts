import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const usuario_id = searchParams.get('usuario_id');

  if (!usuario_id) {
    return NextResponse.json({ error: 'Falta usuario_id' }, { status: 400 });
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id:     process.env.MP_CLIENT_ID!,
    redirect_uri:  process.env.MP_REDIRECT_URI!,
    state:         usuario_id,
  });

  const authUrl = 'https://auth.mercadolibre.com.ar/authorization?' + params.toString();
  return NextResponse.redirect(authUrl);
}
