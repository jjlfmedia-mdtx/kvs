const fs = require('fs');
const path = require('path');

async function main() {
  console.log('=== STARTING LIVE END-TO-END KVS WATERMARK TEST ===');
  
  const originalPath = path.join(__dirname, 'test-original.png');
  if (!fs.existsSync(originalPath)) {
    console.error('test-original.png does not exist! Please run create_test_image.js first.');
    process.exit(1);
  }

  const originalBuffer = fs.readFileSync(originalPath);
  console.log('Original Image loaded:', originalBuffer.length, 'bytes');

  // Step 1: Upload and Protect the Image
  console.log('\n--- STEP 1: PROTECTING IMAGE VIA /api/upload ---');
  const uploadForm = new FormData();
  const fileBlob = new Blob([originalBuffer], { type: 'image/png' });
  uploadForm.append('file', fileBlob, 'test-original.png');

  const uploadResponse = await fetch('http://localhost:3000/api/upload', {
    method: 'POST',
    body: uploadForm
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    console.error('Protect failed:', errorText);
    process.exit(1);
  }

  const uploadResult = await uploadResponse.json();
  if (!uploadResult.success) {
    console.error('Protect failed:', uploadResult);
    process.exit(1);
  }

  const filename = uploadResult.filename;
  console.log('Image protected successfully in database!');
  console.log('Filename:', filename);
  console.log('Generated KVS-ID:', uploadResult.kvs_id);
  console.log('Generated Fingerprint:', uploadResult.kvs_fingerprint);

  // Read the watermarked file from uploads directory
  const uploadsDir = path.join(__dirname, 'uploads');
  const protectedPath = path.join(uploadsDir, filename);
  const watermarkedBuffer = fs.readFileSync(protectedPath);
  console.log('Watermarked Image loaded from disk:', watermarkedBuffer.length, 'bytes');

  // Copy to local test-protected.png
  const localProtectedPath = path.join(__dirname, 'test-protected.png');
  fs.writeFileSync(localProtectedPath, watermarkedBuffer);
  console.log('Protected image saved locally to:', localProtectedPath);

  // Step 2: Verify the Watermarked Image
  console.log('\n--- STEP 2: VERIFYING WATERMARKED IMAGE VIA /api/verify ---');
  const verifyForm = new FormData();
  const protectedBlob = new Blob([watermarkedBuffer], { type: 'image/png' });
  verifyForm.append('file', protectedBlob, 'test-protected.png');

  const verifyResponse = await fetch('http://localhost:3000/api/verify', {
    method: 'POST',
    body: verifyForm
  });

  if (!verifyResponse.ok) {
    const errorText = await verifyResponse.text();
    console.error('Verification request failed:', errorText);
    process.exit(1);
  }

  const verificationResult = await verifyResponse.json();
  console.log('\n--- VERIFICATION RESULT ---');
  console.log(JSON.stringify(verificationResult, null, 2));

  console.log('\n=== ANALYSIS REPORT ===');
  console.log('Overall Status:', verificationResult.overall);
  console.log('Confidence Score:', verificationResult.confidence + '%');
  console.log('Hash Match (Integrity):', verificationResult.hash_match ? '✓ PERFECT' : '✗ MODIFIED');
  console.log('DCT Watermark Extracted:', verificationResult.dct_watermark?.found ? '✓ YES' : '✗ NO');
  if (verificationResult.dct_watermark?.found) {
    console.log('  DCT Payload:', JSON.stringify(verificationResult.dct_watermark.data));
  }
  console.log('LSB Watermark Extracted:', verificationResult.lsb_watermark?.found ? '✓ YES' : '✗ NO');
  if (verificationResult.lsb_watermark?.found) {
    console.log('  LSB Payload:', JSON.stringify(verificationResult.lsb_watermark.data));
  }
  console.log('Native C2PA Manifest Extracted:', verificationResult.c2pa_manifest?.found ? '✓ YES' : '✗ NO');
  if (verificationResult.c2pa_manifest?.found) {
    console.log('  C2PA Issuer:', verificationResult.c2pa_manifest.issuer);
    console.log('  C2PA Signed Time:', verificationResult.c2pa_manifest.time);
    console.log('  C2PA Manifest Title:', verificationResult.c2pa_manifest.title);
  }
  console.log('pHash Matches DB:', verificationResult.phash_match?.found ? '✓ YES' : '✗ NO');

  if (verificationResult.overall === 'VERIFIED') {
    console.log('\n🏆 SUCCESS: Kyllerium Visual Signature was successfully written and natively verified!');
  } else {
    console.log('\n❌ FAILURE: Verification did not meet verified criteria.');
  }
}

main().catch(err => {
  console.error('Fatal Test Error:', err);
});
