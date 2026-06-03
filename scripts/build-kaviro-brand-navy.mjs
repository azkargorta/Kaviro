/**
 * Genera variantes navy del logo Kaviro oficial (misma forma que coral, color #1e3a5f).
 * Fuentes: icon.png, kaviro-lockup-fullcolor.png, kaviro-globe-pin.png (mismo pipeline que brand:lockup).
 * Uso: npm run brand:navy
 */
import { access, writeFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const brandDir = join(root, "public", "brand");

/** Kaviro Trips — navy corporativo */
const NAVY = { r: 30, g: 58, b: 95 };
const NAVY_HEX = "#1e3a5f";
const GIT_ICON = "7e0a2f9:public/brand/icon.png";

const paths = {
  iconCoral: join(brandDir, "icon.png"),
  iconNavy: join(brandDir, "icon-navy.png"),
  iconNavySvg: join(brandDir, "icon-navy.svg"),
  lockupFull: join(brandDir, "kaviro-lockup-fullcolor.png"),
  lockupNavy: join(brandDir, "kaviro-lockup-navy.png"),
  markCoral: join(brandDir, "kaviro-mark-coral.png"),
  markNavy: join(brandDir, "kaviro-mark-navy.png"),
  globePin: join(brandDir, "kaviro-globe-pin.png"),
  lockupBackup: join(root, "tmp", "kaviro-lockup-fullcolor-backup.png"),
};

function isWhitePixel(r, g, b, a) {
  return a > 200 && r > 210 && g > 210 && b > 210;
}

function isBlueBgPixel(r, g, b, a) {
  if (a < 8) return false;
  if (isWhitePixel(r, g, b, a)) return false;
  return b > r + 15 && b > g + 8;
}

/** Píxeles del símbolo coral (#F87171 y variantes). */
function isCoralPixel(r, g, b, a) {
  if (a < 12) return false;
  if (isWhitePixel(r, g, b, a)) return false;
  return r > 160 && g > 50 && g < 210 && b > 50 && b < 210 && r >= g && r >= b;
}

function paintNavy(out, i) {
  out[i] = NAVY.r;
  out[i + 1] = NAVY.g;
  out[i + 2] = NAVY.b;
  out[i + 3] = 255;
}

async function recolorBufferToNavy(inputBuffer) {
  const { data, info } = await sharp(inputBuffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.from(data);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (isCoralPixel(r, g, b, a) || isBlueBgPixel(r, g, b, a)) {
      paintNavy(out, i);
    }
  }

  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } }).png();
}

async function loadGitIcon(size) {
  const buf = execSync(`git show ${GIT_ICON}`, { cwd: root, encoding: "buffer" });
  return sharp(buf).ensureAlpha().resize(size, size, { fit: "cover" });
}

async function buildIconNavyFromGit() {
  const iconBuffer = await recolorBufferToNavy(await loadGitIcon(512).then((p) => p.toBuffer()));
  const png = await iconBuffer.toBuffer();
  await writeFile(paths.iconNavy, png);
  console.log("Wrote", paths.iconNavy);

  const b64 = png.toString("base64");
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" role="img" aria-label="Kaviro">
  <image width="512" height="512" xlink:href="data:image/png;base64,${b64}"/>
</svg>`;
  await writeFile(paths.iconNavySvg, svg);
  console.log("Wrote", paths.iconNavySvg);
}

async function recolorFileToNavy(srcPath, destPath) {
  const buf = await sharp(srcPath).png().toBuffer();
  await recolorBufferToNavy(buf).then((p) => p.toFile(destPath));
  console.log("Wrote", destPath);
}

async function extractNavyMarkFromGlobe() {
  const { data, info } = await sharp(paths.globePin)
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
      paintNavy(out, i);
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

/** Mismo layout que kaviro-lockup-fullcolor.png pero símbolo navy. */
async function buildLockupNavyFromSources() {
  let source = paths.lockupBackup;
  try {
    await access(source);
  } catch {
    source = paths.lockupFull;
  }

  const srcBuf = await sharp(source).ensureAlpha().png().toBuffer();
  const meta = await sharp(srcBuf).metadata();
  const w = meta.width;
  const h = meta.height;
  const textX = await findWordmarkStart(srcBuf, w, h);

  const wordmark = await sharp(srcBuf)
    .extract({ left: textX, top: 0, width: w - textX, height: h })
    .png()
    .toBuffer();

  const mark = await extractNavyMarkFromGlobe();
  const markH = Math.round(h * 0.84);
  const markResized = await sharp(mark).resize({ height: markH, fit: "contain" }).png().toBuffer();
  const markMeta = await sharp(markResized).metadata();

  const gap = Math.round(h * 0.06);
  const markLeft = Math.round(h * 0.08);
  const markTop = Math.round((h - markMeta.height) / 2);
  const textLeft = markLeft + markMeta.width + gap;

  const png = await sharp({
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

  await writeFile(paths.lockupNavy, png);
  console.log("Wrote", paths.lockupNavy);
}

async function main() {
  try {
    await access(paths.iconCoral);
    await recolorFileToNavy(paths.iconCoral, paths.iconNavy);
  } catch {
    await buildIconNavyFromGit();
  }

  try {
    await access(paths.markCoral);
    await recolorFileToNavy(paths.markCoral, paths.markNavy);
  } catch {
    const markFromIcon = await sharp(paths.iconNavy).resize(512, 512).png().toBuffer();
    await writeFile(paths.markNavy, markFromIcon);
    console.log("Wrote", paths.markNavy, "(from icon-navy)");
  }

  try {
    await access(paths.lockupFull);
    await recolorFileToNavy(paths.lockupFull, paths.lockupNavy);
  } catch {
    /* fallback abajo */
  }

  try {
    await access(paths.globePin);
    await buildLockupNavyFromSources();
  } catch (e) {
    console.warn("Lockup navy desde globe-pin:", e.message);
  }

  console.log(`Listo. Navy: ${NAVY_HEX}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
