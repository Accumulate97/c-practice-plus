// Local helper: compile a C file with the project's mingw gcc and run it with a
// given stdin, printing the exact stdout. Used to verify cxa answer values by hand
// before writing them into a bank entry (the generator re-runs to get `expected`,
// but cxa/asks answers are hand-authored and not machine-checked).
//
// Usage:
//   node scripts/run-c.mjs <c-file> <stdin-string>   (stdin may be empty)
//   node scripts/run-c.mjs <c-file> -- 1 2 3         (space-separated args -> one line)
// Reads the C file, compiles to tmp/kcode/run-c.exe (zero-warning enforced),
// pipes stdin, prints stdout.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const GCC = 'D:/mingw/mingw64/bin/gcc.exe';
const TMP = join(ROOT, 'tmp', 'kcode');
const SRC = process.argv[2];
if (!SRC) { console.error('usage: node scripts/run-c.mjs <c-file> <stdin>'); process.exit(2); }

// Collapse remaining args into one stdin line if a `--` separator is given.
let stdin = '';
if (process.argv[3] === '--') {
  stdin = process.argv.slice(4).join(' ') + '\n';
} else {
  stdin = process.argv[3] ?? '';
}

mkdirSync(TMP, { recursive: true });
const base = join(TMP, 'run-c');
const src = base + '.c';
const exe = base + '.exe';
writeFileSync(src, readFileSync(SRC, 'utf8'));

const c = spawnSync(GCC, ['-std=c99', '-Wall', '-Wextra', '-o', exe, src], { encoding: 'utf8', timeout: 60000 });
if (c.status !== 0 || c.stdout || c.stderr) {
  console.error('COMPILE FAILED:\n' + c.stdout + c.stderr);
  process.exit(1);
}
const r = spawnSync(exe, { input: stdin, encoding: 'utf8', timeout: 20000 });
if (r.error) { console.error('RUN ERROR: ' + r.error.message); process.exit(1); }
if (r.status !== 0) { console.error('EXIT CODE ' + r.status); }
process.stdout.write(r.stdout);
