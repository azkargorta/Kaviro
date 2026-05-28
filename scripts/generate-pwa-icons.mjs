/**
 * Genera PNG 192/512 y apple-touch-icon (180) desde public/brand/icon.svg (o icon.png).
 * Uso: npm run icons:generate
 */
import { readFile, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const svgPath = join(root, "public", "brand", "icon.svg");
const pngPath = join(root, "public", "brand", "icon.png");

let srcBuffer;
try {
  await access(svgPath);
  const existingPng = await access(pngPath).then(() => true).catch(() => false);
  if (!existingPng) {
    srcBuffer = await readFile(svgPath);
    await sharp(srcBuffer).resize(512, 512).png().toFile(pngPath);
    console.log("Wrote", pngPath, "from SVG");
  }
} catch {
  /* sin SVG */
}
srcBuffer = await readFile(pngPath);

for (const size of [192, 512]) {
  const out = join(root, "public", "icons", `icon-${size}.png`);
  await sharp(srcBuffer).resize(size, size).png().toFile(out);
  console.log("Wrote", out);
}

{
  const out = join(root, "public", "icons", "apple-touch-icon.png");
  await sharp(srcBuffer).resize(180, 180).png().toFile(out);
  console.log("Wrote", out);
}
