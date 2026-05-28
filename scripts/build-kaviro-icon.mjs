/**
 * Genera icon.png e icon.svg (círculo coral + K blanca) desde el icono oficial en git.
 * El SVG embebe el PNG recolorizado para fidelidad perfecta del símbolo.
 * Uso: npm run icons:build
 */
import { execSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const CORAL_HEX = "#F87171";
const SIZE = 512;
const SVG_SIZE = 512;
const GIT_ICON = "7e0a2f9:public/brand/icon.png";

const iconPath = join(root, "public", "brand", "icon.png");
const iconSvgPath = join(root, "public", "brand", "icon.svg");
const iconsDir = join(root, "public", "icons");

function isWhitePixel(r, g, b, a) {
  return a > 200 && r > 210 && g > 210 && b > 210;
}

function isBlueBgPixel(r, g, b, a) {
  if (a < 8) return false;
  if (isWhitePixel(r, g, b, a)) return false;
  return b > r + 15 && b > g + 8;
}

async function loadGitIcon(size) {
  const buf = execSync(`git show ${GIT_ICON}`, { cwd: root, encoding: "buffer" });
  return sharp(buf).ensureAlpha().resize(size, size, { fit: "cover" });
}

async function recolorToCoral(pipeline) {
  const { data, info } = await pipeline.raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.from(data);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (isBlueBgPixel(r, g, b, a)) {
      out[i] = 248;
      out[i + 1] = 113;
      out[i + 2] = 113;
      out[i + 3] = 255;
    }
  }

  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } }).png();
}

function buildSvgFromPng(pngBuffer) {
  const b64 = pngBuffer.toString("base64");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${SVG_SIZE} ${SVG_SIZE}" role="img" aria-label="Kaviro">
  <image width="${SVG_SIZE}" height="${SVG_SIZE}" xlink:href="data:image/png;base64,${b64}"/>
</svg>`;
}

const iconBuffer = await recolorToCoral(await loadGitIcon(SIZE)).then((p) => p.toBuffer());

await writeFile(iconPath, iconBuffer);
console.log("Wrote", iconPath);

for (const size of [192, 512]) {
  const out = join(iconsDir, `icon-${size}.png`);
  await sharp(iconBuffer).resize(size, size).png().toFile(out);
  console.log("Wrote", out);
}

const apple = join(iconsDir, "apple-touch-icon.png");
await sharp(iconBuffer).resize(180, 180).png().toFile(apple);
console.log("Wrote", apple);

await writeFile(iconSvgPath, buildSvgFromPng(iconBuffer));
console.log("Wrote", iconSvgPath);
