// src/app/api/upload/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { embedDCT } from '@/utils/image/dct';
import { embedLSB } from '@/utils/image/lsb';
import { computePHash } from '@/utils/image/phash';
import { embedMetadata } from '@/utils/image/metadata';
import { signWithC2PA } from '@/utils/crypto/c2pa';
import { computeSHA256 } from '@/utils/crypto/hash';
import sanitize from 'sanitize-filename';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { saveImageFile } from '@/utils/storage';
function getMimeType(buffer: Buffer): { mime: string; ext: string } | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return { mime: 'image/jpeg', ext: 'jpg' };
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return { mime: 'image/png', ext: 'png' };
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50)
    return { mime: 'image/webp', ext: 'webp' };
  return null;
}

/** Generate a random 8-digit number string (no leading zero) and verify it's unique */
async function generateUniqueRandomId(): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    // crypto.randomInt produces cryptographically secure random int
    const num = crypto.randomInt(10000000, 99999999); // always 8 digits
    const year = new Date().getFullYear();
    const candidate = `KYL-IMG-${year}-${num}`;
    const existing = await prisma.image.findUnique({ where: { kvs_id: candidate } });
    if (!existing) return candidate;
  }
  throw new Error('Failed to generate unique KVS-ID after 20 attempts');
}

/** KVS Fingerprint: SHA-256 of (imageHash + kvsId + timestamp), formatted as KVS-XXXXXXXX-XXXXXXXX */
function generateKVSFingerprint(imageHash: string, kvsId: string): string {
  const raw = crypto
    .createHash('sha256')
    .update(`${imageHash}:${kvsId}:${Date.now()}:${crypto.randomBytes(8).toString('hex')}`)
    .digest('hex');
  // Format: KVS-<8hex>-<8hex>-<8hex>-<8hex>  (like a UUID but branded)
  return `KVS-${raw.slice(0, 8).toUpperCase()}-${raw.slice(8, 16).toUpperCase()}-${raw.slice(16, 24).toUpperCase()}-${raw.slice(24, 32).toUpperCase()}`;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const type = getMimeType(buffer);
    if (!type) return NextResponse.json({ error: 'Tipo de archivo no válido. Solo JPEG, PNG y WEBP.' }, { status: 400 });

    // ── Generate unique random KVS-ID ──────────────────────────────────────
    const kvsId = await generateUniqueRandomId();
    const year = new Date().getFullYear();
    const ownerName = 'Kyllerium System';
    const layers: Record<string, boolean> = {};

    let processedBuffer: Buffer = buffer;

    // ── Layer 1: DCT watermark (spread-spectrum, survives light compression) ──
    try {
      processedBuffer = await embedDCT(processedBuffer as any, { kvs_id: kvsId, owner: ownerName }) as any;
      layers.dct = true;
    } catch (e: any) { console.warn('[DCT]', e?.message); layers.dct = false; }

    // ── Layer 2: LSB steganography (ALL formats — precise bit-level embed) ──
    try {
      processedBuffer = await embedLSB(processedBuffer as any, { kvs_id: kvsId, owner: ownerName, ts: Date.now() }) as any;
      layers.lsb = true;
    } catch (e: any) { console.warn('[LSB]', e?.message); layers.lsb = false; }

    // ── Layer 3: EXIF/XMP metadata (JPEG), LSB fallback for PNG/WEBP ──────
    try {
      const fmt = type.mime.split('/')[1] as 'jpeg' | 'png' | 'webp';
      processedBuffer = await embedMetadata(processedBuffer as any, { kvsId, ownerName, year }, fmt) as any;
      layers.exif = type.mime === 'image/jpeg';
    } catch (e: any) { console.warn('[EXIF]', e?.message); layers.exif = false; }

    // ── Layer 4: C2PA signing (COSE manifest, readable by Adobe verifier) ─
    const c2paResult = await signWithC2PA(processedBuffer as any, type.mime, { kvs_id: kvsId }, { name: ownerName });
    processedBuffer = c2paResult.buffer as any;
    layers.c2pa = c2paResult.injected;

    // ── Final hash (after ALL watermarks) ──────────────────────────────────
    const finalHash = computeSHA256(processedBuffer as any);

    // ── pHash (perceptual hash for similarity search, Hamming distance) ────
    const pHash = await computePHash(processedBuffer as any);

    // ── KVS Fingerprint (unique cryptographic brand) ───────────────────────
    const kvsFingerprint = generateKVSFingerprint(finalHash, kvsId);

    // ── Save image (dynamic hybrid storage: Supabase or Disk) ───────────────
    const originalName = sanitize(file.name);
    const ext = path.extname(originalName) || `.${type.ext}`;
    const filename = `KVS-${kvsId}${ext}`;
    const filepath = await saveImageFile(processedBuffer as any, filename, type.mime);

    // ── Save to DB ─────────────────────────────────────────────────────────
    const imageRecord = await prisma.image.create({
      data: {
        kvs_id: kvsId,
        kvs_fingerprint: kvsFingerprint,
        hash_sha256: finalHash,
        phash: pHash,
        filename,
        filepath,
        watermark_data: JSON.stringify({ kvs_id: kvsId, layers }),
        metadata_json: JSON.stringify({ type: type.mime, layers, c2pa: c2paResult.manifestSummary }),
        c2pa_manifest: c2paResult.manifestSummary,
        owner_name: ownerName,
      }
    });

    return NextResponse.json({
      success: true,
      kvs_id: kvsId,
      kvs_fingerprint: kvsFingerprint,
      hash: finalHash,
      phash: pHash,
      layers,
      c2pa_manifest: JSON.parse(c2paResult.manifestSummary),
      format: type.mime,
      filename,
      size_kb: Math.round(processedBuffer.length / 1024),
    });
  } catch (error: any) {
    console.error('[KVS Upload] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
