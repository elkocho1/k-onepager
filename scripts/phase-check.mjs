/**
 * Phase acceptance helper (docs/BUILD-PHASES.md "Abnahme pro Phase").
 * Run `npm run build` first. Starts `astro preview` as an IPv4 daemon, then
 * runs Lighthouse (accessibility, best practices and – for CLS – performance)
 * per page and viewport – desktop 1920 px and mobile 390 px via screen
 * emulation – and stores the full-page screenshot as
 * docs/screens/phase-<n>-<slug>-<viewport>.png next to the JSON report.
 * Lazy-loaded photos are missing from those screenshots; use page-shot.mjs
 * for visual checks. Needs Chrome or Edge (CHROME_PATH overrides the lookup).
 *
 *   npm run check:phase -- <phase> [slug ...]     e.g. 1 index impressum
 *   (slugs without leading slash – Git Bash rewrites "/x" into a Windows path)
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const [phase = '0', ...slugs] = process.argv.slice(2);
const pages = (slugs.length ? slugs : ['index']).map((s) => {
  const slug = s.replace(/^\/+|\/+$/g, '');
  return slug === '' || slug === 'index' ? { slug: 'index', path: '/' } : { slug: slug.replace(/\//g, '-'), path: `/${slug}/` };
});

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean);
const chrome = CHROME_CANDIDATES.find((c) => existsSync(c));
if (!chrome) {
  console.error('No Chrome/Edge found – set CHROME_PATH.');
  process.exit(1);
}
process.env.CHROME_PATH = chrome;

const SCREENS = path.join(process.cwd(), 'docs', 'screens');
mkdirSync(SCREENS, { recursive: true });

const MIN_SCORE = 95; // accessibility and best practices
const MAX_CLS = 0.05;

const VIEWPORTS = [
  {
    name: 'desktop',
    flags: ['--preset=desktop', '--screenEmulation.width=1920', '--screenEmulation.height=1080'],
  },
  {
    name: 'mobile',
    flags: [
      '--form-factor=mobile',
      '--screenEmulation.mobile=true',
      '--screenEmulation.width=390',
      '--screenEmulation.height=844',
      '--screenEmulation.deviceScaleFactor=2',
    ],
  },
];

// Astro 7's `astro preview` runs as a daemon: start it bound to IPv4 (the
// default listens on ::1 only and headless Chrome stalls on "localhost"),
// wait until it answers, stop it at the end. The preview() JS API ignores the
// host option, hence the CLI.
const HOST = '127.0.0.1';
const PORT = 4321;
const base = `http://${HOST}:${PORT}`;

function astroPreview(args) {
  return spawnSync(`npx astro preview ${args}`, {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
    encoding: 'utf8',
    timeout: 60_000,
  });
}

async function waitForServer(url, ms) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try {
      if ((await fetch(url)).ok) return true;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}

/** Runs Lighthouse; returns { score, bestPractices, cls, failing, screenshot } or { error }. */
function lighthouse(url, viewport, reportFile) {
  // The new headless mode ends in a chrome-error interstitial on this setup,
  // and Lighthouse may exit 1 while deleting its temp profile (EPERM) after
  // writing the report – so only the report file counts.
  const command = [
    'npx --yes lighthouse',
    `"${url}"`,
    '--only-categories=accessibility,best-practices,performance',
    '--chrome-flags="--headless --no-proxy-server"',
    '--throttling-method=provided',
    '--max-wait-for-load=20000',
    '--output=json',
    `--output-path="${reportFile}"`,
    '--quiet',
    ...viewport.flags,
  ].join(' ');
  spawnSync(command, { stdio: 'ignore', shell: true, timeout: 300_000 });
  if (!existsSync(reportFile)) return { error: 'no report written' };

  const report = JSON.parse(readFileSync(reportFile, 'utf8'));
  if (report.runtimeError) return { error: report.runtimeError.message };

  const score = Math.round(report.categories.accessibility.score * 100);
  const bestPractices = Math.round(report.categories['best-practices'].score * 100);
  const cls = report.audits['cumulative-layout-shift']?.numericValue ?? null;
  // Only list failing audits of the two scored categories (performance is
  // measured on an unthrottled local server and only contributes CLS).
  const scored = new Set(
    [...report.categories.accessibility.auditRefs, ...report.categories['best-practices'].auditRefs].map((r) => r.id),
  );
  const failing = Object.entries(report.audits)
    .filter(([id, a]) => scored.has(id) && a.score !== null && a.score < 1 && a.scoreDisplayMode === 'binary')
    .map(([, a]) => a)
    .map((a) => {
      const nodes = (a.details?.items ?? []).map((i) => i.node?.selector).filter(Boolean);
      return `${a.id}: ${a.title}${nodes.length ? ` [${nodes.join(', ')}]` : ''}`;
    });
  const screenshot =
    report.fullPageScreenshot?.screenshot ?? report.audits['full-page-screenshot']?.details?.screenshot ?? null;
  return { score, bestPractices, cls, failing, screenshot };
}

astroPreview('stop'); // clean up a daemon left over from a previous run
const started = astroPreview(`--host ${HOST} --port ${PORT}`);
if (started.status !== 0 || !(await waitForServer(base + '/', 20_000))) {
  console.error('Preview server did not start:', started.stdout, started.stderr);
  astroPreview('stop');
  process.exit(1);
}

let failed = false;
try {
  for (const page of pages) {
    for (const viewport of VIEWPORTS) {
      const stem = path.join(SCREENS, `phase-${phase}-${page.slug}-${viewport.name}`);
      const result = lighthouse(base + page.path, viewport, `${stem}-lighthouse.json`);
      const label = `${viewport.name.padEnd(7)} ${page.path.padEnd(14)}`;
      if (result.error) {
        console.log(`FAIL ${label} ${result.error}`);
        failed = true;
        continue;
      }
      let shot = 'no screenshot';
      if (result.screenshot?.data) {
        const png = `${stem}.png`;
        await sharp(Buffer.from(result.screenshot.data.split(',')[1], 'base64')).png().toFile(png);
        shot = `${path.relative(process.cwd(), png)} (${result.screenshot.width}×${result.screenshot.height})`;
      }
      const ok = result.score >= MIN_SCORE && result.bestPractices >= MIN_SCORE && (result.cls ?? 0) < MAX_CLS;
      failed ||= !ok;
      const cls = result.cls === null ? 'n/a' : result.cls.toFixed(3);
      console.log(
        `${ok ? 'OK  ' : 'WARN'} ${label} a11y ${String(result.score).padStart(3)}  bp ${String(result.bestPractices).padStart(3)}  cls ${cls}  ${shot}`,
      );
      for (const f of result.failing) console.log(`     - ${f}`);
    }
  }
} finally {
  astroPreview('stop');
}

process.exit(failed ? 1 : 0);
