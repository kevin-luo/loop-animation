import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import process from 'node:process';
import puppeteer from 'puppeteer';

const args = parseArgs(process.argv.slice(2));
const demo = String(args.demo ?? 'eclipse').toLowerCase();
const width = Number(args.width ?? 1080);
const height = Number(args.height ?? 1920);
const outDir = resolve(String(args.output ?? `.output/qa/${demo}`));
const distDir = resolve('dist');
const framesDir = join(outDir, 'frames');
const boundaryDir = join(outDir, 'boundaries');

if (!['eclipse', 'water', 'dns', 'binary'].includes(demo)) throw new Error(`Unknown demo: ${demo}`);
if (!existsSync(distDir)) throw new Error('dist/ not found. Run `npm run build` first.');
rmSync(outDir, { recursive: true, force: true });
mkdirSync(framesDir, { recursive: true });
mkdirSync(boundaryDir, { recursive: true });

const server = createStaticServer(distDir);
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const address = server.address();
if (!address || typeof address === 'string') throw new Error('Unable to start QA server.');
const url = `http://127.0.0.1:${address.port}/?demo=${encodeURIComponent(demo)}&export=1`;

let browser;
try {
  browser = await puppeteer.launch({
    headless: true,
    args: ['--disable-dev-shm-usage', '--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window.__LOOP_ANIMATION__?.ready === true, { timeout: 15000 });
  await page.evaluate(() => {
    document.documentElement.dataset.export = '1';
    window.__LOOP_ANIMATION__?.pause();
  });

  const meta = await page.evaluate(() => ({
    duration: window.__LOOP_ANIMATION__?.duration ?? 0,
    qaTimes: window.__LOOP_ANIMATION__?.qaTimes ?? [],
    boundaryTimes: window.__LOOP_ANIMATION__?.boundaryTimes ?? [],
    steps: window.__LOOP_ANIMATION__?.steps ?? [],
  }));

  if (!Number.isFinite(meta.duration) || meta.duration <= 0) throw new Error('Animation duration is invalid.');
  const times = parseTimes(args.times, meta.qaTimes, meta.duration);
  const frames = [];

  for (let index = 0; index < times.length; index++) {
    const time = times[index];
    await renderAt(page, time);
    const file = join(framesDir, `qa-${String(index + 1).padStart(2, '0')}-${time.toFixed(3)}s.png`);
    await page.screenshot({ path: file, type: 'png' });
    frames.push({ time, file });
    process.stdout.write(`\rCapturing ${demo} QA frame ${index + 1}/${times.length}`);
  }
  process.stdout.write('\n');

  const contactSheet = join(outDir, 'contact-sheet.png');
  await createContactSheet(browser, {
    title: `Loop Animation · Visual QA · ${demo}`,
    subtitle: `${width}×${height} · ${meta.duration.toFixed(2)}s · ${frames.length} checkpoints`,
    hint: 'Inspect composition, clipping, labels, dead frames and visual hierarchy.',
    frames: frames.map(({ time, file }, index) => ({ file, label: `${time.toFixed(2)}s`, meta: `frame ${index + 1}` })),
    width,
    height,
    output: contactSheet,
  });

  const boundaries = await runBoundaryQa(page, meta.boundaryTimes, meta.duration, boundaryDir, args);
  const boundarySheet = join(outDir, 'boundary-continuity.png');
  if (boundaries.length > 0) {
    await createBoundarySheet(browser, boundaries, boundarySheet);
  }

  const report = {
    demo,
    width,
    height,
    duration: meta.duration,
    times,
    boundaries: boundaries.map(({ images, ...result }) => result),
  };
  writeFileSync(join(outDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);

  const warnings = boundaries.filter((boundary) => boundary.warning);
  console.log(`✓ Contact sheet: ${contactSheet}`);
  if (boundaries.length > 0) console.log(`✓ Boundary continuity sheet: ${boundarySheet}`);
  console.log(`✓ QA metadata: ${join(outDir, 'report.json')}`);
  console.log(warnings.length === 0
    ? `✓ Continuity: no suspicious chapter jumps detected across ${boundaries.length} boundaries`
    : `⚠ Continuity: ${warnings.length}/${boundaries.length} boundaries need review`);

  if (warnings.length > 0 && args['fail-on-continuity']) process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  await new Promise((done) => server.close(done));
}

async function runBoundaryQa(page, boundaryTimes, duration, outputDir, args) {
  const boundaries = Array.isArray(boundaryTimes) ? boundaryTimes.filter(Number.isFinite) : [];
  if (boundaries.length === 0) return [];

  const epsilon = Math.max(1 / 120, Number(args.epsilon ?? 1 / 30));
  const diffThreshold = Math.max(0, Number(args['diff-threshold'] ?? 0.018));
  const ratioThreshold = Math.max(1, Number(args['ratio-threshold'] ?? 3.25));
  const canvas = await page.$('canvas');
  if (!canvas) throw new Error('Boundary QA could not find a canvas element.');

  const results = [];
  for (let index = 0; index < boundaries.length; index++) {
    const boundary = boundaries[index];
    const sampleTimes = [
      Math.max(0, boundary - epsilon),
      boundary,
      Math.min(duration, boundary + epsilon),
    ];
    const images = [];

    for (let sampleIndex = 0; sampleIndex < sampleTimes.length; sampleIndex++) {
      const time = sampleTimes[sampleIndex];
      await renderAt(page, time);
      const screenshot = await canvas.screenshot({ type: 'png' });
      const file = join(outputDir, `boundary-${String(index + 1).padStart(2, '0')}-${['before', 'at', 'after'][sampleIndex]}.png`);
      writeFileSync(file, screenshot);
      images.push({ time, file, base64: Buffer.from(screenshot).toString('base64') });
    }

    const beforeDiff = await imageDifference(page, images[0].base64, images[1].base64);
    const afterDiff = await imageDifference(page, images[1].base64, images[2].base64);
    const maximum = Math.max(beforeDiff, afterDiff);
    const minimum = Math.min(beforeDiff, afterDiff);
    const ratio = maximum / Math.max(0.000001, minimum);
    const warning = maximum >= diffThreshold && ratio >= ratioThreshold;

    results.push({
      boundary,
      epsilon,
      beforeDiff: round(beforeDiff),
      afterDiff: round(afterDiff),
      ratio: round(ratio),
      warning,
      images,
    });
    process.stdout.write(`\rChecking ${demo} boundary ${index + 1}/${boundaries.length}`);
  }
  process.stdout.write('\n');
  return results;
}

async function imageDifference(page, firstBase64, secondBase64) {
  return page.evaluate(async ({ firstBase64, secondBase64 }) => {
    const load = async (base64) => {
      const image = new Image();
      image.src = `data:image/png;base64,${base64}`;
      await image.decode();
      return image;
    };

    const [first, second] = await Promise.all([load(firstBase64), load(secondBase64)]);
    const width = Math.min(first.naturalWidth, second.naturalWidth);
    const height = Math.min(first.naturalHeight, second.naturalHeight);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return 0;

    context.drawImage(first, 0, 0, width, height);
    const a = context.getImageData(0, 0, width, height).data;
    context.clearRect(0, 0, width, height);
    context.drawImage(second, 0, 0, width, height);
    const b = context.getImageData(0, 0, width, height).data;

    let total = 0;
    let samples = 0;
    const stride = 4 * 4;
    for (let offset = 0; offset < a.length; offset += stride) {
      total += Math.abs(a[offset] - b[offset]);
      total += Math.abs(a[offset + 1] - b[offset + 1]);
      total += Math.abs(a[offset + 2] - b[offset + 2]);
      samples += 3;
    }
    return samples === 0 ? 0 : total / (samples * 255);
  }, { firstBase64, secondBase64 });
}

async function createContactSheet(browser, options) {
  const columns = options.width > options.height ? 2 : 3;
  const cardWidth = 420;
  const cardImageHeight = Math.round(cardWidth * (options.height / options.width));
  const rows = Math.ceil(options.frames.length / columns);
  const sheet = await browser.newPage();
  await sheet.setViewport({
    width: columns * (cardWidth + 24) + 56,
    height: Math.max(700, rows * (cardImageHeight + 86) + 120),
    deviceScaleFactor: 1,
  });

  const cards = options.frames.map(({ file, label, meta }, index) => {
    const data = readFileSync(file).toString('base64');
    return `<article class="card"><img src="data:image/png;base64,${data}" alt="QA frame ${index + 1}"/><div><strong>${label}</strong><span>${meta}</span></div></article>`;
  }).join('');

  await sheet.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box}body{margin:0;background:#070a0f;color:#f4f7fb;font-family:Inter,ui-sans-serif,system-ui;padding:32px}
    header{display:flex;align-items:end;justify-content:space-between;gap:24px;margin-bottom:24px}h1{font-size:28px;margin:0}p{margin:6px 0 0;color:#98a2b3}
    .grid{display:grid;grid-template-columns:repeat(${columns},${cardWidth}px);gap:24px}.card{overflow:hidden;border:1px solid #242b36;border-radius:16px;background:#0e131b}
    .card img{display:block;width:100%;height:${cardImageHeight}px;object-fit:cover;background:#000}.card div{display:flex;justify-content:space-between;padding:14px 16px;color:#aab4c2}.card strong{color:#fff}
  </style></head><body><header><div><h1>${options.title}</h1><p>${options.subtitle}</p></div><p>${options.hint}</p></header><main class="grid">${cards}</main></body></html>`, { waitUntil: 'load' });
  await sheet.screenshot({ path: options.output, type: 'png', fullPage: true });
  await sheet.close();
}

async function createBoundarySheet(browser, boundaries, output) {
  const sheet = await browser.newPage();
  await sheet.setViewport({ width: 1280, height: Math.max(760, boundaries.length * 320 + 150), deviceScaleFactor: 1 });
  const rows = boundaries.map((boundary, index) => {
    const images = boundary.images.map((image, imageIndex) => {
      const data = readFileSync(image.file).toString('base64');
      return `<figure><img src="data:image/png;base64,${data}"/><figcaption>${['t − 1 frame', 'boundary', 't + 1 frame'][imageIndex]} · ${image.time.toFixed(3)}s</figcaption></figure>`;
    }).join('');
    return `<section class="row ${boundary.warning ? 'warning' : ''}"><header><strong>Boundary ${index + 1} · ${boundary.boundary.toFixed(3)}s</strong><span>Δ before ${boundary.beforeDiff.toFixed(4)} · Δ after ${boundary.afterDiff.toFixed(4)} · ratio ${boundary.ratio.toFixed(2)}${boundary.warning ? ' · REVIEW' : ''}</span></header><div>${images}</div></section>`;
  }).join('');

  await sheet.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box}body{margin:0;padding:32px;background:#070a0f;color:#f4f7fb;font-family:Inter,ui-sans-serif,system-ui}h1{margin:0 0 6px;font-size:28px}p{margin:0 0 28px;color:#98a2b3}.row{margin-bottom:24px;padding:18px;border:1px solid #242b36;background:#0d1219}.row.warning{border-color:#8b5c42;background:#18110e}.row>header{display:flex;justify-content:space-between;gap:20px;margin-bottom:14px;font-size:12px;color:#9da9b9}.row>header strong{color:#fff;font-size:14px}.row>div{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}figure{margin:0;background:#05070a}img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover}figcaption{padding:8px 10px;color:#9ba8b8;font-size:10px}
  </style></head><body><h1>Boundary continuity QA</h1><p>Each row compares one frame before, exactly at, and one frame after a chapter boundary. Large asymmetric pixel change indicates a likely visual jump.</p>${rows}</body></html>`, { waitUntil: 'load' });
  await sheet.screenshot({ path: output, type: 'png', fullPage: true });
  await sheet.close();
}

async function renderAt(page, time) {
  await page.evaluate((t) => window.__LOOP_ANIMATION__?.renderAt(t), time);
  await page.evaluate(() => new Promise((resolveFrame) => requestAnimationFrame(() => resolveFrame())));
}

function parseTimes(value, controllerTimes, duration) {
  const explicit = typeof value === 'string' ? value.split(',').map(Number).filter(Number.isFinite) : [];
  const defaults = [0, duration * 0.25, duration * 0.5, duration * 0.75, Math.max(0, duration - 0.001)];
  const source = explicit.length ? explicit : (controllerTimes?.length ? controllerTimes : defaults);
  return [...new Set(source.map((time) => Number(Math.min(duration, Math.max(0, time)).toFixed(3))))].sort((a, b) => a - b);
}

function parseArgs(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) result[key] = true;
    else { result[key] = next; i++; }
  }
  return result;
}

function round(value) {
  return Number(value.toFixed(6));
}

function createStaticServer(root) {
  const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
  return createServer((req, res) => {
    const rawPath = decodeURIComponent((req.url ?? '/').split('?')[0]);
    const requested = rawPath === '/' ? '/index.html' : rawPath;
    const safe = normalize(requested).replace(/^([.][.][/\\])+/, '');
    const file = resolve(root, `.${safe.startsWith('/') ? safe : `/${safe}`}`);
    if (!file.startsWith(root) || !existsSync(file)) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': mime[extname(file)] ?? 'application/octet-stream' });
    res.end(readFileSync(file));
  });
}
