import { NextResponse } from 'next/server';

export async function GET() {
  const check = (name: string) => {
    const v = process.env[name];
    return { set: !!v, length: v ? v.length : 0 };
  };

  return NextResponse.json({
    MP_CLIENT_ID:      check('MP_CLIENT_ID'),
    MP_CLIENT_SECRET:  check('MP_CLIENT_SECRET'),
    MP_REDIRECT_URI:   check('MP_REDIRECT_URI'),
    MP_ACCESS_TOKEN:   check('MP_ACCESS_TOKEN'),
    MP_WEBHOOK_SECRET: check('MP_WEBHOOK_SECRET'),
  });
}
