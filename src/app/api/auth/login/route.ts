import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { signJWT } from '@/utils/crypto/jwt';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'Falta usuario o contraseña' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    const token = await signJWT({ userId: user.id, username: user.username });

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username }
    });

    // Guardamos la sesión en cookies HttpOnly para máxima seguridad y evitar robo vía JavaScript
    response.cookies.set('kvs_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: '/'
    });

    return response;
  } catch (error: any) {
    console.error('[Login API] Error:', error);
    return NextResponse.json({ error: 'Error del servidor en el login' }, { status: 500 });
  }
}
