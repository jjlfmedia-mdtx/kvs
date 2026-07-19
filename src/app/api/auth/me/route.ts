import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/utils/crypto/jwt';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('kvs_session')?.value;
    if (!token) {
      return NextResponse.json({ authenticated: false });
    }

    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ authenticated: false });
    }

    return NextResponse.json({
      authenticated: true,
      user: { id: payload.userId, username: payload.username }
    });
  } catch (error) {
    return NextResponse.json({ authenticated: false });
  }
}
