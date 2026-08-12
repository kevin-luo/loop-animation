import { copyFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const files = [
  'water-v2-poster.webp',
  'eclipse-poster.webp',
  'dns-poster.webp',
  'binary-poster.webp',
  'water-v2-preview.mp4',
  'eclipse-preview.mp4',
];

let totalBytes = 0;
for (const name of files) {
  const source = resolve('docs/media', name);
  const target = resolve('dist/docs/media', name);
  if (!existsSync(source)) throw new Error(`Missing gallery media: ${source}`);
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(source, target);
  totalBytes += statSync(source).size;
}

console.log(`✓ Gallery media copied to dist/docs/media (${files.length} files, ${(totalBytes / 1024).toFixed(1)} KiB)`);
