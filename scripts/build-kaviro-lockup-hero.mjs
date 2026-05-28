/**
 * Lockup hero: anillo blanco + K blanca + «Kaviro» (referencia de marca sobre coral).
 * Uso: npm run brand:lockup-hero
 */
import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
/** Opcional: sustituye por tu PNG de referencia (anillo + K + Kaviro). */
const outPath = join(root, "public", "brand", "kaviro-lockup-coral.png");
const iconPath = join(root, "public", "brand", "icon.png");

const H = 80;
const RING = 72;

function isCoral(r, g, b) {
  return r > 180 && g > 60 && g < 200 && b > 60 && b < 200 && r > g && r > b;
}

async function extractWhiteK() {
  const { data, info } = await sharp(iconPath)
    .resize(RING, RING, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const out = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a < 20) {
      out[i + 3] = 0;
      continue;
    }
    if (isCoral(r, g, b)) {
      out[i + 3] = 0;
      continue;
    }
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (lum > 160) {
      out[i] = 255;
      out[i + 1] = 255;
      out[i + 2] = 255;
      out[i + 3] = Math.min(255, Math.round(((lum - 160) / 95) * 255));
    } else {
      out[i + 3] = 0;
    }
  }

  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim()
    .png()
    .toBuffer();
}

async function wordmarkPng(targetH) {
  const fontSize = Math.round(targetH * 0.72);
  const svg = Buffer.from(
    `<svg width="200" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <text x="0" y="${Math.round(fontSize * 0.92)}" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="${fontSize}" font-weight="800" fill="white">Kaviro</text>
    </svg>`
  );
  return sharp(svg).png().toBuffer();
}

async function main() {
  const ringSvg = Buffer.from(
    `<svg width="${RING}" height="${RING}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${RING / 2}" cy="${RING / 2}" r="${RING / 2 - 3}" fill="none" stroke="white" stroke-width="2.5"/>
    </svg>`
  );

  const ringPng = await sharp(ringSvg).png().toBuffer();
  const kMark = await extractWhiteK();
  const kSized = await sharp(kMark)
    .resize({ height: Math.round(RING * 0.48), fit: "contain" })
    .png()
    .toBuffer();
  const kSizedMeta = await sharp(kSized).metadata();

  const wordH = Math.round(H * 0.58);
  const wordSized = await sharp(await wordmarkPng(wordH))
    .trim()
    .resize({ height: wordH, fit: "contain" })
    .png()
    .toBuffer();
  const wordMeta = await sharp(wordSized).metadata();

  const gap = 12;
  const canvasW = RING + gap + wordMeta.width;
  const ringTop = Math.round((H - RING) / 2);
  const kLeft = Math.round((RING - kSizedMeta.width) / 2);
  const kTop = ringTop + Math.round((RING - kSizedMeta.height) / 2);
  const wordTop = Math.round((H - wordMeta.height) / 2);

  const png = await sharp({
    create: {
      width: canvasW,
      height: H,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: ringPng, left: 0, top: ringTop },
      { input: kSized, left: kLeft, top: kTop },
      { input: wordSized, left: RING + gap, top: wordTop },
    ])
    .png()
    .toBuffer();

  await writeFile(outPath, png);
  console.log("Wrote", outPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
