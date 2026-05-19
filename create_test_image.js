const sharp = require('sharp');
const path = require('path');

async function main() {
  const width = 300;
  const height = 300;
  // Create a blue square with a white circle in the center
  const buffer = await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 10, g: 30, b: 70 }
    }
  })
  .composite([{
    input: Buffer.from(`<svg><circle cx="150" cy="150" r="80" fill="#00E5FF" /></svg>`),
    top: 0,
    left: 0
  }])
  .png()
  .toBuffer();

  const outputPath = path.join(process.cwd(), 'test-original.png');
  await require('fs').promises.writeFile(outputPath, buffer);
  console.log('Created test image:', outputPath);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
