import fs from 'node:fs/promises';
import path from 'node:path';

const decoder = new TextDecoder('utf-8', { fatal: true });

const ROOT = process.cwd();
const INCLUDE_DIRS = ['src', 'public'];
const INCLUDE_FILES = [
  'index.html',
  'package.json',
  'vite.config.js',
  'eslint.config.js',
];
const TEXT_EXTS = new Set([
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.css',
  '.scss',
  '.html',
  '.json',
  '.md',
  '.txt',
  '.yml',
  '.yaml',
]);

const SKIP_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  '.venv',
  'backend/.venv',
  'backend/staticfiles',
  'backend/media',
]);

function hasUtf16Bom(buf) {
  if (buf.length < 2) return false;
  const b0 = buf[0];
  const b1 = buf[1];
  return (b0 === 0xff && b1 === 0xfe) || (b0 === 0xfe && b1 === 0xff);
}

function hasUtf8Bom(buf) {
  return buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf;
}

function shouldCheck(filePath) {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
  const base = path.basename(rel);
  if (INCLUDE_FILES.includes(base)) return true;
  return TEXT_EXTS.has(path.extname(base).toLowerCase());
}

async function walk(dir, out) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(rel) || SKIP_DIRS.has(entry.name)) continue;
      await walk(abs, out);
      continue;
    }
    if (!entry.isFile()) continue;
    if (!shouldCheck(abs)) continue;
    out.push(abs);
  }
}

async function collectTargets() {
  const targets = [];
  for (const dir of INCLUDE_DIRS) {
    const abs = path.join(ROOT, dir);
    try {
      const st = await fs.stat(abs);
      if (st.isDirectory()) await walk(abs, targets);
    } catch {
      // Ignore missing include dirs.
    }
  }
  for (const file of INCLUDE_FILES) {
    const abs = path.join(ROOT, file);
    try {
      const st = await fs.stat(abs);
      if (st.isFile()) targets.push(abs);
    } catch {
      // Ignore missing include files.
    }
  }
  return Array.from(new Set(targets)).sort();
}

async function main() {
  const targets = await collectTargets();
  const errors = [];

  for (const abs of targets) {
    const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
    const buf = await fs.readFile(abs);

    if (hasUtf16Bom(buf)) {
      errors.push(`${rel}: UTF-16 BOM detected (must be UTF-8).`);
      continue;
    }

    let text = '';
    try {
      text = decoder.decode(hasUtf8Bom(buf) ? buf.subarray(3) : buf);
    } catch {
      errors.push(`${rel}: invalid UTF-8 byte sequence.`);
      continue;
    }

    if (text.includes('\uFFFD')) {
      errors.push(`${rel}: contains replacement character (�), possible mojibake.`);
    }
  }

  if (errors.length > 0) {
    console.error('Encoding check failed:');
    for (const err of errors) console.error(`- ${err}`);
    console.error('\nFix tip: save files as UTF-8 and avoid PowerShell Set-Content without -Encoding utf8.');
    process.exit(1);
  }

  console.log(`Encoding check passed (${targets.length} files).`);
}

main().catch((err) => {
  console.error('Encoding check crashed:', err);
  process.exit(1);
});
