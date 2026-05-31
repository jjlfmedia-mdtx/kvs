// src/app/api/certificate/[id]/combined/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateCombinedCertificate } from '@/utils/crypto/certificate';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const record = await prisma.image.findUnique({ where: { kvs_id: id } });
    if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Official Owner Data
    const officialOwner = {
      name: record.owner_name || 'Kyllerium System',
      organization: record.owner_org,
      role: record.owner_role
    };

    // Custom Owner Data (fallback to official if no custom certificate exists)
    let customInfo: any = {};
    if (record.custom_certificate) {
      try {
        customInfo = JSON.parse(record.custom_certificate);
      } catch {}
    }

    const customOwner = {
      name: customInfo.name || record.owner_name || 'Kyllerium System',
      organization: customInfo.organization || record.owner_org,
      role: customInfo.role || record.owner_role,
      expirationDate: customInfo.expirationDate || 'Sin Vencimiento',
      usageDescription: customInfo.usageDescription || 'Uso no restringido'
    };

    const pdfBuffer = await generateCombinedCertificate(record, officialOwner, customOwner);

    return new Response(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="KVS-Combined-${id}.pdf"`,
        'Content-Length': String(pdfBuffer.length),
      }
    });
  } catch (error: any) {
    console.error('[KVS Combined Cert API] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
