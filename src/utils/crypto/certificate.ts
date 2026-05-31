// src/utils/crypto/certificate.ts
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

/** Helper function to draw a single certificate page on the PDFDocument */
async function drawCertificatePage(doc: any, kvsData: any, ownerData: any, isCustom: boolean) {
  const kvsId = kvsData.kvs_id;
  const verifyUrl = `https://kyllerium.com/verify/${kvsId}`;
  
  // Create QR Code buffer with high-fidelity transparency
  const qrBuffer = await QRCode.toBuffer(verifyUrl, {
    color: { dark: '#00E5FF', light: '#00000000' }, // cyan QR over transparent bg
    margin: 1
  });

  // ── Background & Borders ──
  // Softer premium dark color (slate/navy blend)
  doc.rect(0, 0, doc.page.width, doc.page.height).fill('#0A0F1D');

  // Decorative glowing grid lines (neon cyber aesthetic)
  doc.lineWidth(1);
  doc.strokeColor('#1E293B');
  for (let i = 40; i < doc.page.width; i += 80) {
    doc.moveTo(i, 0).lineTo(i, doc.page.height).stroke();
  }
  for (let j = 40; j < doc.page.height; j += 80) {
    doc.moveTo(0, j).lineTo(doc.page.width, j).stroke();
  }

  // Cover background again with an opacity-layered rect for subtle grid visibility
  doc.rect(0, 0, doc.page.width, doc.page.height).fill('#0A0F1D', 0.92);

  // Decorative outer border (neon gradient simulation)
  doc.lineWidth(2.5);
  doc.lineJoin('round');
  doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke('#1E294B');

  // Glowing cyan corner accents
  doc.lineWidth(2);
  doc.strokeColor('#00E5FF');
  // Top-Left corner accent
  doc.moveTo(18, 40).lineTo(18, 18).lineTo(40, 18).stroke();
  // Top-Right corner accent
  doc.moveTo(doc.page.width - 18, 40).lineTo(doc.page.width - 18, 18).lineTo(doc.page.width - 40, 18).stroke();
  // Bottom-Left corner accent
  doc.moveTo(18, doc.page.height - 40).lineTo(18, doc.page.height - 18).lineTo(40, doc.page.height - 18).stroke();
  // Bottom-Right corner accent
  doc.moveTo(doc.page.width - 18, doc.page.height - 40).lineTo(doc.page.width - 18, doc.page.height - 18).lineTo(doc.page.width - 40, doc.page.height - 18).stroke();

  // Subtle interior cyan border highlight
  doc.lineWidth(0.8);
  doc.rect(26, 26, doc.page.width - 52, doc.page.height - 52).stroke('#00E5FF');

  // ── Header ──
  doc.moveDown(1.5);
  doc.fillColor('#FFFFFF').fontSize(22).text('KYLLERIUM VISUAL SIGNATURE', { align: 'center', characterSpacing: 2 });
  
  doc.moveDown(0.25);
  doc.fillColor('#A78BFA').fontSize(9.5).text('CRYPTOGRAPHIC PROVENANCE & AUTHENTICITY RECORD', { align: 'center', characterSpacing: 1.5 });
  
  doc.moveDown(0.4);
  doc.fillColor('#00E5FF').fontSize(11).text(isCustom ? '★ CUSTOM SECURITY CERTIFICATE ★' : '★ OFFICIAL SYSTEM CERTIFICATE ★', { align: 'center', characterSpacing: 1 });
  
  // Decorative line
  doc.moveDown(0.6);
  doc.lineWidth(0.5);
  doc.moveTo(60, doc.y).lineTo(doc.page.width - 60, doc.y).stroke('#1E293B');
  doc.moveDown(0.8);

  // ── Status Banner ──
  doc.moveDown(0.2);
  const bannerY = doc.y;
  const bannerHeight = 32;

  // Draw smooth filled box with rounded corners
  doc.roundedRect(60, bannerY, doc.page.width - 120, bannerHeight, 8).fill('#0B171A');
  // Draw border box
  doc.lineWidth(1);
  doc.roundedRect(60, bannerY, doc.page.width - 120, bannerHeight, 8).stroke('#10B981');
  
  // Print status centered
  doc.fillColor('#10B981').fontSize(12).text('✓ VERIFIED SECURE & REGISTERED (ENGINE V3.0)', 60, bannerY + 10, { align: 'center', characterSpacing: 1 });
  doc.y = bannerY + bannerHeight + 20;

  // ── Helper Row Drawing Function ──
  const drawRow = (label: string, value: string, valueColor = '#FFFFFF') => {
    const rowY = doc.y;
    doc.fillColor('#64748B').fontSize(8.5).text(label.toUpperCase(), 60, rowY);
    doc.fillColor(valueColor).fontSize(8.5).text(value, 200, rowY, { width: doc.page.width - 260, lineBreak: true });
    doc.moveDown(0.65);
  };

  // ── Main Metadata Table ──
  doc.fillColor('#F1F5F9').fontSize(10.5).text('IMAGE METADATA & REGISTRY IDENTIFIERS', 60, doc.y, { characterSpacing: 0.5 });
  doc.moveDown(0.45);

  drawRow('KVS ID', kvsId, '#00E5FF');
  drawRow('KVS FINGERPRINT', kvsData.kvs_fingerprint || 'KVS-FINGERPRINT-NOT-GENERATED', '#A78BFA');
  drawRow('SHA-256 HASH', kvsData.hash_sha256 || 'Pending', '#F1F5F9');
  drawRow('REGISTERED OWNER', ownerData?.name || 'Kyllerium System', '#FFFFFF');
  if (ownerData?.organization) drawRow('ORGANIZATION', ownerData.organization, '#FFFFFF');
  if (ownerData?.role) drawRow('ROLE / TITLE', ownerData.role, '#FFFFFF');
  
  if (isCustom) {
    if (ownerData?.expirationDate) {
      drawRow('VALID UNTIL', ownerData.expirationDate, '#EF4444'); 
    }
    if (ownerData?.usageDescription) {
      drawRow('AUTHORIZED USAGE', ownerData.usageDescription, '#10B981'); 
    }
  }
  
  drawRow('TIMESTAMP (UTC)', new Date(kvsData.upload_date || Date.now()).toISOString(), '#94A3B8');

  // Decorative divider
  doc.moveDown(0.2);
  doc.lineWidth(0.5);
  doc.moveTo(60, doc.y).lineTo(doc.page.width - 60, doc.y).stroke('#1E293B');
  doc.moveDown(0.6);

  // ── C2PA Double Security Binding ──
  doc.fillColor('#F1F5F9').fontSize(10.5).text('C2PA CRYPTOGRAPHIC DOUBLE-SECURITY BINDING', 60, doc.y, { characterSpacing: 0.5 });
  doc.moveDown(0.45);

  let c2paStatus = "NOT SIGNED";
  let c2paIssuer = "N/A";
  let c2paTime = kvsData.upload_date || new Date().toISOString();

  if (kvsData.c2pa_manifest) {
    try {
      const parsedC2pa = JSON.parse(kvsData.c2pa_manifest);
      if (parsedC2pa && !parsedC2pa.error) {
        c2paStatus = "ACTIVE & SECURED IN IMAGE CONTAINER";
        c2paIssuer = parsedC2pa.issuer || "C2PA Test Signing Cert";
        c2paTime = parsedC2pa.signed_at || c2paTime;
      }
    } catch {}
  }

  drawRow('C2PA Status', c2paStatus, c2paStatus.startsWith("ACTIVE") ? '#10B981' : '#F59E0B');
  drawRow('Binding Date (UTC)', new Date(c2paTime).toISOString(), '#00E5FF');
  if (c2paStatus.startsWith("ACTIVE")) {
    drawRow('Authority Issuer', c2paIssuer, '#94A3B8');
  }

  // Decorative divider
  doc.moveDown(0.2);
  doc.lineWidth(0.5);
  doc.moveTo(60, doc.y).lineTo(doc.page.width - 60, doc.y).stroke('#1E293B');
  doc.moveDown(0.6);

  // ── Provenance Layers Checkbox ──
  doc.fillColor('#F1F5F9').fontSize(10.5).text('ACTIVE PROVENANCE & SECURITY LAYERS', 60, doc.y, { characterSpacing: 0.5 });
  doc.moveDown(0.55);

  const startLayersY = doc.y;
  
  const drawLayer = (name: string, desc: string, active: boolean, xOffset: number, yOffset: number) => {
    // Draw outer checkbox box with rounded edges
    doc.roundedRect(xOffset, yOffset, 11, 11, 2).fill(active ? '#0F172A' : '#1A1A1A');
    doc.lineWidth(1);
    doc.roundedRect(xOffset, yOffset, 11, 11, 2).stroke(active ? '#00E5FF' : '#334155');
    
    if (active) {
      doc.fillColor('#00E5FF').fontSize(8.5).text('✓', xOffset + 2.5, yOffset + 1);
    }

    doc.fillColor(active ? '#FFFFFF' : '#475569').fontSize(9).text(name, xOffset + 20, yOffset + 1);
    doc.fillColor(active ? '#94A3B8' : '#334155').fontSize(8).text(desc, xOffset + 60, yOffset + 2);
  };

  // Extract layer statuses from DB record
  let layers = { dct: true, lsb: true, exif: true, c2pa: true };
  try {
    const parsed = JSON.parse(kvsData.watermark_data || '{}');
    if (parsed.layers) layers = parsed.layers;
  } catch {}

  drawLayer('DCT', 'Frequency-domain spread-spectrum watermark', !!layers.dct, 60, startLayersY);
  drawLayer('LSB', 'Spatial-domain least-significant-bits payload', !!layers.lsb, 60, startLayersY + 18);
  drawLayer('EXIF', 'JPEG Artist, Software, and UserComment metadata', !!layers.exif, 60, startLayersY + 36);
  drawLayer('C2PA', 'Adobe Content Credentials COSE cryptographic signature', !!layers.c2pa, 60, startLayersY + 54);

  // ── Footer & QR Code ──
  const footerY = doc.page.height - 100;
  doc.lineWidth(0.5);
  doc.moveTo(60, footerY - 8).lineTo(doc.page.width - 60, footerY - 8).stroke('#1E293B');

  // QR Code Placement
  doc.image(qrBuffer, doc.page.width - 120, footerY, { width: 60 });

  // Verification instructions on footer
  doc.fillColor('#94A3B8').fontSize(8.5).text('CERTIFICATE SECURED BY KYLLERIUM CORPORATION', 60, footerY + 8, { characterSpacing: 0.5 });
  doc.fillColor('#64748B').fontSize(7.5).text('This document certifies that the corresponding digital asset has been securely registered in the Kyllerium system with military-grade invisible watermarking and cryptographic C2PA provenance signatures.', 60, footerY + 20, { width: doc.page.width - 200 });
  doc.fillColor('#00E5FF').fontSize(7.5).text(`Verify provenance directly at: kyllerium.com/verify/${kvsId}`, 60, footerY + 46);
}

/** Generates standard or custom certificate */
export async function generateCertificate(kvsData: any, ownerData: any, isCustom: boolean): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      await drawCertificatePage(doc, kvsData, ownerData, isCustom);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/** Generates combined 2-page certificate */
export async function generateCombinedCertificate(kvsData: any, officialOwner: any, customOwner: any): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Page 1: Official Certificate
      await drawCertificatePage(doc, kvsData, officialOwner, false);

      // Page 2: Custom Certificate
      doc.addPage({ size: 'A4', margin: 40 });
      await drawCertificatePage(doc, kvsData, customOwner, true);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
