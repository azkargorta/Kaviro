/**
 * Genera settings.png y settings_dark.png para /brand/tabs (128×128).
 * Ejecutar: node scripts/generate-settings-tab-icon.mjs
 */
import sharp from "sharp";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "brand", "tabs");

/** Engranaje (estilo Lucide Settings), alineado con el resto de pestañas. */
function settingsSvg(stroke, strokeWidth = 1.45) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" fill="none">
  <g stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
    <circle cx="12" cy="12" r="3"/>
  </g>
</svg>`;
}

const INDIGO = "#4F46E5";
const WHITE = "#FFFFFF";

async function rasterize(svg, filename) {
  const png = await sharp(Buffer.from(svg)).resize(128, 128).png().toBuffer();
  writeFileSync(join(outDir, filename), png);
  console.log("Wrote", filename, png.length, "bytes");
}

await rasterize(settingsSvg(INDIGO), "settings.png");
await rasterize(settingsSvg(WHITE, 1.55), "settings_dark.png");
