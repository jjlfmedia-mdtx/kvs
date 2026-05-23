// src/app/api/certificate/[id]/custom/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateCertificate } from '@/utils/crypto/certificate';
import { readImageFile, saveImageFile } from '@/utils/storage';
import { embedWatermarkLayers } from '@/utils/image/watermark';
import { embedMetadata } from '@/utils/image/metadata';
import { computePHash } from '@/utils/image/phash';
import { signWithC2PA } from '@/utils/crypto/c2pa';
import { computeSHA256 } from '@/utils/crypto/hash';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const record = await prisma.image.findUnique({ where: { kvs_id: id } });
    if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    let customInfo: any = {};
    if (record.custom_certificate) {
      try {
        customInfo = JSON.parse(record.custom_certificate);
      } catch {}
    }

    const ownerData = {
      name: customInfo.name || record.owner_name,
      organization: customInfo.organization || record.owner_org,
      role: customInfo.role || record.owner_role,
      expirationDate: customInfo.expirationDate,
      usageDescription: customInfo.usageDescription
    };

    const pdfBuffer = await generateCertificate(record, ownerData, true);

    return new Response(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="KVS-Custom-${id}.pdf"`,
        'Content-Length': String(pdfBuffer.length),
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, organization, role, expirationDate, usageDescription } = body;

    const record = await prisma.image.findUnique({ where: { kvs_id: id } });
    if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Re-process image with custom owner data for stronger provenance binding.
    let buffer = await readImageFile(record.filepath);
    const type = JSON.parse(record.metadata_json || '{}').type || 'image/jpeg';

    const watermarkResult = await embedWatermarkLayers(
      buffer,
      { kvs_id: id, owner: name },
      { kvs_id: id, owner: name, organization, role, ts: Date.now() }
    );
    buffer = watermarkResult.buffer;

    buffer = await embedMetadata(
      buffer as any,
      { kvsId: id, ownerName: name, organization, role, year: new Date().getFullYear() },
      type.split('/')[1]
    ) as any;

    const c2paRes = await signWithC2PA(
      buffer as any,
      type,
      { kvs_id: id },
      { name, organization, role, expirationDate, usageDescription }
    );
    buffer = c2paRes.buffer as any;

    const finalHash = computeSHA256(buffer as any);
    const pHash = await computePHash(buffer as any);

    const ext = record.filename.split('.').pop() || 'png';
    const baseName = record.filename.replace(`.${ext}`, '');
    const newFilename = `${baseName}-custom-${Date.now()}.${ext}`;
    const newFilepath = await saveImageFile(buffer, newFilename, type);

    await prisma.image.update({
      where: { kvs_id: id },
      data: {
        owner_name: name,
        owner_org: organization,
        owner_role: role,
        hash_sha256: finalHash,
        phash: pHash,
        filepath: newFilepath,
        custom_certificate: JSON.stringify(body)
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
