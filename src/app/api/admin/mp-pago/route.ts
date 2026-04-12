import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 });

  const res = await fetch('https://api.mercadopago.com/v1/payments/' + id, {
    headers: { 'Authorization': 'Bearer ' + process.env.MP_ACCESS_TOKEN },
  });
  const data = await res.json();
  return NextResponse.json(data);
}
