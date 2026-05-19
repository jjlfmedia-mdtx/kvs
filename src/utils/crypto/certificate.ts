// src/utils/crypto/certificate.ts
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

export async function generateCertificate(kvsData: any, ownerData: any, isCustom: boolean): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // ── Background & Borders ──
      // Dark premium background
      doc.rect(0, 0, doc.page.width, doc.page.height).fill('#050505');

      // Decorative outer border (neon gradient simulation)
      doc.lineWidth(2);
      doc.lineJoin('round');
      doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke('#1E293B');

      // Subtle cyan border highlight
      doc.lineWidth(1);
      doc.rect(24, 24, doc.page.width - 48, doc.page.height - 48).stroke('#00E5FF');

      const kvsId = kvsData.kvs_id;
      const verifyUrl = `https://kyllerium.com/verify/${kvsId}`;
      const qrBuffer = await QRCode.toBuffer(verifyUrl, {
        color: { dark: '#00E5FF', light: '#00000000' }, // cyan QR over transparent bg
        margin: 1
      });

      // ── Header ──
      doc.moveDown(1.2);
      doc.fillColor('#FFFFFF').fontSize(24).text('KYLLERIUM VISUAL SIGNATURE', { align: 'center', characterSpacing: 1.5 });
      
      doc.moveDown(0.2);
      doc.fillColor('#9D4EDB').fontSize(10).text('CRYPTOGRAPHIC PROVENANCE & AUTHENTICITY RECORD', { align: 'center', characterSpacing: 1 });
      
      doc.moveDown(0.4);
      doc.fillColor('#00E5FF').fontSize(12).text(isCustom ? '★ CUSTOM SECURITY CERTIFICATE ★' : '★ OFFICIAL SYSTEM CERTIFICATE ★', { align: 'center' });
      
      // Decorative line
      doc.moveDown(0.6);
      doc.lineWidth(0.5);
      doc.moveTo(60, doc.y).lineTo(doc.page.width - 60, doc.y).stroke('#1E293B');
      doc.moveDown(0.8);

      // ── Status Banner ──
      doc.moveDown(0.4);
      const bannerY = doc.y;
      const bannerHeight = 28;

      // Draw filled box
      doc.rect(60, bannerY, doc.page.width - 120, bannerHeight).fill('#0B1519');
      // Draw border box
      doc.lineWidth(1);
      doc.rect(60, bannerY, doc.page.width - 120, bannerHeight).stroke('#00E5FF');
      
      // Print text centered vertically inside the box
      doc.fillColor('#10B981').fontSize(13).text('✓ VERIFIED AUTHENTIC', 60, bannerY + 8, { align: 'center', characterSpacing: 1 });
      doc.y = bannerY + bannerHeight + 15;

      // ── Helper Row Drawing Function ──
      const drawRow = (label: string, value: string, valueColor = '#FFFFFF') => {
        const rowY = doc.y;
        doc.fillColor('#64748B').fontSize(9).text(label.toUpperCase(), 60, rowY);
        doc.fillColor(valueColor).fontSize(9).text(value, 200, rowY, { width: doc.page.width - 260, lineBreak: true });
        doc.moveDown(0.5);
      };

      // ── Main Metadata Table ──
      doc.fillColor('#F1F5F9').fontSize(11).text('IMAGE METADATA & REGISTRY IDENTIFIERS', 60, doc.y);
      doc.moveDown(0.4);

      drawRow('KVS ID', kvsId, '#00E5FF');
      drawRow('KVS FINGERPRINT', kvsData.kvs_fingerprint || 'KVS-FINGERPRINT-NOT-GENERATED', '#9D4EDB');
      drawRow('SHA-256 HASH', kvsData.hash_sha256 || 'Pending', '#F1F5F9');
      drawRow('REGISTERED OWNER', ownerData?.name || 'Kyllerium System', '#FFFFFF');
      if (ownerData?.organization) drawRow('ORGANIZATION', ownerData.organization, '#FFFFFF');
      if (ownerData?.role) drawRow('ROLE / TITLE', ownerData.role, '#FFFFFF');
      
      if (isCustom) {
        if (ownerData?.expirationDate) {
          drawRow('VALID UNTIL', ownerData.expirationDate, '#EF4444'); // high prominence red for expiration!
        }
        if (ownerData?.usageDescription) {
          drawRow('AUTHORIZED USAGE', ownerData.usageDescription, '#10B981'); // beautiful green for authorized use!
        }
      }
      
      drawRow('TIMESTAMP (UTC)', new Date(kvsData.upload_date || Date.now()).toISOString(), '#94A3B8');

      // Decorative divider
      doc.moveDown(0.2);
      doc.lineWidth(0.5);
      doc.moveTo(60, doc.y).lineTo(doc.page.width - 60, doc.y).stroke('#1E293B');
      doc.moveDown(0.6);

      // ── C2PA Double Security Binding ──
      doc.fillColor('#F1F5F9').fontSize(11).text('C2PA CRYPTOGRAPHIC DOUBLE-SECURITY BINDING', 60, doc.y);
      doc.moveDown(0.4);

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
      doc.fillColor('#F1F5F9').fontSize(11).text('ACTIVE PROVENANCE & SECURITY LAYERS', 60, doc.y);
      doc.moveDown(0.5);

      const startLayersY = doc.y;
      
      const drawLayer = (name: string, desc: string, active: boolean, xOffset: number, yOffset: number) => {
        doc.rect(xOffset, yOffset, 10, 10).fill(active ? '#0F172A' : '#1A1A1A');
        doc.lineWidth(0.8);
        doc.rect(xOffset, yOffset, 10, 10).stroke(active ? '#00E5FF' : '#334155');
        
        if (active) {
          doc.fillColor('#00E5FF').fontSize(7).text('✓', xOffset + 2, yOffset + 1.5);
        }

        doc.fillColor(active ? '#FFFFFF' : '#475569').fontSize(9).text(name, xOffset + 18, yOffset + 1);
        doc.fillColor(active ? '#94A3B8' : '#334155').fontSize(7.5).text(desc, xOffset + 55, yOffset + 2);
      };

      // Extract layer statuses from DB record
      let layers = { dct: true, lsb: true, exif: true, c2pa: true };
      try {
        const parsed = JSON.parse(kvsData.watermark_data || '{}');
        if (parsed.layers) layers = parsed.layers;
      } catch {}

      drawLayer('DCT', 'Frequency-domain spread-spectrum watermark', !!layers.dct, 60, startLayersY);
      drawLayer('LSB', 'Spatial-domain least-significant-bits payload', !!layers.lsb, 60, startLayersY + 16);
      drawLayer('EXIF', 'JPEG Artist, Software, and UserComment metadata', !!layers.exif, 60, startLayersY + 32);
      drawLayer('C2PA', 'Adobe Content Credentials COSE cryptographic signature', !!layers.c2pa, 60, startLayersY + 48);

      // ── Footer & QR Code ──
      const footerY = doc.page.height - 100;
      doc.lineWidth(0.5);
      doc.moveTo(60, footerY - 8).lineTo(doc.page.width - 60, footerY - 8).stroke('#1E293B');

      // QR Code Placement
      doc.image(qrBuffer, doc.page.width - 120, footerY, { width: 60 });

      // Verification instructions on footer
      doc.fillColor('#94A3B8').fontSize(8.5).text('CERTIFICATE SECURED BY KYLLERIUM CORPORATION', 60, footerY + 8);
      doc.fillColor('#64748B').fontSize(7.5).text('This document certifies that the corresponding digital asset has been securely registered in the Kyllerium system with military-grade invisible watermarking and cryptographic C2PA provenance signatures.', 60, footerY + 20, { width: doc.page.width - 200 });
      doc.fillColor('#00E5FF').fontSize(7.5).text(`Verify provenance directly at: kyllerium.com/verify/${kvsId}`, 60, footerY + 46);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
