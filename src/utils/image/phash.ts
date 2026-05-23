import sharp from 'sharp';

export async function computePHash(imageBuffer: Buffer): Promise<string> {
  // Real pHash flow:
  // 1) normalize to 32x32 grayscale
  // 2) run 2D DCT
  // 3) keep top-left 8x8 low-frequency coefficients (excluding DC for threshold)
  // 4) threshold by median to build 64-bit fingerprint
  const size = 32;
  const raw = await sharp(imageBuffer)
    .resize(size, size, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer();

  const f = new Array(size * size).fill(0);
  for (let i = 0; i < size * size; i++) {
    f[i] = raw[i];
  }

  const dct = new Array(size * size).fill(0);
  const c = (x: number) => (x === 0 ? 1 / Math.sqrt(2) : 1);

  for (let u = 0; u < size; u++) {
    for (let v = 0; v < size; v++) {
      let sum = 0;
      for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
          const pixel = f[x * size + y];
          const cosX = Math.cos(((2 * x + 1) * u * Math.PI) / (2 * size));
          const cosY = Math.cos(((2 * y + 1) * v * Math.PI) / (2 * size));
          sum += pixel * cosX * cosY;
        }
      }
      dct[u * size + v] = 0.25 * c(u) * c(v) * sum;
    }
  }

  const lowFreq: number[] = [];
  for (let u = 0; u < 8; u++) {
    for (let v = 0; v < 8; v++) {
      lowFreq.push(dct[u * size + v]);
    }
  }

  const thresholdSource = lowFreq.slice(1).sort((a, b) => a - b);
  const mid = Math.floor(thresholdSource.length / 2);
  const median =
    thresholdSource.length % 2 === 0
      ? (thresholdSource[mid - 1] + thresholdSource[mid]) / 2
      : thresholdSource[mid];

  let hash = '';
  for (let i = 0; i < lowFreq.length; i++) {
    hash += lowFreq[i] >= median ? '1' : '0';
  }

  return hash;
}

export function hammingDistance(hash1: string, hash2: string): number {
  if (hash1.length !== hash2.length) return -1;
  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) distance++;
  }
  return distance;
}
