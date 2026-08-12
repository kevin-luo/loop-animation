import { createServer } from 'node:http';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import process from 'node:process';
import puppeteer from 'puppeteer';

const args = parseArgs(process.argv.slice(2));
const format = String(args.format ?? 'mp4').toLowerCase();
const demo = String(args.demo ?? 'eclipse').toLowerCase();
const width = Number(args.width ?? 1080);
const height = Number(args.height ?? 1920);
const fps = Number(args.fps ?? 30);
const outDir = resolve(String(args.output ?? '.output'));
const distDir = resolve('dist');
const framesDir = join(outDir, 'frames');

if (!['mp4', 'gif', 'png'].includes(format)) throw new Error(`Unsupported format: ${format}`);
if (!['eclipse', 'dns', 'binary'].includes(demo)) throw new Error(`Unknown demo: ${demo}`);
if (!existsSync(distDir)) throw new Error('dist/ not found. Run `npm run build` first.');
mkdirSync(outDir, { recursive: true });
rmSync(framesDir, { recursive: true, force: true });
mkdirSync(framesDir, { recursive: true });

const server = createStaticServer(distDir);
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const address = server.address();
if (!address || typeof address === 'string') throw new Error('Unable to start export server.');
const url = `http://127.0.0.1:${address.port}/?demo=${encodeURIComponent(demo)}&export=1`;

let browser;
try {
  browser = await puppeteer.launch({ headless: true, args: ['--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window.__LOOP_ANIMATION__?.ready === true, { timeout: 15000 });
  await page.evaluate(() => {
    document.documentElement.dataset.export = '1';
    window.__LOOP_ANIMATION__?.pause();
  });

  const duration = await page.evaluate(() => window.__LOOP_ANIMATION__?.duration ?? 0);
  if (!Number.isFinite(duration) || duration <= 0) throw new Error('Animation duration is invalid.');

  if (format === 'png') {
    const posterTime = Math.min(duration, Math.max(0, Number(args.time ?? duration * 0.55)));
    await renderAt(page, posterTime);
    const output = join(outDir, `${demo}-poster.png`);
    await page.screenshot({ path: output, type: 'png' });
    console.log(`✓ PNG (${demo}): ${output}`);
  } else {
    const frameCount = Math.ceil(duration * fps);
    const digits = Math.max(5, String(frameCount - 1).length);
    for (let frame = 0; frame < frameCount; frame++) {
      const time = Math.min(duration, frame / fps);
      await renderAt(page, time);
      const name = `frame-${String(frame).padStart(digits, '0')}.png`;
      await page.screenshot({ path: join(framesDir, name), type: 'png' });
      if (frame % Math.max(1, Math.round(fps)) === 0 || frame === frameCount - 1) {
        process.stdout.write(`\rRendering ${demo}: ${frame + 1}/${frameCount} frames`);
      }
    }
    process.stdout.write('\n');

    if (format === 'mp4') {
      const output = join(outDir, `${demo}.mp4`);
      runFfmpeg(['-y', '-framerate', String(fps), '-i', join(framesDir, `frame-%0${digits}d.png`), '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', output]);
      console.log(`✓ MP4 (${demo}): ${output}`);
    } else {
      const output = join(outDir, `${demo}.gif`);
      runFfmpeg(['-y', '-framerate', String(fps), '-i', join(framesDir, `frame-%0${digits}d.png`), '-vf', `fps=${Math.min(15, fps)},scale='min(900,iw)':-2:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=sierra2_4a`, '-loop', '0', output]);
      console.log(`✓ GIF (${demo}): ${output}`);
    }
  }
} finally {
  if (browser) await browser.close();
  await new Promise((done) => server.close(done));
  if (args['keep-frames'] !== true) rmSync(framesDir, { recursive: true, force: true });
}

async function renderAt(page, time) {
  await page.evaluate((t) => window.__LOOP_ANIMATION__?.renderAt(t), time);
  await page.evaluate(() => new Promise((resolveFrame) => requestAnimationFrame(() => resolveFrame())));
}

function runFfmpeg(ffmpegArgs) {
  try {
    execFileSync('ffmpeg', ffmpegArgs, { stdio: 'inherit' });
  } catch (error) {
    if (error?.code === 'ENOENT') throw new Error('FFmpeg was not found in PATH.');
    throw error;
  }
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
