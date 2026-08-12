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

if (!['eclipse', 'water', 'dns', 'binary'].includes(demo)) throw new Error(`Unknown demo: ${demo}`);
if (!existsSync(distDir)) throw new Error('dist/ not found. Run `npm run build` first.');
rmSync(outDir, { recursive: true, force: true });
mkdirSync(framesDir, { recursive: true });

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

  const sheet = await browser.newPage();
  const columns = width > height ? 2 : 3;
  const cardWidth = 420;
  const cardImageHeight = Math.round(cardWidth * (height / width));
  const rows = Math.ceil(frames.length / columns);
  await sheet.setViewport({ width: columns * (cardWidth + 24) + 56, height: Math.max(700, rows * (cardImageHeight + 86) + 120), deviceScaleFactor: 1 });

  const cards = frames.map(({ time, file }, index) => {
    const data = readFileSync(file).toString('base64');
    return `<article class="card"><img src="data:image/png;base64,${data}" alt="QA frame ${index + 1}"/><div><strong>${time.toFixed(2)}s</strong><span>frame ${index + 1}</span></div></article>`;
  }).join('');

  await sheet.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box}body{margin:0;background:#070a0f;color:#f4f7fb;font-family:Inter,ui-sans-serif,system-ui;padding:32px}
    header{display:flex;align-items:end;justify-content:space-between;margin-bottom:24px}h1{font-size:28px;margin:0}p{margin:6px 0 0;color:#98a2b3}
    .grid{display:grid;grid-template-columns:repeat(${columns},${cardWidth}px);gap:24px}.card{overflow:hidden;border:1px solid #242b36;border-radius:16px;background:#0e131b}
    .card img{display:block;width:100%;height:${cardImageHeight}px;object-fit:cover;background:#000}.card div{display:flex;justify-content:space-between;padding:14px 16px;color:#aab4c2}.card strong{color:#fff}
  </style></head><body><header><div><h1>Loop Animation · Visual QA · ${demo}</h1><p>${width}×${height} · ${meta.duration.toFixed(2)}s · ${frames.length} checkpoints</p></div><p>Inspect composition, clipping, labels, dead frames and continuity.</p></header><main class="grid">${cards}</main></body></html>`, { waitUntil: 'load' });

  const contactSheet = join(outDir, 'contact-sheet.png');
  await sheet.screenshot({ path: contactSheet, type: 'png', fullPage: true });
  writeFileSync(join(outDir, 'report.json'), `${JSON.stringify({ demo, width, height, duration: meta.duration, times }, null, 2)}\n`);
  console.log(`✓ Contact sheet: ${contactSheet}`);
  console.log(`✓ QA metadata: ${join(outDir, 'report.json')}`);
} finally {
  if (browser) await browser.close();
  await new Promise((done) => server.close(done));
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
