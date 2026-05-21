// src/utils/image/lsb.ts
import sharp from 'sharp';

export async function embedLSB(imageBuffer: Buffer, payload: any): Promise<Buffer> {
  try {
    const payloadStr = JSON.stringify(payload);
    const payloadBits = payloadStr.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join('');
    const fullBits = payloadBits + '00000000'; // null terminator

    const img = sharp(imageBuffer);
    const metadata = await img.metadata();
    // Normalize to RGB to avoid issues with alpha channels or unusual color spaces
    const raw = await img.flatten({ background: { r: 0, g: 0, b: 0 } }).removeAlpha().toColorspace('srgb').raw().toBuffer();

    if (fullBits.length > raw.length) {
      console.warn('[KVS LSB] Image too small for payload, skipping');
      return imageBuffer;
    }

    for (let i = 0; i < fullBits.length; i++) {
      raw[i] = (raw[i] & 0xFE) | parseInt(fullBits[i], 10);
    }

    const fmt = metadata.format as string;
    let output = sharp(raw, {
      raw: { width: metadata.width!, height: metadata.height!, channels: 3 }
    });

    if (fmt === 'jpeg' || fmt === 'jpg') {
      output = output.jpeg({ quality: 100, chromaSubsampling: '4:4:4' });
    } else if (fmt === 'webp') {
      output = output.webp({ quality: 100, lossless: true });
    } else if (fmt === 'png') {
      output = output.png({ compressionLevel: 6 });
    } else {
      output = output.toFormat(fmt as any, { quality: 100 });
    }

    return await output.toBuffer();
  } catch (err: any) {
    console.warn('[KVS LSB] Embedding skipped:', err?.message);
    return imageBuffer;
  }
}

export async function extractLSB(imageBuffer: Buffer): Promise<string | null> {
  try {
    const img = sharp(imageBuffer);
    const raw = await img.flatten({ background: { r: 0, g: 0, b: 0 } }).removeAlpha().raw().toBuffer();

    let bits = '';
    for (let i = 0; i < raw.length; i++) {
      bits += (raw[i] & 1).toString();
      if (bits.length >= 8 && bits.endsWith('00000000')) break;
    }

    bits = bits.slice(0, -8);
    if (bits.length === 0) return null;

    let str = '';
    for (let i = 0; i < bits.length; i += 8) {
      str += String.fromCharCode(parseInt(bits.slice(i, i + 8), 2));
    }
    return str;
  } catch (err: any) {
    console.warn('[KVS LSB] Extraction skipped:', err?.message);
    return null;
  }
}
