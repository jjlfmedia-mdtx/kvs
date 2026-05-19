import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readImageFile } from '@/utils/storage';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const record = await prisma.image.findUnique({ where: { kvs_id: id } });
    if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const buffer = await readImageFile(record.filepath);

    let mimeType = 'image/png';
    try {
      const meta = JSON.parse(record.metadata_json || '{}');
      if (meta.type) mimeType = meta.type;
    } catch {}

    return new Response(buffer as any, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${record.filename}"`,
        'Content-Length': String(buffer.length),
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
