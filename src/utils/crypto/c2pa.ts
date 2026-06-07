// src/utils/crypto/c2pa.ts
import { createC2pa, createTestSigner, ManifestBuilder, SigningAlgorithm, type LocalSigner, type Signer } from 'c2pa-node';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';

function resolveSignerPaths() {
  const certificatePath = process.env.KVS_C2PA_CERT_PATH
    ? path.resolve(process.cwd(), process.env.KVS_C2PA_CERT_PATH)
    : path.resolve(process.cwd(), 'certs', 'cert.pem');

  const privateKeyPath = process.env.KVS_C2PA_PRIVATE_KEY_PATH
    ? path.resolve(process.cwd(), process.env.KVS_C2PA_PRIVATE_KEY_PATH)
    : path.resolve(process.cwd(), 'certs', 'private.pem');

  if (existsSync(certificatePath) && existsSync(privateKeyPath)) {
    return { certificatePath, privateKeyPath, issuer: 'Kyllerium Corporation' };
  }

  return null;
}

async function createLocalSigner(): Promise<{ signer: LocalSigner; issuer: string }> {
  const signerPaths = resolveSignerPaths();
  if (!signerPaths) {
    throw new Error('Missing C2PA certificate or private key');
  }
  const [certificate, privateKey] = await Promise.all([
    readFile(signerPaths.certificatePath),
    readFile(signerPaths.privateKeyPath),
  ]);

  return {
    signer: {
      type: 'local',
      certificate,
      privateKey,
      algorithm: SigningAlgorithm.ES256,
    },
    issuer: signerPaths.issuer,
  };
}

async function resolveSignerWithFallback(): Promise<{ signer: Signer; issuer: string }> {
  try {
    return await createLocalSigner();
  } catch (localErr: any) {
    console.warn('[KVS C2PA] Local signer unavailable, using test signer fallback:', localErr?.message ?? String(localErr));
    const signer = await createTestSigner();
    return { signer, issuer: 'Kyllerium Corporation (Test)' };
  }
}

export async function signWithC2PA(
  imageBuffer: Buffer,
  mimeType: string,
  kvsData: any,
  ownerData: any
): Promise<{ buffer: Buffer; injected: boolean; manifestSummary: string }> {
  try {
    // thumbnail: false prevents the "cannot read 'thumbnail' of undefined" crash
    const c2pa = createC2pa({ thumbnail: false });

    const { signer, issuer } = await resolveSignerWithFallback();

    const ownerName = ownerData?.name || 'Kyllerium User';
    const organization = ownerData?.organization || 'Kyllerium Corporation';

    const manifestDef = {
      claim_generator: 'Kyllerium Visual Signature Engine/3.0 (https://kyllerium.com)',
      title: `KVS Asset ${kvsData?.kvs_id}`,
      format: mimeType,
      assertions: [
        {
          label: 'c2pa.actions',
          data: {
            actions: [{
              action: 'c2pa.created',
              when: new Date().toISOString(),
              softwareAgent: 'Kyllerium Visual Signature Engine/3.0'
            }]
          }
        },
        {
          label: 'stds.schema-org.CreativeWork',
          data: {
            '@context': 'https://schema.org/',
            '@type': 'ImageObject',
            author: [{
              '@type': 'Person',
              name: ownerName,
              affiliation: { '@type': 'Organization', name: organization }
            }],
            identifier: kvsData?.kvs_id || 'unknown',
            copyrightHolder: { '@type': 'Person', name: ownerName },
            copyrightYear: new Date().getFullYear(),
            license: `https://kyllerium.com/verify/${kvsData?.kvs_id}`,
            description: `Certified by Kyllerium Visual Signature. KVS-ID: ${kvsData?.kvs_id}. Owner: ${ownerName}.`
          }
        },
        {
          label: 'com.kyllerium.kvs',
          data: {
            kvs_id: kvsData?.kvs_id,
            engine_version: '3.0',
            watermark_layers: ['DCT', 'LSB', 'EXIF', 'C2PA'],
            verification_url: `https://kyllerium.com/verify/${kvsData?.kvs_id}`,
            issued_at: new Date().toISOString(),
            expiration_date: ownerData?.expirationDate || 'None',
            usage_description: ownerData?.usageDescription || 'Standard registered use'
          }
        }
      ]
    };

    const manifest = new ManifestBuilder(manifestDef);

    const signedAssetResult = await c2pa.sign({
      asset: { buffer: imageBuffer, mimeType: mimeType as any },
      manifest: manifest,
      signer
    });

    const out = signedAssetResult as any;
    
    // c2pa-node can return the buffer in various shapes depending on the environment and version
    let outBuffer: Buffer | null = null;
    
    if (Buffer.isBuffer(out)) {
      outBuffer = out;
    } else if (out && Buffer.isBuffer(out.signedAsset)) {
      outBuffer = out.signedAsset;
    } else if (out && out.signedAsset && out.signedAsset.buffer) {
      outBuffer = Buffer.isBuffer(out.signedAsset.buffer) ? out.signedAsset.buffer : Buffer.from(out.signedAsset.buffer);
    } else if (out && Buffer.isBuffer(out.buffer)) {
      outBuffer = out.buffer;
    } else if (out && out.buffer) {
      outBuffer = Buffer.from(out.buffer);
    }

    const manifestSummary = JSON.stringify({
      issuer,
      algorithm: 'COSE/SHA-256',
      layers: ['DCT', 'LSB', 'EXIF', 'C2PA'],
      signed_at: new Date().toISOString(),
      kvs_id: kvsData?.kvs_id
    });

    if (outBuffer && outBuffer.length > 0) {
      return { buffer: outBuffer, injected: true, manifestSummary };
    }
    
    // If we reached here, it didn't throw, but no buffer was returned.
    console.warn('[KVS C2PA] c2pa.sign succeeded but returned empty/null buffer. Keys returned:', Object.keys(out || {}));
    return { buffer: imageBuffer, injected: false, manifestSummary };

  } catch (err: any) {
    console.warn('[KVS C2PA] Signing failed, continuing without C2PA:', err?.message ?? String(err));
    return {
      buffer: imageBuffer,
      injected: false,
      manifestSummary: JSON.stringify({ error: err?.message, note: 'C2PA signing skipped' })
    };
  }
}
