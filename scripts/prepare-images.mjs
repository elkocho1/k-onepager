/**
 * Prepares raw material for the site (see docs/ASSETS.md). Run with
 * `npm run prepare-images`.
 *
 * 1. Photos: _material/Bilder → src/assets/images/ (resized JPGs, astro:assets
 *    converts them to WebP/AVIF at build time). Portfolio photos are missing in
 *    the material – the crane motifs are used as rotating placeholders.
 * 2. Logos: _material/Logos → public/logos/ with the target names from
 *    content/de.json. The logo wall tints logos via CSS mask, which needs an
 *    alpha channel – PNGs on a solid white background get the white knocked out.
 */
import { copyFile, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, '_material', 'Bilder');
const OUT = path.join(ROOT, 'src', 'assets', 'images');
const LOGO_SRC = path.join(ROOT, '_material');
const LOGO_OUT = path.join(ROOT, 'public', 'logos');

const PHOTOS = {
  cranesDusk: 'pexels-timothy-huliselan-205951426-13057675 (1).jpg', // 4000×3000 landscape
  cranesFoliage: 'pexels-jerry-zhang-392997481-35426213 (1).jpg', // 2420×3232 portrait
  cranesTall: 'pexels-anatoleos-34249048 (1).jpg', // 3542×5398 portrait
  cranesSunny: 'pexels-sunny-yadav-101150866-9550853 (1).jpg',
  founder: 'kappes Alexander.jpg', // 5239×7854, 11.8 MB
};

/** @type {{ src: string; out: string; width: number; quality?: number }[]} */
const JOBS = [
  { src: PHOTOS.cranesDusk, out: 'hero.jpg', width: 2560, quality: 80 },
  { src: PHOTOS.cranesFoliage, out: 'vision.jpg', width: 1600 },
  // Placeholder: Figma shows a wireframe skyline, client material is missing
  { src: PHOTOS.cranesTall, out: 'schwerpunkte.jpg', width: 2000 },
  // Face is in the upper part – crop via object-position in CSS
  { src: PHOTOS.founder, out: 'founder-alexander-kappes.jpg', width: 1600, quality: 82 },
  // Portfolio placeholders (rotating crane motifs)
  { src: PHOTOS.cranesSunny, out: 'portfolio/kappes-group.jpg', width: 1600 },
  { src: PHOTOS.cranesDusk, out: 'portfolio/place-strategy.jpg', width: 1600 },
  { src: PHOTOS.cranesFoliage, out: 'portfolio/vyncitech.jpg', width: 1600 },
  { src: PHOTOS.cranesTall, out: 'portfolio/welean.jpg', width: 1600 },
  { src: PHOTOS.cranesSunny, out: 'portfolio/i-pro-kom.jpg', width: 1600 },
  { src: PHOTOS.cranesDusk, out: 'portfolio/kappes-kemper.jpg', width: 1600 },
];

const DEFAULT_QUALITY = 80;

for (const job of JOBS) {
  const input = path.join(SRC, job.src);
  const output = path.join(OUT, job.out);
  await mkdir(path.dirname(output), { recursive: true });

  const info = await sharp(input)
    .rotate() // apply EXIF orientation, then strip metadata (sharp default)
    .resize({ width: job.width, withoutEnlargement: true })
    .jpeg({ quality: job.quality ?? DEFAULT_QUALITY, mozjpeg: true })
    .toFile(output);

  const { size } = await stat(output);
  console.log(
    `${job.out.padEnd(34)} ${String(info.width).padStart(5)}×${String(info.height).padEnd(5)} ${(size / 1024).toFixed(0).padStart(5)} kB`,
  );
}

// --- Logos (paths relative to _material/) -----------------------------------
/** @type {{ src: string; out: string; knockOutWhite?: boolean; trim?: boolean }[]} */
const LOGOS = [
  // Interim until the SVG mark arrives; Figma export has transparent padding → trim
  { src: 'figma-export/kplus-logo-139-34.png', out: 'kplus.png', trim: true },
  { src: 'Logos/einzeilig-logo_kappes (neu).svg', out: 'kappes-group.svg' },
  { src: 'Logos/Place.png', out: 'place-strategy.png', knockOutWhite: true },
  { src: 'Logos/vynci.png', out: 'vyncitech.png', knockOutWhite: true },
  { src: 'Logos/yolean.png', out: 'welean.png' },
  { src: 'Logos/Kappes-und-Kemper-Logo-2 (1).png', out: 'kappes-kemper.png' },
  // JPEG without transparency – shown unmasked (mask: false in de.json)
  { src: 'Logos/i-pro.jpeg', out: 'i-pro-kom.jpg' },
];

/**
 * Turns a logo on a solid white background into a transparent PNG. Alpha is
 * derived from the darkest channel, so dark and coloured pixels stay opaque
 * while white becomes transparent; RGB is kept for unmasked display.
 */
async function knockOutWhite(input, output) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const darkest = Math.min(data[i], data[i + 1], data[i + 2]);
    data[i + 3] = Math.min(255, (255 - darkest) * 2);
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toFile(output);
}

await mkdir(LOGO_OUT, { recursive: true });

for (const logo of LOGOS) {
  const input = path.join(LOGO_SRC, logo.src);
  const output = path.join(LOGO_OUT, logo.out);
  let action = 'copied        ';
  if (logo.knockOutWhite) {
    await knockOutWhite(input, output);
    action = 'white -> alpha';
  } else if (logo.trim) {
    await sharp(input).trim().png().toFile(output);
    action = 'trimmed       ';
  } else {
    await copyFile(input, output);
  }
  const { size } = await stat(output);
  console.log(`${logo.out.padEnd(34)} ${action} ${(size / 1024).toFixed(0).padStart(5)} kB`);
}
