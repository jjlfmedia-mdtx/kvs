// src/utils/image/phash.ts
import sharp from 'sharp';

export async function computePHash(imageBuffer: Buffer): Promise<string> {
  const small = await sharp(imageBuffer)
    .resize(8, 8, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer();
  
  let sum = 0;
  for (let i = 0; i < 64; i++) {
    sum += small[i];
  }
  const avg = sum / 64;
  
  let hash = '';
  for (let i = 0; i < 64; i++) {
    hash += small[i] >= avg ? '1' : '0';
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
