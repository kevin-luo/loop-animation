import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';

const force = process.argv.includes('--force');
const source = resolve('.agents/skills/loop-animation');
const target = join(homedir(), '.agents', 'skills', 'loop-animation');

if (!existsSync(join(source, 'SKILL.md'))) {
  throw new Error(`Skill source not found: ${source}`);
}

if (existsSync(target)) {
  if (!force) {
    console.error(`Loop Animation is already installed at:\n${target}`);
    console.error('Run `npm run skill:install:force` to replace it.');
    process.exit(1);
  }
  rmSync(target, { recursive: true, force: true });
}

mkdirSync(dirname(target), { recursive: true });
cpSync(source, target, { recursive: true });

console.log('✓ Loop Animation skill installed');
console.log(`  ${target}`);
console.log('');
console.log('Open Codex and invoke it with:');
console.log('  $loop-animation');
console.log('');
console.log('Codex detects skill changes automatically. If it does not appear, restart Codex.');
