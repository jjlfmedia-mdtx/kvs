// src/app/api/certificate/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateCertificate } from '@/utils/crypto/certificate';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const record = await prisma.image.findUnique({ where: { kvs_id: id } });
    if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const pdfBuffer = await generateCertificate(record, {}, false);

    return new Response(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="KVS-Official-${id}.pdf"`,
        'Content-Length': String(pdfBuffer.length),
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
