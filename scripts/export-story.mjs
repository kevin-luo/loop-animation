import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import process from 'node:process';
import puppeteer from 'puppeteer';

const args = parseArgs(process.argv.slice(2));
const demo = String(args.demo ?? 'water').toLowerCase();
const lang = String(args.lang ?? 'en').toLowerCase();
const distDir = resolve('dist');
const outDir = resolve(String(args.output ?? `.output/story/${demo}`));

if (!['water', 'eclipse'].includes(demo)) {
  throw new Error(`Story export is currently available for flagship StagePlayer demos only: water, eclipse. Received: ${demo}`);
}
if (!['zh', 'en'].includes(lang)) throw new Error(`Unsupported language: ${lang}`);
if (!existsSync(distDir)) throw new Error('dist/ not found. Run `npm run build` first.');
mkdirSync(outDir, { recursive: true });

const server = createStaticServer(distDir);
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const address = server.address();
if (!address || typeof address === 'string') throw new Error('Unable to start story export server.');
const url = `http://127.0.0.1:${address.port}/?demo=${encodeURIComponent(demo)}&lang=${encodeURIComponent(lang)}&export=1`;

let browser;
try {
  browser = await puppeteer.launch({
    headless: true,
    args: ['--disable-dev-shm-usage', '--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window.__LOOP_STORY__?.chapters?.length > 0, { timeout: 15000 });

  const story = await page.evaluate(() => window.__LOOP_STORY__);
  if (!story?.chapters?.length) throw new Error('No story manifest was published by the demo.');

  const prefix = `${demo}.${lang}`;
  const jsonPath = join(outDir, `${prefix}.narration.json`);
  const srtPath = join(outDir, `${prefix}.srt`);
  const vttPath = join(outDir, `${prefix}.vtt`);
  const markdownPath = join(outDir, `${prefix}.narration.md`);

  writeFileSync(jsonPath, `${JSON.stringify(story, null, 2)}\n`);
  writeFileSync(srtPath, toSrt(story));
  writeFileSync(vttPath, toVtt(story));
  writeFileSync(markdownPath, toMarkdown(story));

  console.log(`✓ Story manifest: ${jsonPath}`);
  console.log(`✓ SRT subtitles: ${srtPath}`);
  console.log(`✓ WebVTT captions: ${vttPath}`);
  console.log(`✓ Narration document: ${markdownPath}`);
} finally {
  if (browser) await browser.close();
  await new Promise((done) => server.close(done));
}

function toSrt(story) {
  return `${story.chapters.map((chapter, index) => [
    String(index + 1),
    `${formatTime(chapter.start, ',')} --> ${formatTime(chapter.end, ',')}`,
    cleanSubtitle(chapter.summary),
  ].join('\n')).join('\n\n')}\n`;
}

function toVtt(story) {
  const cues = story.chapters.map((chapter) => [
    `${formatTime(chapter.start, '.')} --> ${formatTime(chapter.end, '.')}`,
    cleanSubtitle(chapter.summary),
  ].join('\n')).join('\n\n');
  return `WEBVTT\n\n${cues}\n`;
}

function toMarkdown(story) {
  const chapters = story.chapters.map((chapter, index) => `## ${String(index + 1).padStart(2, '0')} · ${chapter.label}\n\n**${chapter.title}**\n\n${chapter.summary}\n\n### Details\n\n${chapter.details}\n\n### Key idea\n\n${chapter.key}\n\n_Time: ${chapter.start.toFixed(2)}s → ${chapter.end.toFixed(2)}s_`).join('\n\n---\n\n');
  return `# ${story.topic.title}\n\n${story.topic.lead}\n\n- Language: ${story.language}\n- Duration: ${story.duration.toFixed(2)}s\n- Chapters: ${story.chapters.length}\n\n---\n\n${chapters}\n`;
}

function cleanSubtitle(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function formatTime(seconds, separator) {
  const milliseconds = Math.max(0, Math.round(Number(seconds) * 1000));
  const hours = Math.floor(milliseconds / 3_600_000);
  const minutes = Math.floor((milliseconds % 3_600_000) / 60_000);
  const secs = Math.floor((milliseconds % 60_000) / 1000);
  const ms = milliseconds % 1000;
  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(secs, 2)}${separator}${pad(ms, 3)}`;
}

function pad(value, length) {
  return String(value).padStart(length, '0');
}

function parseArgs(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) result[key] = true;
    else { result[key] = next; i += 1; }
  }
  return result;
}

function createStaticServer(root) {
  const mime = {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml', '.webp': 'image/webp',
  };
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
