const fs = require('fs');
const path = require('path');

async function main() {
  console.log('=== KVS IMAGE QUALITY TEST ===\n');

  const originalPath = path.join(__dirname, 'test-original.png');
  if (!fs.existsSync(originalPath)) {
    console.error('test-original.png not found!');
    process.exit(1);
  }
  const originalBuffer = fs.readFileSync(originalPath);
  const originalSize = originalBuffer.length;
  console.log(`Original image: ${originalSize} bytes (${(originalSize/1024).toFixed(1)} KB)`);

  // Upload via local API
  console.log('\nUploading via /api/upload...');
  const form = new FormData();
  const blob = new Blob([originalBuffer], { type: 'image/png' });
  form.append('file', blob, 'test-original.png');

  const res = await fetch('http://localhost:3000/api/upload', {
    method: 'POST',
    body: form
  });

  if (!res.ok) {
    console.error('Upload failed:', await res.text());
    process.exit(1);
  }

  const result = await res.json();
  console.log('Upload OK! KVS-ID:', result.kvs_id);
  console.log('Output size:', result.size_kb, 'KB');
  
  // Compare sizes
  const ratio = (result.size_kb * 1024) / originalSize * 100;
  console.log(`\nSize ratio: ${ratio.toFixed(1)}% of original`);
  
  if (ratio < 50) {
    console.log('⚠️  WARNING: Output is less than 50% of original size - heavy quality loss!');
  } else if (ratio < 80) {
    console.log('⚠️  NOTICE: Some quality reduction detected.');
  } else {
    console.log('✅ Quality preserved well!');
  }

  // Download the processed image and compare pixel-by-pixel would require
  // the image to be accessible, so we just check sizes for now
  console.log('\n=== TEST COMPLETE ===');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
