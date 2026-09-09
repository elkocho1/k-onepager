/**
 * Image helpers.
 *
 * - `resolveImage()` maps image paths from content/de.json ("/images/hero.jpg")
 *   to the source files in src/assets/images/ so they can be passed to
 *   astro:assets (<Image> / <Picture>). Missing files fail the build.
 * - `publicImageSize()` reads the pixel size of a file in public/ (logos) for
 *   explicit width/height attributes (no layout shift).
 */
import path from 'node:path';
import type { ImageMetadata } from 'astro';
import sharp from 'sharp';

const PUBLIC_PREFIX = '/images/';
const SOURCE_PREFIX = '/src/assets/images/';

const sources = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/images/**/*.{jpg,jpeg,png,webp,avif}',
  { eager: true },
);

export function resolveImage(src: string): ImageMetadata {
  if (!src.startsWith(PUBLIC_PREFIX)) {
    throw new Error(`resolveImage: "${src}" must start with "${PUBLIC_PREFIX}"`);
  }
  const key = SOURCE_PREFIX + src.slice(PUBLIC_PREFIX.length);
  const module = sources[key];
  if (!module) {
    throw new Error(`resolveImage: no source file for "${src}" (expected ${key})`);
  }
  return module.default;
}

export interface ImageSize {
  width: number;
  height: number;
}

export async function publicImageSize(publicPath: string): Promise<ImageSize> {
  const file = path.join(process.cwd(), 'public', publicPath);
  const { width, height } = await sharp(file).metadata();
  if (!width || !height) {
    throw new Error(`publicImageSize: cannot read dimensions of "${publicPath}"`);
  }
  return { width, height };
}
