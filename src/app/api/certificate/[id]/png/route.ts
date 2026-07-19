// src/app/api/certificate/[id]/png/route.ts
// Generates a PNG image of the official unified certificate using next/og ImageResponse
import { ImageResponse } from 'next/og';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import React from 'react';

export const runtime = 'nodejs';

function buildElement(kvsData: any): React.ReactElement {
  const kvsId = kvsData.kvs_id || '';
  const verifyUrl = `kyllerium.com/verify/${kvsId}`;
  const ts = new Date(kvsData.upload_date || Date.now()).toISOString();

  // Parse extended metadata from metadata_json
  let meta: any = {};
  try {
    meta = JSON.parse(kvsData.metadata_json || '{}');
  } catch { /* ignore */ }

  const assetTitle = meta.title || 'Imagen Protegida KVS';
  const org = kvsData.owner_org || meta.organization || 'Sin Organización';
  const role = kvsData.owner_role || meta.role || 'Productor de Contenido';
  const expiration = meta.expirationDate || 'N/A';
  const usage = meta.usageDescription || 'Uso no restringido';

  let layers: any = { dct: true, lsb: true, exif: true, c2pa: true };
  try {
    const p = JSON.parse(kvsData.watermark_data || '{}');
    if (p.layers) layers = p.layers;
  } catch { /* ignore */ }

  const rows: { label: string; value: string; color: string }[] = [
    { label: 'KVS REGISTRY ID', value: kvsId, color: '#00E5FF' },
    { label: 'KVS FINGERPRINT', value: (kvsData.kvs_fingerprint || 'KVS-FP-NOT-GENERATED').substring(0, 52), color: '#9D4EDD' },
    { label: 'SHA-256 HASH', value: (kvsData.hash_sha256 || 'Pending').substring(0, 52), color: '#CBD5E1' },
    { label: 'ASSET TITLE', value: assetTitle, color: '#FFFFFF' },
    { label: 'REGISTERED OWNER', value: kvsData.owner_name || 'Kyllerium System', color: '#FFFFFF' },
    { label: 'ORGANIZATION', value: org, color: '#FFFFFF' },
    { label: 'ROLE / TITLE', value: role, color: '#FFFFFF' },
    { label: 'VALID UNTIL', value: expiration, color: '#EF4444' },
    { label: 'AUTHORIZED USAGE', value: usage, color: '#10B981' },
    { label: 'TIMESTAMP (UTC)', value: ts, color: '#94A3B8' },
  ];

  const layerDefs = [
    { name: 'DCT', active: !!layers.dct, desc: 'Spread-spectrum watermark' },
    { name: 'LSB', active: !!layers.lsb, desc: 'LSB steganography' },
    { name: 'EXIF/XMP', active: !!layers.exif, desc: 'Metadata binding' },
    { name: 'C2PA', active: !!layers.c2pa, desc: 'COSE crypto signature' },
  ];

  return React.createElement('div', {
    style: {
      width: 1240, height: 1754, background: '#080D1A',
      display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif', position: 'relative',
    }
  },
    // Outer border
    React.createElement('div', { style: { position: 'absolute', inset: 20, border: '1.5px solid #1E2D4A' } }),
    React.createElement('div', { style: { position: 'absolute', inset: 28, border: '0.5px solid rgba(0,229,255,0.2)' } }),

    // Corner accents
    React.createElement('div', { style: { position: 'absolute', top: 22, left: 22, width: 36, height: 36, borderTop: '3px solid #00E5FF', borderLeft: '3px solid #00E5FF' } }),
    React.createElement('div', { style: { position: 'absolute', top: 22, right: 22, width: 36, height: 36, borderTop: '3px solid #00E5FF', borderRight: '3px solid #00E5FF' } }),
    React.createElement('div', { style: { position: 'absolute', bottom: 22, left: 22, width: 36, height: 36, borderBottom: '3px solid #00E5FF', borderLeft: '3px solid #00E5FF' } }),
    React.createElement('div', { style: { position: 'absolute', bottom: 22, right: 22, width: 36, height: 36, borderBottom: '3px solid #00E5FF', borderRight: '3px solid #00E5FF' } }),

    // Top gradient bar
    React.createElement('div', { style: { position: 'absolute', top: 36, left: 36, right: 36, height: 5, background: 'linear-gradient(to right, #00E5FF, #9D4EDD)' } }),

    // Bottom gradient bar
    React.createElement('div', { style: { position: 'absolute', bottom: 28, left: 36, right: 36, height: 4, background: 'linear-gradient(to right, #00E5FF, #9D4EDD)' } }),

    // Content area
    React.createElement('div', { style: { display: 'flex', flexDirection: 'column', padding: '56px 56px 48px', flex: 1 } },
      // Header row
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 20, marginBottom: 12 } },
        React.createElement('div', { style: { width: 56, height: 56, border: '2px solid #00E5FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00E5FF', fontSize: 14, fontFamily: 'monospace' } }, 'KVS'),
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column' } },
          React.createElement('div', { style: { color: '#FFFFFF', fontSize: 30, fontWeight: 700, letterSpacing: 3 } }, 'KYLLERIUM VISUAL SIGNATURE'),
          React.createElement('div', { style: { color: '#00E5FF', fontSize: 13, fontFamily: 'monospace', letterSpacing: 2, marginTop: 4 } }, 'KYLLERIUM VISUAL SIGNATURE ENGINE  -  VERSION 3.0'),
        )
      ),
      React.createElement('div', { style: { color: '#9D4EDD', fontSize: 12, fontFamily: 'monospace', letterSpacing: 2, marginBottom: 16 } },
        '*  CERTIFICADO OFICIAL DEL SISTEMA  *'
      ),

      // Divider
      React.createElement('div', { style: { height: 1, background: '#1E2D4A', marginBottom: 16 } }),

      // Status badge
      React.createElement('div', {
        style: {
          display: 'flex', alignItems: 'center', gap: 12, background: '#051409',
          border: '1.5px solid #10B981', borderRadius: 8, padding: '12px 20px', marginBottom: 20
        }
      },
        React.createElement('div', { style: { width: 12, height: 12, borderRadius: '50%', background: '#10B981' } }),
        React.createElement('div', { style: { color: '#10B981', fontSize: 14, fontFamily: 'monospace', letterSpacing: 1 } },
          'OK  VERIFIED SECURE  -  REGISTERED IN KYLLERIUM REGISTRY  -  ENGINE V3.0'
        )
      ),

      // Section: Metadata
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 } },
        React.createElement('div', { style: { width: 5, height: 20, background: '#00E5FF' } }),
        React.createElement('div', { style: { color: '#E2E8F0', fontSize: 14, fontWeight: 700, letterSpacing: 1 } }, 'IMAGE METADATA & REGISTRY IDENTIFIERS')
      ),
      React.createElement('div', { style: { height: 1, background: '#1E2D4A', marginBottom: 12 } }),
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 20 } },
        ...rows.map((r, i) =>
          React.createElement('div', { key: i, style: { display: 'flex', gap: 0 } },
            React.createElement('div', { style: { color: '#64748B', fontSize: 11, fontFamily: 'monospace', width: 230 } }, r.label),
            React.createElement('div', { style: { color: r.color, fontSize: 12, fontFamily: 'monospace', flex: 1 } }, r.value)
          )
        )
      ),

      // Section: Layers
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 } },
        React.createElement('div', { style: { width: 5, height: 20, background: '#00E5FF' } }),
        React.createElement('div', { style: { color: '#E2E8F0', fontSize: 14, fontWeight: 700, letterSpacing: 1 } }, 'ACTIVE PROVENANCE & SECURITY LAYERS')
      ),
      React.createElement('div', { style: { height: 1, background: '#1E2D4A', marginBottom: 12 } }),
      React.createElement('div', { style: { display: 'flex', gap: 12, marginBottom: 24 } },
        ...layerDefs.map((l) =>
          React.createElement('div', {
            key: l.name,
            style: {
              flex: 1, display: 'flex', flexDirection: 'column', gap: 4,
              background: l.active ? '#0A1A0F' : '#0D1117',
              border: `1.5px solid ${l.active ? '#10B981' : '#1E2D4A'}`,
              borderRadius: 8, padding: '10px 14px'
            }
          },
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
              React.createElement('div', { style: { width: 8, height: 8, borderRadius: '50%', background: l.active ? '#10B981' : '#334155' } }),
              React.createElement('div', { style: { color: l.active ? '#FFFFFF' : '#475569', fontSize: 13, fontWeight: 700, fontFamily: 'monospace' } }, l.name)
            ),
            React.createElement('div', { style: { color: l.active ? '#94A3B8' : '#334155', fontSize: 10, fontFamily: 'monospace' } }, l.desc)
          )
        )
      ),

      // Spacer
      React.createElement('div', { style: { flex: 1 } }),

      // Footer
      React.createElement('div', { style: { height: 1, background: '#1E2D4A', marginBottom: 16 } }),
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 4 } },
        React.createElement('div', { style: { color: '#94A3B8', fontSize: 12, fontFamily: 'monospace', fontWeight: 700 } }, 'CERTIFICATE SECURED BY KYLLERIUM CORPORATION'),
        React.createElement('div', { style: { color: '#475569', fontSize: 10 } },
          'This document certifies that the digital asset has been securely registered in the Kyllerium system with military-grade invisible watermarking and cryptographic C2PA provenance signatures.'
        ),
        React.createElement('div', { style: { color: '#00E5FF', fontSize: 11, fontFamily: 'monospace', marginTop: 4 } }, `Verify: ${verifyUrl}`),
        React.createElement('div', { style: { color: '#334155', fontSize: 10, fontFamily: 'monospace' } }, `KVSE v3.0  -  ${new Date().getFullYear()} Kyllerium Corp  -  All rights reserved`)
      )
    )
  );
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const record = await prisma.image.findUnique({ where: { kvs_id: id } });
    if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const imageResponse = new ImageResponse(
      buildElement(record),
      { width: 1240, height: 1754 }
    );

    const bytes = await imageResponse.arrayBuffer();
    return new Response(bytes, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="KVS-Official-${id}.png"`,
        'Content-Length': String(bytes.byteLength),
      }
    });
  } catch (error: any) {
    console.error('[KVS PNG Cert] Error:', error);
    return NextResponse.json({ error: 'Server error generating PNG certificate' }, { status: 500 });
  }
}
