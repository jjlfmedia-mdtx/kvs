import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function authenticate(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.substring(7);
  const expectedToken = process.env.ADMIN_TOKEN || 'KVS-ADMIN-2026';
  return token === expectedToken;
}

export async function GET(req: Request) {
  if (!authenticate(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const images = await prisma.image.findMany({
      orderBy: { upload_date: 'desc' }
    });
    return NextResponse.json(images);
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
