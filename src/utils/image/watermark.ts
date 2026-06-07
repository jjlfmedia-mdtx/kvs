import sharp from 'sharp';
import crypto from 'crypto';

const N = 8;
const COEFF_INDEX = 9;
const DCT_MIN_MAGNITUDE = 20;

// Derive a static KVS master key for encryption/decryption (falls back if env not set)
const KVS_SECRET = process.env.KVS_SECRET || 'kvse-military-grade-super-secret-key-3.0';

/** Ciphers payload text using AES-256-GCM and returns a compact hex string containing IV, authTag, and ciphertext */
function encryptPayload(text: string): string {
  const iv = crypto.randomBytes(12);
  // Derive key via PBKDF2 to get exactly 32 bytes
  const key = crypto.pbkdf2Sync(KVS_SECRET, 'kvs-salt-v3.0', 10000, 32, 'sha256');
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  // Format: iv(24hex):authTag(32hex):ciphertext
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

const cosineCache = new Float64Array(N * N);
for (let u = 0; u < N; u++) {
  for (let x = 0; x < N; x++) {
    cosineCache[u * N + x] = Math.cos(((2 * x + 1) * u * Math.PI) / (2 * N));
  }
}

function applyDCT8x8(block: number[]): Float64Array {
  const dct = new Float64Array(N * N);
  for (let u = 0; u < N; u++) {
    for (let v = 0; v < N; v++) {
      let sum = 0;
      for (let x = 0; x < N; x++) {
        for (let y = 0; y < N; y++) {
          sum += block[x * N + y] * cosineCache[u * N + x] * cosineCache[v * N + y];
        }
      }
      const cu = u === 0 ? 1 / Math.sqrt(2) : 1;
      const cv = v === 0 ? 1 / Math.sqrt(2) : 1;
      dct[u * N + v] = 0.25 * cu * cv * sum;
    }
  }
  return dct;
}

function applyIDCT8x8(dct: Float64Array): Float64Array {
  const block = new Float64Array(N * N);
  for (let x = 0; x < N; x++) {
    for (let y = 0; y < N; y++) {
      let sum = 0;
      for (let u = 0; u < N; u++) {
        for (let v = 0; v < N; v++) {
          const cu = u === 0 ? 1 / Math.sqrt(2) : 1;
          const cv = v === 0 ? 1 / Math.sqrt(2) : 1;
          sum += cu * cv * dct[u * N + v] * cosineCache[u * N + x] * cosineCache[v * N + y];
        }
      }
      block[x * N + y] = 0.25 * sum;
    }
  }
  return block;
}

function embedDCTInRaw(
  raw: Buffer,
  width: number,
  height: number,
  kvsId: string,
  maxPixelDelta: number
): boolean {
  // Encrypt the KVS identifier to prevent inspection of the frequency coefficient magnitude
  const encryptedText = encryptPayload(`KVS:${kvsId}`);
  const payloadBits = encryptedText.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join('');
  const blockWidths = Math.floor(width / N);
  const blockHeights = Math.floor(height / N);
  const totalBlocks = blockWidths * blockHeights;
  if (totalBlocks <= 0) return false;

  const rep = Math.max(1, Math.floor(totalBlocks / payloadBits.length));
  let bitIdx = 0;
  let blockCounter = 0;

  for (let by = 0; by < blockHeights; by++) {
    for (let bx = 0; bx < blockWidths; bx++) {
      if (bitIdx >= payloadBits.length) return true;

      const block = new Array(N * N);
      for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
          const pixelIdx = ((by * N + y) * width + (bx * N + x)) * 3;
          const r = raw[pixelIdx];
          const g = raw[pixelIdx + 1];
          const b = raw[pixelIdx + 2];
          block[y * N + x] = 0.299 * r + 0.587 * g + 0.114 * b;
        }
      }

      const dct = applyDCT8x8(block);
      const bit = payloadBits[bitIdx] === '1';
      const originalCoeff = dct[COEFF_INDEX];
      dct[COEFF_INDEX] = bit
        ? Math.max(DCT_MIN_MAGNITUDE, Math.abs(originalCoeff))
        : -Math.max(DCT_MIN_MAGNITUDE, Math.abs(originalCoeff));

      const idct = applyIDCT8x8(dct);

      for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
          const pixelIdx = ((by * N + y) * width + (bx * N + x)) * 3;
          const originalY = block[y * N + x];
          const newY = idct[y * N + x];
          const diff = Math.max(
            -maxPixelDelta,
            Math.min(maxPixelDelta, Math.round(newY - originalY))
          );

          raw[pixelIdx] = Math.max(0, Math.min(255, raw[pixelIdx] + diff));
          raw[pixelIdx + 1] = Math.max(0, Math.min(255, raw[pixelIdx + 1] + diff));
          raw[pixelIdx + 2] = Math.max(0, Math.min(255, raw[pixelIdx + 2] + diff));
        }
      }

      blockCounter++;
      if (blockCounter >= rep) {
        blockCounter = 0;
        bitIdx++;
      }
    }
  }

  return bitIdx >= payloadBits.length;
}

function embedLSBInRaw(raw: Buffer, payload: unknown): boolean {
  const payloadStr = JSON.stringify(payload);
  // Encrypt the LSB payload with AES-256-GCM before embedding
  const encryptedPayloadStr = encryptPayload(payloadStr);
  const payloadBits = encryptedPayloadStr.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join('');
  const fullBits = payloadBits + '00000000';
  if (fullBits.length > raw.length) return false;

  for (let i = 0; i < fullBits.length; i++) {
    raw[i] = (raw[i] & 0xFE) | parseInt(fullBits[i], 10);
  }

  return true;
}

async function encodeRaw(raw: Buffer, width: number, height: number, format?: string): Promise<Buffer> {
  let output = sharp(raw, { raw: { width, height, channels: 3 } });

  if (format === 'jpeg' || format === 'jpg') {
    output = output.jpeg({ quality: 100, chromaSubsampling: '4:4:4' });
  } else if (format === 'webp') {
    output = output.webp({ quality: 100, lossless: true });
  } else if (format === 'png') {
    output = output.png({ compressionLevel: 6 });
  } else {
    output = output.png({ compressionLevel: 6 });
  }

  return await output.toBuffer();
}

export async function embedWatermarkLayers(
  imageBuffer: Buffer,
  dctPayload: { kvs_id: string; owner?: string },
  lsbPayload: unknown
): Promise<{ buffer: Buffer; layers: { dct: boolean; lsb: boolean } }> {
  const img = sharp(imageBuffer);
  const metadata = await img.metadata();
  if (!metadata.width || !metadata.height) {
    return { buffer: imageBuffer, layers: { dct: false, lsb: false } };
  }

  const raw = await img
    .flatten({ background: { r: 0, g: 0, b: 0 } })
    .removeAlpha()
    .toColorspace('srgb')
    .raw()
    .toBuffer();

  const isJpeg = metadata.format === 'jpeg' || metadata.format === 'jpg';
  const maxPixelDelta = isJpeg ? 2 : 4;
  const dct = embedDCTInRaw(raw, metadata.width, metadata.height, dctPayload.kvs_id, maxPixelDelta);
  const lsb = embedLSBInRaw(raw, lsbPayload);
  const buffer = await encodeRaw(raw, metadata.width, metadata.height, metadata.format);

  return { buffer, layers: { dct, lsb } };
}
