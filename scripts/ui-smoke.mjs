import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { extname, normalize, resolve } from 'node:path';
import puppeteer from 'puppeteer';

const distDir = resolve('dist');
if (!existsSync(distDir)) throw new Error('dist/ not found. Run `npm run build` first.');

const server = createStaticServer(distDir);
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const address = server.address();
if (!address || typeof address === 'string') throw new Error('Unable to start UI smoke server.');
const baseUrl = `http://127.0.0.1:${address.port}/`;

let browser;
try {
  browser = await puppeteer.launch({
    headless: true,
    args: ['--disable-dev-shm-usage', '--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });

  await page.goto(`${baseUrl}?lang=zh`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#builder-topic');

  await page.$eval('#builder-topic', (element) => {
    element.value = '为什么火山会喷发？';
    element.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.select('#builder-audience', 'student');
  await page.select('#builder-duration', '45');
  await page.select('#builder-aspect', '9:16');

  const prompt = await page.$eval('#builder-prompt', (element) => element.textContent ?? '');
  assertIncludes(prompt, '为什么火山会喷发？', 'Prompt Builder topic');
  assertIncludes(prompt, '学生 / 初学者', 'Prompt Builder audience');
  assertIncludes(prompt, '45 秒', 'Prompt Builder duration');
  assertIncludes(prompt, '9:16', 'Prompt Builder aspect ratio');
  assertIncludes(prompt, 'strict continuity QA', 'Prompt Builder QA instruction');

  const howToLink = await page.$eval('a[href="#howto"]', (element) => element.textContent?.trim() ?? '');
  if (!howToLink) throw new Error('Gallery usage navigation is missing.');

  const beginnerCopy = await page.$eval('#howto', (element) => element.textContent ?? '');
  if (/git clone|npm install/.test(beginnerCopy)) throw new Error('Beginner onboarding regressed to terminal-first instructions.');

  // Performance contract: the Gallery must not boot demo applications in iframes.
  const iframeCount = await page.$$eval('.demo-frame-wrap iframe', (frames) => frames.length);
  if (iframeCount !== 0) throw new Error(`Gallery booted ${iframeCount} embedded demo iframe(s); expected zero.`);

  await page.waitForFunction(() => {
    const image = document.querySelector('.demo-card--featured .demo-poster');
    return image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0;
  }, { timeout: 15000 });

  const previewSourceBeforeClick = await page.$eval('.demo-card--featured .demo-preview-video', (video) => video.getAttribute('src'));
  if (previewSourceBeforeClick) throw new Error('Gallery eagerly loaded the flagship MP4 preview.');

  await page.click('.demo-card--featured .preview-play');
  await page.waitForFunction(() => {
    const video = document.querySelector('.demo-card--featured .demo-preview-video');
    return video instanceof HTMLVideoElement && video.currentSrc.includes('water-v2-preview.mp4') && video.readyState >= 2;
  }, { timeout: 15000 });
  await page.click('.demo-card--featured .preview-play');

  await page.goto(`${baseUrl}?demo=water-v2&lang=zh`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__LOOP_ANIMATION__?.ready === true, { timeout: 15000 });
  await page.waitForSelector('#story-fullscreen');
  await page.waitForSelector('#story-usage-hint.is-visible');

  const totalTime = await page.$eval('#story-time', (element) => element.textContent ?? '');
  assertIncludes(totalTime, '/', 'Current / total time display');

  await page.click('#story-details-button');
  const detailsOpen = await page.$eval('#story-details', (element) => element.getAttribute('aria-hidden'));
  if (detailsOpen !== 'false') throw new Error('Deeper explanation panel did not open.');
  await page.keyboard.press('Escape');
  const detailsClosed = await page.$eval('#story-details', (element) => element.getAttribute('aria-hidden'));
  if (detailsClosed !== 'true') throw new Error('Escape did not close the deeper explanation panel.');

  await page.click('.story-chapter-button[data-chapter="2"]');
  const chapterTime = await page.evaluate(() => window.__LOOP_ANIMATION__?.currentTime ?? -1);
  if (Math.abs(chapterTime - 12) > 0.05) throw new Error(`Chapter navigation sought to ${chapterTime}, expected 12s.`);

  await page.click('#story-play');
  await new Promise((resolve) => setTimeout(resolve, 120));
  const playing = await page.evaluate(() => window.__LOOP_ANIMATION__?.isPlaying === true);
  if (!playing) throw new Error('Play control did not start playback.');
  await page.click('#story-play');

  console.log('✓ UI smoke: zero-command beginner onboarding');
  console.log('✓ UI smoke: Gallery has zero embedded WebGL apps');
  console.log('✓ UI smoke: lightweight poster + opt-in MP4 preview');
  console.log('✓ UI smoke: StagePlayer onboarding and details');
  console.log('✓ UI smoke: chapter navigation and playback');
} finally {
  if (browser) await browser.close();
  await new Promise((done) => server.close(done));
}

function assertIncludes(value, expected, label) {
  if (!value.includes(expected)) throw new Error(`${label} is missing expected text: ${expected}`);
}

function createStaticServer(root) {
  const mime = {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml', '.webp': 'image/webp', '.gif': 'image/gif', '.mp4': 'video/mp4',
  };
  return createServer((req, res) => {
    const rawPath = decodeURIComponent((req.url ?? '/').split('?')[0]);
    const requested = rawPath === '/' ? '/index.html' : rawPath;
    const safe = normalize(requested).replace(/^([.][.][/\\])+/, '');
    const file = resolve(root, `.${safe.startsWith('/') ? safe : `/${safe}`}`);
    if (!file.startsWith(root) || !existsSync(file)) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': mime[extname(file)] ?? 'application/octet-stream' });
    res.end(readFileSync(file));
  });
}
