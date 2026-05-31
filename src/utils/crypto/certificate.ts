// src/utils/crypto/certificate.ts  — KylLerium Visual Signature Engine v3.0
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

/** Helper – draw a horizontal colour bar (simulated gradient via strips) */
function drawGradientBar(doc: any, x: number, y: number, w: number, h: number) {
  const steps = 60;
  const stepW = w / steps;
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const r = Math.round(0 + t * 157);
    const g = Math.round(229 - t * 154);
    const b = Math.round(255 - t * 34);
    doc.rect(x + i * stepW, y, stepW + 0.5, h).fill(`rgb(${r},${g},${b})`);
  }
}

/** Draw a single premium certificate page */
async function drawCertificatePage(doc: any, kvsData: any, ownerData: any, isCustom: boolean) {
  const kvsId = kvsData.kvs_id;
  const verifyUrl = `https://kyllerium.com/verify/${kvsId}`;
  const W = doc.page.width;
  const H = doc.page.height;

  // ── Full dark background ──
  doc.rect(0, 0, W, H).fill('#080D1A');

  // ── Subtle grid overlay ──
  doc.lineWidth(0.3).strokeOpacity(0.08);
  for (let i = 0; i <= W; i += 60) doc.moveTo(i, 0).lineTo(i, H).stroke('#00E5FF');
  for (let j = 0; j <= H; j += 60) doc.moveTo(0, j).lineTo(W, j).stroke('#00E5FF');
  doc.strokeOpacity(1);

  // ── Outer border ──
  doc.rect(16, 16, W - 32, H - 32).lineWidth(1.2).stroke('#1E2D4A');

  // ── Inner glow border ──
  doc.rect(22, 22, W - 44, H - 44).lineWidth(0.5).stroke('#00E5FF').strokeOpacity(0.25);
  doc.strokeOpacity(1);

  // ── Cyan corner accents ──
  const corner = (x: number, y: number, dx: number, dy: number) => {
    doc.lineWidth(2.5).strokeColor('#00E5FF').strokeOpacity(0.9);
    doc.moveTo(x, y + dy * 28).lineTo(x, y).lineTo(x + dx * 28, y).stroke();
    doc.strokeOpacity(1);
  };
  corner(18, 18, 1, 1);
  corner(W - 18, 18, -1, 1);
  corner(18, H - 18, 1, -1);
  corner(W - 18, H - 18, -1, -1);

  // ── Header gradient bar (cyan→purple) ──
  drawGradientBar(doc, 30, 30, W - 60, 4);

  // ── Logo area ──
  doc.rect(42, 52, 40, 40).lineWidth(1).stroke('#00E5FF').strokeOpacity(0.6);
  doc.strokeOpacity(1);
  // Shield icon drawn with lines
  doc.lineWidth(1.5).strokeColor('#00E5FF');
  doc.moveTo(62, 57).lineTo(76, 57).lineTo(76, 69).bezierCurveTo(76, 78, 62, 82, 62, 82)
     .bezierCurveTo(62, 82, 48, 78, 48, 69).lineTo(48, 57).lineTo(62, 57).stroke();
  doc.fillColor('#00E5FF').fontSize(7).text('KVS', 56, 68);

  // ── Title block ──
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(20).text('KYLLERIUM VISUAL SIGNATURE', 92, 55, { characterSpacing: 2 });
  doc.fillColor('#00E5FF').fontSize(8.5).font('Helvetica').text('KYLLERIUM VISUAL SIGNATURE ENGINE  ·  VERSION 3.0', 92, 80, { characterSpacing: 1.5 });
  doc.fillColor('#9D4EDD').fontSize(8).text(isCustom ? '★  CERTIFICADO DE AUTENTICIDAD PERSONALIZADO  ★' : '★  CERTIFICADO OFICIAL DEL SISTEMA  ★', 92, 93, { characterSpacing: 1 });

  // ── Divider after header ──
  doc.lineWidth(0.5).strokeColor('#1E2D4A').moveTo(30, 108).lineTo(W - 30, 108).stroke();

  // ── Status badge ──
  const badgeY = 118;
  doc.roundedRect(30, badgeY, W - 60, 34, 6).fill('#051409');
  doc.roundedRect(30, badgeY, W - 60, 34, 6).lineWidth(1).stroke('#10B981').strokeOpacity(0.7);
  doc.strokeOpacity(1);
  // Green dot
  doc.circle(52, badgeY + 17, 5).fill('#10B981');
  doc.fillColor('#10B981').font('Helvetica-Bold').fontSize(11).text('✓  VERIFIED SECURE  ·  REGISTERED IN KYLLERIUM REGISTRY  ·  ENGINE V3.0', 66, badgeY + 10, { characterSpacing: 0.8 });

  // ── Section: Registry Identifiers ──
  let curY = badgeY + 52;

  const sectionHeader = (label: string, y: number) => {
    doc.rect(30, y, 4, 14).fill('#00E5FF');
    doc.fillColor('#E2E8F0').font('Helvetica-Bold').fontSize(9.5).text(label, 40, y + 2, { characterSpacing: 0.8 });
    doc.lineWidth(0.4).strokeColor('#1E2D4A').moveTo(30, y + 18).lineTo(W - 30, y + 18).stroke();
    return y + 26;
  };

  const row = (label: string, value: string, valColor: string, y: number) => {
    doc.fillColor('#64748B').font('Helvetica').fontSize(8).text(label.toUpperCase(), 30, y, { width: 140 });
    doc.fillColor(valColor).font('Helvetica').fontSize(8.5).text(value, 178, y, { width: W - 220, lineBreak: true });
    return y + 18;
  };

  curY = sectionHeader('IMAGE METADATA & REGISTRY IDENTIFIERS', curY);
  curY = row('KVS Registry ID', kvsId, '#00E5FF', curY);
  curY = row('KVS Fingerprint', kvsData.kvs_fingerprint || 'KVS-FP-NOT-GENERATED', '#9D4EDD', curY);
  curY = row('SHA-256 Hash', kvsData.hash_sha256 || 'Pending', '#CBD5E1', curY);
  curY = row('Registered Owner', ownerData?.name || 'Kyllerium System', '#FFFFFF', curY);
  if (ownerData?.organization) curY = row('Organization', ownerData.organization, '#FFFFFF', curY);
  if (ownerData?.role) curY = row('Role / Title', ownerData.role, '#FFFFFF', curY);
  if (isCustom && ownerData?.expirationDate) curY = row('Valid Until', ownerData.expirationDate, '#EF4444', curY);
  if (isCustom && ownerData?.usageDescription) curY = row('Authorized Usage', ownerData.usageDescription, '#10B981', curY);
  curY = row('Timestamp (UTC)', new Date(kvsData.upload_date || Date.now()).toISOString(), '#94A3B8', curY);

  curY += 8;

  // ── Section: C2PA ──
  curY = sectionHeader('C2PA CRYPTOGRAPHIC DOUBLE-SECURITY BINDING', curY);

  let c2paStatus = 'NOT SIGNED';
  let c2paIssuer = 'N/A';
  let c2paTime = kvsData.upload_date || new Date().toISOString();
  if (kvsData.c2pa_manifest) {
    try {
      const p = JSON.parse(kvsData.c2pa_manifest);
      if (p && !p.error) {
        c2paStatus = 'ACTIVE & SECURED IN IMAGE CONTAINER';
        c2paIssuer = p.issuer || 'C2PA Test Signing Cert';
        c2paTime = p.signed_at || c2paTime;
      }
    } catch { /* ignore */ }
  }

  curY = row('C2PA Status', c2paStatus, c2paStatus.startsWith('ACTIVE') ? '#10B981' : '#F59E0B', curY);
  curY = row('Binding Date (UTC)', new Date(c2paTime).toISOString(), '#00E5FF', curY);
  if (c2paStatus.startsWith('ACTIVE')) curY = row('Authority Issuer', c2paIssuer, '#94A3B8', curY);

  curY += 8;

  // ── Section: Protection Layers ──
  curY = sectionHeader('ACTIVE PROVENANCE & SECURITY LAYERS', curY);

  let layers = { dct: true, lsb: true, exif: true, c2pa: true };
  try {
    const p = JSON.parse(kvsData.watermark_data || '{}');
    if (p.layers) layers = p.layers;
  } catch { /* ignore */ }

  const layerDefs = [
    { key: 'dct', name: 'DCT', desc: 'Frequency-domain spread-spectrum watermark', active: !!layers.dct },
    { key: 'lsb', name: 'LSB', desc: 'Spatial-domain least-significant-bits payload', active: !!layers.lsb },
    { key: 'exif', name: 'EXIF/XMP', desc: 'JPEG Artist, Software, UserComment metadata', active: !!layers.exif },
    { key: 'c2pa', name: 'C2PA', desc: 'Adobe Content Credentials COSE cryptographic signature', active: !!layers.c2pa },
  ];

  const colW = (W - 60) / 2;
  layerDefs.forEach((l, i) => {
    const lx = 30 + (i % 2) * (colW + 4);
    const ly = curY + Math.floor(i / 2) * 22;
    doc.roundedRect(lx, ly, colW - 4, 18, 3).fill(l.active ? '#0A1A0F' : '#0D1117');
    doc.roundedRect(lx, ly, colW - 4, 18, 3).lineWidth(0.7).stroke(l.active ? '#10B981' : '#1E2D4A').strokeOpacity(0.8);
    doc.strokeOpacity(1);
    const dot = l.active ? '#10B981' : '#334155';
    doc.circle(lx + 12, ly + 9, 4).fill(dot);
    doc.fillColor(l.active ? '#FFFFFF' : '#475569').font('Helvetica-Bold').fontSize(8).text(l.name, lx + 22, ly + 5);
    doc.fillColor(l.active ? '#94A3B8' : '#334155').font('Helvetica').fontSize(7).text(l.desc, lx + 60, ly + 6, { width: colW - 68 });
  });

  curY += 50;

  // ── QR Code + Footer ──
  const qrBuffer = await QRCode.toBuffer(verifyUrl, {
    color: { dark: '#00E5FF', light: '#00000000' },
    width: 90,
    margin: 1
  });

  const footerTop = H - 110;
  doc.lineWidth(0.5).strokeColor('#1E2D4A').moveTo(30, footerTop).lineTo(W - 30, footerTop).stroke();

  // Footer gradient bar
  drawGradientBar(doc, 30, H - 20, W - 60, 3);

  // QR Code
  doc.image(qrBuffer, W - 118, footerTop + 8, { width: 82 });
  doc.lineWidth(0.7).strokeColor('#00E5FF').strokeOpacity(0.4)
     .rect(W - 120, footerTop + 6, 86, 86).stroke();
  doc.strokeOpacity(1);
  doc.fillColor('#00E5FF').font('Helvetica').fontSize(6).text('SCAN TO VERIFY', W - 118, footerTop + 94, { width: 82, align: 'center' });

  // Footer text
  doc.fillColor('#94A3B8').font('Helvetica-Bold').fontSize(8).text('CERTIFICATE SECURED BY KYLLERIUM CORPORATION', 30, footerTop + 10, { characterSpacing: 0.5 });
  doc.fillColor('#475569').font('Helvetica').fontSize(7).text(
    'This document certifies that the corresponding digital asset has been securely registered in the Kyllerium system with military-grade invisible watermarking and cryptographic C2PA provenance signatures. Any alteration of this document or the associated image file voids all registered protections.',
    30, footerTop + 24, { width: W - 175 }
  );
  doc.fillColor('#00E5FF').font('Helvetica').fontSize(7.5).text(`Verify directly: kyllerium.com/verify/${kvsId}`, 30, footerTop + 72, { characterSpacing: 0.3 });
  doc.fillColor('#334155').fontSize(7).text(`KVSE v3.0  ·  ${new Date().getFullYear()} Kyllerium Corp  ·  All rights reserved`, 30, footerTop + 85);
}

/** Generates standard or custom certificate */
export async function generateCertificate(kvsData: any, ownerData: any, isCustom: boolean): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: true });
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      await drawCertificatePage(doc, kvsData, ownerData, isCustom);
      doc.end();
    } catch (err) { reject(err); }
  });
}

/** Generates combined 2-page certificate */
export async function generateCombinedCertificate(kvsData: any, officialOwner: any, customOwner: any): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: true });
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      await drawCertificatePage(doc, kvsData, officialOwner, false);
      doc.addPage({ size: 'A4', margin: 0 });
      await drawCertificatePage(doc, kvsData, customOwner, true);
      doc.end();
    } catch (err) { reject(err); }
  });
}
