// src/utils/image/dct.ts
import sharp from 'sharp';

const N = 8;
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

/** Low-frequency AC coefficient index (index 9 = block[1][1]) for maximum robustness against clipping and compression */
const COEFF_INDEX = 9;

export async function embedDCT(imageBuffer: Buffer, payload: { kvs_id: string; owner?: string }): Promise<Buffer> {
  try {
    const kvsId = payload.kvs_id;
    const standardText = `KVS:${kvsId}`;
    const payloadBits = standardText.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join('');

    const img = sharp(imageBuffer);
    const metadata = await img.metadata();
    if (!metadata.width || !metadata.height) return imageBuffer;

    const raw = await img.flatten({ background: { r: 0, g: 0, b: 0 } }).removeAlpha().toColorspace('srgb').raw().toBuffer();
    
    const width = metadata.width;
    const height = metadata.height;
    const blockWidths = Math.floor(width / N);
    const blockHeights = Math.floor(height / N);
    const totalBlocks = blockWidths * blockHeights;

    const rep = Math.max(1, Math.floor(totalBlocks / payloadBits.length));

    let bitIdx = 0;
    let blockCounter = 0;
    let done = false;

    for (let by = 0; by < blockHeights && !done; by++) {
      for (let bx = 0; bx < blockWidths; bx++) {
        if (bitIdx >= payloadBits.length) {
          done = true;
          break;
        }

        const block = new Array(N * N);
        for (let y = 0; y < N; y++) {
          for (let x = 0; x < N; x++) {
            const pixelIdx = ((by * N + y) * width + (bx * N + x)) * 3;
            const r = raw[pixelIdx];
            const g = raw[pixelIdx + 1];
            const b = raw[pixelIdx + 2];
            // Standard Luminance weight coefficients (ITU-R BT.601)
            block[y * N + x] = 0.299 * r + 0.587 * g + 0.114 * b;
          }
        }

        const dct = applyDCT8x8(block);
        const bit = payloadBits[bitIdx] === '1';

        const originalCoeff = dct[COEFF_INDEX];
        const minMagnitude = 20; // robust against lossy clamping/compression
        
        if (bit) {
          dct[COEFF_INDEX] = Math.max(minMagnitude, Math.abs(originalCoeff));
        } else {
          dct[COEFF_INDEX] = -Math.max(minMagnitude, Math.abs(originalCoeff));
        }

        const idct = applyIDCT8x8(dct);

        for (let y = 0; y < N; y++) {
          for (let x = 0; x < N; x++) {
            const pixelIdx = ((by * N + y) * width + (bx * N + x)) * 3;
            const originalY = block[y * N + x];
            const newY = idct[y * N + x];
            const diff = Math.round(newY - originalY);
            
            // Apply the exact same luminance difference to all R, G, B channels.
            // This preserves color ratios, preventing any color cast, and is 100% color-neutral.
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

    return await sharp(raw, {
      raw: { width, height, channels: 3 }
    }).toFormat(metadata.format as any).toBuffer();
  } catch (err: any) {
    console.warn('[KVS DCT] Embedding failed:', err?.message);
    return imageBuffer;
  }
}

export async function extractDCT(imageBuffer: Buffer): Promise<string | null> {
  try {
    const img = sharp(imageBuffer);
    const metadata = await img.metadata();
    if (!metadata.width || !metadata.height) return null;

    const raw = await img.flatten({ background: { r: 0, g: 0, b: 0 } }).removeAlpha().toColorspace('srgb').raw().toBuffer();
    
    const width = metadata.width;
    const height = metadata.height;
    const blockWidths = Math.floor(width / N);
    const blockHeights = Math.floor(height / N);
    const totalBlocks = blockWidths * blockHeights;

    const expectedBits = 200; // 'KVS:' (32 bits) + 'KYL-IMG-YYYY-XXXXXXXX' (168 bits) = 200 bits total
    const rep = Math.max(1, Math.floor(totalBlocks / expectedBits));

    let blockCounter = 0;
    let currentBitSum = 0;
    let decodedBits = '';
    let done = false;

    for (let by = 0; by < blockHeights && !done; by++) {
      for (let bx = 0; bx < blockWidths; bx++) {
        if (decodedBits.length >= expectedBits) {
          done = true;
          break;
        }

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
        const val = dct[COEFF_INDEX];

        currentBitSum += val > 0 ? 1 : -1;
        blockCounter++;

        if (blockCounter >= rep) {
          decodedBits += currentBitSum >= 0 ? '1' : '0';
          blockCounter = 0;
          currentBitSum = 0;
        }
      }
    }

    let decodedStr = '';
    for (let i = 0; i < decodedBits.length; i += 8) {
      const byteStr = decodedBits.slice(i, i + 8);
      if (byteStr.length < 8) break;
      const charCode = parseInt(byteStr, 2);
      if (charCode === 0) break;
      decodedStr += String.fromCharCode(charCode);
    }

    console.log('[DEBUG DCT] Decoded string:', JSON.stringify(decodedStr));

    if (decodedStr.startsWith('KVS:')) {
      const kvsId = decodedStr.substring(4);
      if (kvsId.startsWith('KYL-IMG-')) {
        return JSON.stringify({ kvs_id: kvsId });
      }
    }

    return null;
  } catch (err: any) {
    console.warn('[KVS DCT] Extraction failed:', err?.message);
    return null;
  }
}
