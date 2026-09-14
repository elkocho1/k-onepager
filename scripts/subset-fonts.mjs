/**
 * Subsets the five KMR Apparat cuts (docs/phases/PHASE-8-seo-deploy.md,
 * item 8) from the raw material into public/fonts/: Latin-1 plus the
 * typographic punctuation German copy needs (dashes, „“” quotes, …, €, ™,
 * arrows) – every glyph the site could use, nothing else. Layout features
 * (kerning, ligatures) and the name table (licence records) are kept.
 *
 *   node scripts/subset-fonts.mjs            # writes public/fonts/*.woff2
 *   node scripts/subset-fonts.mjs --check    # only prints the sizes
 *
 * Needs Python with fontTools and brotli (`pip install fonttools brotli`).
 * Source: _material/fonts/WOFF2/ (gitignored, see docs/ASSETS.md).
 */
import { spawnSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';

const CUTS = ['Book', 'Regular', 'Medium', 'Bold', 'Heavy'];
const SOURCE_DIR = path.join(process.cwd(), '_material', 'fonts', 'WOFF2');
const TARGET_DIR = path.join(process.cwd(), 'public', 'fonts');
const MAX_BYTES = 40 * 1024; // phase 8 budget per file

// Latin-1 (incl. ×, ÷, ©, ®, °, §, ß, umlauts), Latin Extended-A pairs used in
// German/French names (Œ œ Š š Ÿ Ž ž), general punctuation (dashes, quotes,
// bullet, ellipsis, per mille, single guillemets), € and ™, arrows, minus.
const UNICODES = [
  'U+0000-00FF',
  'U+0152-0153',
  'U+0160-0161',
  'U+0178',
  'U+017D-017E',
  'U+2013-2014',
  'U+2018-201A',
  'U+201C-201E',
  'U+2020-2022',
  'U+2026',
  'U+2030',
  'U+2039-203A',
  'U+20AC',
  'U+2122',
  'U+2190-2193',
  'U+2212',
].join(',');

const checkOnly = process.argv.includes('--check');
let failed = false;

for (const cut of CUTS) {
  const file = `KMR-Apparat-${cut}.woff2`;
  const source = path.join(SOURCE_DIR, file);
  const target = path.join(TARGET_DIR, file);

  if (!checkOnly) {
    if (!existsSync(source)) {
      console.error(`missing source ${source}`);
      failed = true;
      continue;
    }
    const result = spawnSync(
      'python',
      [
        '-m',
        'fontTools.subset',
        source,
        `--unicodes=${UNICODES}`,
        '--layout-features=*',
        '--name-IDs=*',
        '--flavor=woff2',
        `--output-file=${target}`,
      ],
      { encoding: 'utf8' },
    );
    if (result.status !== 0) {
      console.error(`${file}: fontTools failed\n${result.stderr}`);
      failed = true;
      continue;
    }
  }

  const before = existsSync(source) ? statSync(source).size : null;
  const after = statSync(target).size;
  const ok = after <= MAX_BYTES;
  failed ||= !ok;
  console.log(
    `${ok ? 'ok  ' : 'OVER'} ${file.padEnd(26)} ${before ? `${(before / 1024).toFixed(1)} kB → ` : ''}${(after / 1024).toFixed(1)} kB`,
  );
}

process.exit(failed ? 1 : 0);
