// src/app/api/verify/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractDCT } from '@/utils/image/dct';
import { extractLSB } from '@/utils/image/lsb';
import { extractMetadata } from '@/utils/image/metadata';
import { computePHash, hammingDistance } from '@/utils/image/phash';
import { computeSHA256 } from '@/utils/crypto/hash';
import { createC2pa } from 'c2pa-node';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const results = {
      dct_watermark: null as any,
      lsb_watermark: null as any,
      xmp_metadata: null as any,
      c2pa_manifest: null as any,
      phash_match: null as any,
      hash_match: false,
      db_record: null as any,
      overall: 'NOT_AUTHENTIC',
      confidence: 0
    };

    // CAPA 1: DCT Watermark extraction (async frequency-domain decoding)
    try {
      const dctPayload = await extractDCT(buffer as any);
      if (dctPayload) {
        results.dct_watermark = { found: true, data: JSON.parse(dctPayload) };
        results.confidence += 30;
      } else {
        results.dct_watermark = { found: false };
      }
    } catch (e: any) {
      results.dct_watermark = { found: false, error: e?.message };
    }

    // CAPA 2: LSB Steganography extraction (least significant bits)
    try {
      const lsbPayload = await extractLSB(buffer as any);
      if (lsbPayload) {
        const data = JSON.parse(lsbPayload);
        if (data.kvs_id) {
          results.lsb_watermark = { found: true, data };
          results.confidence += 25;
        } else {
          results.lsb_watermark = { found: false };
        }
      } else {
        results.lsb_watermark = { found: false };
      }
    } catch (e: any) {
      results.lsb_watermark = { found: false, error: e?.message };
    }

    // CAPA 3: EXIF metadata extraction (Artist, Software, UserComment JSON)
    try {
      const metaPayload = extractMetadata(buffer as any);
      if (metaPayload?.kvs_id) {
        results.xmp_metadata = { found: true, data: metaPayload };
        results.confidence += 15;
      } else {
        results.xmp_metadata = { found: false };
      }
    } catch (e: any) {
      results.xmp_metadata = { found: false, error: e?.message };
    }

    // CAPA 4: Local Native C2PA Verification (Reads the embedded COSE manifest)
    try {
      const c2pa = createC2pa({ thumbnail: false });
      const fileMime = file.type || 'image/jpeg';
      const c2paResult = await c2pa.read({ buffer: buffer as any, mimeType: fileMime as any });
      
      if (c2paResult && c2paResult.active_manifest) {
        const active = c2paResult.active_manifest;
        results.c2pa_manifest = {
          found: true,
          issuer: active.signature_info?.issuer || 'Kyllerium Self-Signed',
          time: active.signature_info?.time || new Date().toISOString(),
          title: active.title || 'Asset Protected',
          assertions: active.assertions || []
        };
        results.confidence += 30;
      } else {
        results.c2pa_manifest = { found: false };
      }
    } catch (e: any) {
      results.c2pa_manifest = { found: false, error: e?.message };
    }

    // CAPA 5: pHash Similarity Search (Hamming distance comparison)
    const uploadedPHash = await computePHash(buffer as any);
    const allImages = await prisma.image.findMany({ select: { kvs_id: true, phash: true } });
    
    let bestMatch = null;
    let minDistance = Infinity;
    
    for (const img of allImages) {
      const dist = hammingDistance(img.phash, uploadedPHash);
      if (dist < minDistance && dist !== -1) {
        minDistance = dist;
        bestMatch = img;
      }
    }

    if (minDistance < 10 && bestMatch) {
      results.phash_match = { found: true, kvs_id: bestMatch.kvs_id, distance: minDistance };
      results.confidence += 15;
    } else {
      results.phash_match = { found: false };
    }

    // Determine target record by any extracted watermarks or pHash
    const kvsId = results.dct_watermark?.data?.kvs_id
      || results.lsb_watermark?.data?.kvs_id
      || results.xmp_metadata?.data?.kvs_id
      || results.phash_match?.kvs_id;

    if (kvsId) {
      const record = await prisma.image.findUnique({ where: { kvs_id: kvsId } });
      results.db_record = record;

      if (record) {
        const currentHash = computeSHA256(buffer as any);
        results.hash_match = record.hash_sha256 === currentHash;
      }
    } else {
      // Fallback: Check if the exact SHA-256 hash is already in the database
      const currentHash = computeSHA256(buffer as any);
      const exactRecord = await prisma.image.findFirst({ where: { hash_sha256: currentHash } });
      if (exactRecord) {
        results.db_record = exactRecord;
        results.hash_match = true;
      }
    }

    // Determine final status
    if (results.db_record) {
      if (results.db_record.revoked) {
        results.overall = 'NOT_AUTHENTIC';
        results.confidence = 0;
      } else if (results.hash_match) {
        results.overall = 'VERIFIED';
        results.confidence = 100; // Perfect match is 100% authentic
      } else {
        // El hash no coincide exactamente, pero la imagen existe en la DB.
        // Si el pHash es muy cercano o se recuperó el DCT robusto, indica autenticidad preservada bajo compresión (Redes Sociales).
        const hasRobustIndicators = (results.phash_match?.found && results.phash_match.distance < 10) || results.dct_watermark?.found;
        
        if (hasRobustIndicators) {
          results.overall = 'VERIFIED_COMPRESSED';
          // Estimamos una confianza alta ya que pasó los filtros robustos de imagen
          results.confidence = Math.max(80, Math.min(95, results.confidence + 20));
        } else {
          // Si no tiene coincidencia de pHash ni DCT, probablemente ha sido alterada o manipulada significativamente.
          results.overall = 'MODIFIED';
          results.confidence = Math.max(30, Math.min(75, results.confidence));
        }
      }
    } else {
      results.overall = 'NOT_AUTHENTIC';
      results.confidence = 0;
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('[KVS Verify API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
