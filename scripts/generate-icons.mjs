// Renders the PNG icons in public/ from an SVG source. Run with `npm run icons`.
import sharp from 'sharp';

const glyph = (scale) => {
  const s = (v) => 256 + (v - 256) * scale;
  return `
    <rect x="${s(132)}" y="${s(150)}" width="${248 * scale}" height="${36 * scale}" rx="${18 * scale}" fill="#fff"/>
    <rect x="${s(132)}" y="${s(238)}" width="${248 * scale}" height="${36 * scale}" rx="${18 * scale}" fill="#fff" opacity=".85"/>
    <rect x="${s(132)}" y="${s(326)}" width="${160 * scale}" height="${36 * scale}" rx="${18 * scale}" fill="#fff" opacity=".55"/>`;
};

const rounded = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="120" fill="#6C63FF"/>${glyph(1)}</svg>`;
// Maskable and Apple icons are full-bleed; keep the glyph inside the safe zone.
const square = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#6C63FF"/>${glyph(0.8)}</svg>`;

const out = [
  ['public/icon-192.png', rounded, 192],
  ['public/icon-512.png', rounded, 512],
  ['public/icon-maskable-512.png', square, 512],
  ['public/apple-touch-icon.png', square, 180],
];

for (const [file, svg, size] of out) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(file);
  console.log('wrote', file);
}
