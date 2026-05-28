/**
 * Genera kaviro-lockup-fullcolor.png: K coral (#F87171) + wordmark navy del original.
 * Uso: npm run brand:lockup
 */
import { access, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const CORAL = { r: 248, g: 113, b: 113 };
const lockupPath = join(root, "public", "brand", "kaviro-lockup-fullcolor.png");
const backupPath = join(root, "tmp", "kaviro-lockup-fullcolor-backup.png");
const markSrc = join(root, "public", "brand", "kaviro-globe-pin.png");

async function extractCoralMark() {
  const { data, info } = await sharp(markSrc)
    .ensureAlpha()
    .resize(1400, 1400, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const out = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    const isBg = r > 225 && g > 225 && b > 225;
    const isBlue = a >= 12 && b > r + 12 && b > g + 6 && b > 90;
    if (isBg || !isBlue) {
      out[i + 3] = 0;
    } else {
      out[i] = CORAL.r;
      out[i + 1] = CORAL.g;
      out[i + 2] = CORAL.b;
      out[i + 3] = 255;
    }
  }

  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim()
    .png()
    .toBuffer();
}

async function findWordmarkStart(buffer, width, height) {
  const { data } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let x = Math.round(width * 0.25); x < width; x++) {
    let dark = 0;
    for (let y = 0; y < height; y += 4) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (a > 80 && r < 80 && g < 80 && b < 120) dark++;
    }
    if (dark > height / 32) return Math.max(0, x - 8);
  }
  return Math.round(width * 0.34);
}

async function buildLockup(sourcePath) {
  const srcBuf = await sharp(sourcePath).ensureAlpha().png().toBuffer();
  const meta = await sharp(srcBuf).metadata();
  const w = meta.width;
  const h = meta.height;
  const textX = await findWordmarkStart(srcBuf, w, h);

  const wordmark = await sharp(srcBuf)
    .extract({ left: textX, top: 0, width: w - textX, height: h })
    .png()
    .toBuffer();

  const mark = await extractCoralMark();
  const markH = Math.round(h * 0.84);
  const markResized = await sharp(mark).resize({ height: markH, fit: "contain" }).png().toBuffer();
  const markMeta = await sharp(markResized).metadata();

  const canvasW = Math.max(w, textX + markMeta.width + (w - textX));
  const gap = Math.round(h * 0.06);
  const markLeft = Math.round(h * 0.08);
  const markTop = Math.round((h - markMeta.height) / 2);
  const textLeft = markLeft + markMeta.width + gap;

  return sharp({
    create: {
      width: w,
      height: h,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: markResized, left: markLeft, top: markTop },
      { input: wordmark, left: textLeft, top: 0 },
    ])
    .png()
    .toBuffer();
}

let source = backupPath;
try {
  await access(backupPath);
} catch {
  source = lockupPath;
}

const png = await buildLockup(source);
await writeFile(lockupPath, png);
console.log("Wrote", lockupPath);
