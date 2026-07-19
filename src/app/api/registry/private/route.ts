import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/utils/crypto/jwt';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('kvs_session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado - inicia sesión' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ error: 'Sesión expirada' }, { status: 401 });
    }

    // Obtenemos únicamente las imágenes asociadas al userId logueado de manera inmutable
    const userImages = await prisma.image.findMany({
      where: { userId: payload.userId },
      orderBy: { upload_date: 'desc' }
    });

    return NextResponse.json(userImages);
  } catch (error: any) {
    console.error('[Registry Private API] Error:', error);
    return NextResponse.json({ error: 'Error al cargar el registro privado' }, { status: 500 });
  }
}
