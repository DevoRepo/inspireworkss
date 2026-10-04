// Generates favicons / app icons from the brand logo. Run: node scripts/generate-icons.mjs
import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';

const SRC = 'src/assets/brand/inspireworkss-logo.png';
// Crop to the hexagon mark (the source has generous black margins).
const crop = { left: 110, top: 100, width: 1034, height: 1034 };
const base = () => sharp(SRC).extract(crop);

const sizes = { 'favicon-32.png': 32, 'favicon-192.png': 192, 'favicon-512.png': 512, 'apple-touch-icon.png': 180 };
for (const [name, size] of Object.entries(sizes)) {
  await base().resize(size, size).png({ compressionLevel: 9, palette: true, quality: 90 }).toFile(`public/${name}`);
}

// favicon.ico containing a single 32×32 PNG image.
const png = await base().resize(32, 32).png().toBuffer();
const header = Buffer.alloc(22);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(1, 4); // image count
header.writeUInt8(32, 6); // width
header.writeUInt8(32, 7); // height
header.writeUInt8(0, 8); // palette
header.writeUInt8(0, 9); // reserved
header.writeUInt16LE(1, 10); // colour planes
header.writeUInt16LE(32, 12); // bits per pixel
header.writeUInt32LE(png.length, 14); // image size
header.writeUInt32LE(22, 18); // image offset
await writeFile('public/favicon.ico', Buffer.concat([header, png]));
console.log('icons generated');
