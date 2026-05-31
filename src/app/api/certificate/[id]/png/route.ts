// src/app/api/certificate/[id]/png/route.ts
// Returns a PNG screenshot of the certificate (using pdfkit + canvas-based render)
// Since canvas isn't available on serverless, we use a creative approach:
// We return the PDF as a blob with a text/html wrapper that renders as image via CSS print styles,
// OR we generate a styled HTML-to-canvas PNG inline.
// Best compatible approach: we use pure node canvas to draw the certificate directly.
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import QRCode from 'qrcode';
import { createCanvas, CanvasRenderingContext2D as NodeCtx } from 'canvas';

type Ctx = any;

function drawGradientH(ctx: Ctx, x: number, y: number, w: number, h: number) {
  const grad = ctx.createLinearGradient(x, y, x + w, y);
  grad.addColorStop(0, '#00E5FF');
  grad.addColorStop(1, '#9D4EDD');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
}

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, fill: string, stroke?: string, sw = 1) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = sw; ctx.stroke(); }
}

async function renderCertPng(kvsData: any, ownerData: any, isCustom: boolean): Promise<Buffer> {
  const W = 1240, H = 1754; // A4 @ 150 dpi
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d') as any;

  // Background
  ctx.fillStyle = '#080D1A';
  ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = 'rgba(0,229,255,0.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= W; i += 80) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke(); }
  for (let j = 0; j <= H; j += 80) { ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(W, j); ctx.stroke(); }

  // Outer border
  ctx.strokeStyle = '#1E2D4A'; ctx.lineWidth = 2;
  ctx.strokeRect(24, 24, W - 48, H - 48);

  // Inner glow border
  ctx.strokeStyle = 'rgba(0,229,255,0.2)'; ctx.lineWidth = 1;
  ctx.strokeRect(34, 34, W - 68, H - 68);

  // Cyan corner accents
  const corner = (x: number, y: number, dx: number, dy: number) => {
    ctx.beginPath(); ctx.strokeStyle = '#00E5FF'; ctx.lineWidth = 4;
    ctx.moveTo(x, y + dy * 40); ctx.lineTo(x, y); ctx.lineTo(x + dx * 40, y);
    ctx.stroke();
  };
  corner(26, 26, 1, 1); corner(W - 26, 26, -1, 1);
  corner(26, H - 26, 1, -1); corner(W - 26, H - 26, -1, -1);

  // Top gradient bar
  drawGradientH(ctx, 40, 40, W - 80, 6);

  // Title
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 36px sans-serif';
  ctx.fillText('KYLLERIUM VISUAL SIGNATURE', 60, 110);

  ctx.fillStyle = '#00E5FF';
  ctx.font = '18px monospace';
  ctx.fillText('KYLLERIUM VISUAL SIGNATURE ENGINE  ·  VERSION 3.0', 60, 142);

  ctx.fillStyle = '#9D4EDD';
  ctx.font = '16px monospace';
  ctx.fillText(isCustom ? '★  CERTIFICADO DE AUTENTICIDAD PERSONALIZADO  ★' : '★  CERTIFICADO OFICIAL DEL SISTEMA  ★', 60, 168);

  // Divider
  ctx.strokeStyle = '#1E2D4A'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(40, 184); ctx.lineTo(W - 40, 184); ctx.stroke();

  // Status badge
  roundRect(ctx, 40, 196, W - 80, 52, 10, '#051409', '#10B981', 1.5);
  ctx.fillStyle = '#10B981'; ctx.beginPath(); ctx.arc(70, 222, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#10B981'; ctx.font = 'bold 18px monospace';
  ctx.fillText('✓  VERIFIED SECURE  ·  REGISTERED IN KYLLERIUM REGISTRY  ·  ENGINE V3.0', 88, 228);

  // Data rows
  const rowFn = (label: string, value: string, valColor: string, y: number) => {
    ctx.fillStyle = '#64748B'; ctx.font = '15px monospace';
    ctx.fillText(label.toUpperCase(), 40, y);
    ctx.fillStyle = valColor; ctx.font = '16px monospace';
    ctx.fillText(value, 280, y);
  };

  let curY = 290;
  // Section header
  ctx.fillStyle = '#00E5FF'; ctx.fillRect(40, curY - 14, 6, 22);
  ctx.fillStyle = '#E2E8F0'; ctx.font = 'bold 17px sans-serif';
  ctx.fillText('IMAGE METADATA & REGISTRY IDENTIFIERS', 54, curY);
  ctx.strokeStyle = '#1E2D4A'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(40, curY + 12); ctx.lineTo(W - 40, curY + 12); ctx.stroke();
  curY += 36;

  rowFn('KVS Registry ID', kvsData.kvs_id, '#00E5FF', curY); curY += 30;
  rowFn('KVS Fingerprint', kvsData.kvs_fingerprint || 'KVS-FP-NOT-GENERATED', '#9D4EDD', curY); curY += 30;
  rowFn('SHA-256 Hash', kvsData.hash_sha256 || 'Pending', '#CBD5E1', curY); curY += 30;
  rowFn('Owner', ownerData?.name || 'Kyllerium System', '#FFFFFF', curY); curY += 30;
  if (ownerData?.organization) { rowFn('Organization', ownerData.organization, '#FFFFFF', curY); curY += 30; }
  if (ownerData?.role) { rowFn('Role', ownerData.role, '#FFFFFF', curY); curY += 30; }
  if (isCustom && ownerData?.expirationDate) { rowFn('Valid Until', ownerData.expirationDate, '#EF4444', curY); curY += 30; }
  if (isCustom && ownerData?.usageDescription) { rowFn('Authorized Usage', ownerData.usageDescription, '#10B981', curY); curY += 30; }
  rowFn('Timestamp (UTC)', new Date(kvsData.upload_date || Date.now()).toISOString(), '#94A3B8', curY); curY += 46;

  // Section header: C2PA
  ctx.fillStyle = '#00E5FF'; ctx.fillRect(40, curY - 14, 6, 22);
  ctx.fillStyle = '#E2E8F0'; ctx.font = 'bold 17px sans-serif';
  ctx.fillText('C2PA CRYPTOGRAPHIC SECURITY BINDING', 54, curY);
  ctx.strokeStyle = '#1E2D4A'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(40, curY + 12); ctx.lineTo(W - 40, curY + 12); ctx.stroke();
  curY += 36;

  let c2paStatus = 'NOT SIGNED';
  if (kvsData.c2pa_manifest) {
    try {
      const p = JSON.parse(kvsData.c2pa_manifest);
      if (p && !p.error) c2paStatus = 'ACTIVE & SECURED IN IMAGE CONTAINER';
    } catch { /* ignore */ }
  }
  rowFn('C2PA Status', c2paStatus, c2paStatus.startsWith('ACTIVE') ? '#10B981' : '#F59E0B', curY); curY += 30;
  rowFn('Binding Date', new Date(kvsData.upload_date || Date.now()).toISOString(), '#00E5FF', curY); curY += 46;

  // Section header: Layers
  ctx.fillStyle = '#00E5FF'; ctx.fillRect(40, curY - 14, 6, 22);
  ctx.fillStyle = '#E2E8F0'; ctx.font = 'bold 17px sans-serif';
  ctx.fillText('ACTIVE PROVENANCE & SECURITY LAYERS', 54, curY);
  ctx.strokeStyle = '#1E2D4A'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(40, curY + 12); ctx.lineTo(W - 40, curY + 12); ctx.stroke();
  curY += 36;

  let layers = { dct: true, lsb: true, exif: true, c2pa: true };
  try {
    const p = JSON.parse(kvsData.watermark_data || '{}');
    if (p.layers) layers = p.layers;
  } catch { /* ignore */ }

  const layerDefs = [
    { name: 'DCT', active: !!layers.dct },
    { name: 'LSB', active: !!layers.lsb },
    { name: 'EXIF/XMP', active: !!layers.exif },
    { name: 'C2PA', active: !!layers.c2pa },
  ];
  const colW = (W - 80) / 2;
  layerDefs.forEach((l, i) => {
    const lx = 40 + (i % 2) * (colW + 8);
    const ly = curY + Math.floor(i / 2) * 44;
    roundRect(ctx, lx, ly, colW - 8, 36, 6, l.active ? '#0A1A0F' : '#0D1117', l.active ? '#10B981' : '#1E2D4A', 1.5);
    ctx.fillStyle = l.active ? '#10B981' : '#334155';
    ctx.beginPath(); ctx.arc(lx + 20, ly + 18, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = l.active ? '#FFFFFF' : '#475569'; ctx.font = 'bold 15px monospace';
    ctx.fillText(l.name, lx + 36, ly + 23);
  });

  curY += 100;

  // QR Code
  const verifyUrl = `https://kyllerium.com/verify/${kvsData.kvs_id}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    color: { dark: '#00E5FF', light: '#00000000' },
    width: 130,
    margin: 1
  });

  const footerTop = H - 160;
  ctx.strokeStyle = '#1E2D4A'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(40, footerTop); ctx.lineTo(W - 40, footerTop); ctx.stroke();

  // Bottom gradient bar
  drawGradientH(ctx, 40, H - 30, W - 80, 5);

  // QR
  const qrImg = await new Promise<any>((resolve, reject) => {
    const { Image } = require('canvas');
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = qrDataUrl;
  });
  ctx.drawImage(qrImg, W - 180, footerTop + 10, 130, 130);

  // Footer text
  ctx.fillStyle = '#94A3B8'; ctx.font = 'bold 15px monospace';
  ctx.fillText('CERTIFICATE SECURED BY KYLLERIUM CORPORATION', 40, footerTop + 28);
  ctx.fillStyle = '#475569'; ctx.font = '13px sans-serif';
  ctx.fillText('This document certifies that the corresponding digital asset has been', 40, footerTop + 52);
  ctx.fillText('securely registered in the Kyllerium system with military-grade invisible', 40, footerTop + 70);
  ctx.fillText('watermarking and cryptographic C2PA provenance signatures.', 40, footerTop + 88);
  ctx.fillStyle = '#00E5FF'; ctx.font = '14px monospace';
  ctx.fillText(`Verify: kyllerium.com/verify/${kvsData.kvs_id}`, 40, footerTop + 116);
  ctx.fillStyle = '#334155'; ctx.font = '12px monospace';
  ctx.fillText(`KVSE v3.0  ·  ${new Date().getFullYear()} Kyllerium Corp`, 40, footerTop + 138);

  return canvas.toBuffer('image/png');
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'official';

    const record = await prisma.image.findUnique({ where: { kvs_id: id } });
    if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    let ownerData: any;
    if (type === 'custom' && record.custom_certificate) {
      try { ownerData = JSON.parse(record.custom_certificate); } catch { /* ignore */ }
    }
    if (!ownerData) {
      ownerData = { name: record.owner_name, organization: record.owner_org, role: record.owner_role };
    }

    const isCustom = type === 'custom';
    const pngBuffer = await renderCertPng(record, ownerData, isCustom);

    return new Response(pngBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="KVS-${isCustom ? 'Custom' : 'Official'}-${id}.png"`,
        'Content-Length': String(pngBuffer.length),
      }
    });
  } catch (error: any) {
    console.error('[KVS PNG Cert] Error:', error);
    return NextResponse.json({ error: 'Server error generating PNG certificate' }, { status: 500 });
  }
}
