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

  const heroPrompt = await page.$eval('#hero-prompt', (element) => element.textContent ?? '');
  assertIncludes(heroPrompt, 'https://github.com/kevin-luo/loop-animation', 'Beginner bootstrap repository');
  assertIncludes(heroPrompt, '不要让我自己执行 git、npm', 'Beginner no-terminal instruction');

  const howToText = await page.$eval('#howto', (element) => element.textContent ?? '');
  assertIncludes(howToText, '复制、粘贴、看结果', 'Beginner three-step onboarding');
  if (howToText.includes('git clone') || howToText.includes('npm install')) {
    throw new Error('Beginner onboarding leaked developer terminal commands.');
  }

  const mainCopyButton = await page.$('#hero-copy-main');
  if (!mainCopyButton) throw new Error('Primary beginner copy button is missing.');

  const codexHref = await page.$eval('a[href^="https://chatgpt.com/codex"]', (element) => element.getAttribute('href') ?? '');
  if (!codexHref) throw new Error('Open Codex action is missing.');

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
  assertIncludes(prompt, 'https://github.com/kevin-luo/loop-animation', 'Prompt Builder bootstrap repository');
  assertIncludes(prompt, '不要让我自己执行 git、npm', 'Prompt Builder no-terminal instruction');

  const howToLink = await page.$eval('a[href="#howto"]', (element) => element.textContent?.trim() ?? '');
  if (!howToLink) throw new Error('Gallery usage navigation is missing.');

  await page.waitForSelector('.demo-card--featured .demo-frame-wrap.is-loaded', { timeout: 15000 });

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

  console.log('✓ UI smoke: copy-paste beginner onboarding');
  console.log('✓ UI smoke: self-bootstrapping Prompt Builder');
  console.log('✓ UI smoke: real iframe readiness state');
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
    '.svg': 'image/svg+xml', '.webp': 'image/webp', '.gif': 'image/gif',
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
