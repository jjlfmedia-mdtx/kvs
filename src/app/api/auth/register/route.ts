import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'Falta usuario o contraseña' }, { status: 400 });
    }

    if (username.length < 3 || password.length < 6) {
      return NextResponse.json({ error: 'Usuario (min 3) o contraseña (min 6) muy cortos' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'El nombre de usuario ya está registrado' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword
      }
    });

    return NextResponse.json({ success: true, userId: user.id, username: user.username });
  } catch (error: any) {
    console.error('[Register API] Error:', error);
    return NextResponse.json({ error: 'Error del servidor en el registro' }, { status: 500 });
  }
}
