import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

// Expand test paths ourselves so the same command works on Windows and Unix.
const directories = ['src/components', 'src/game', 'src/server'];
const tests = directories.flatMap((dir) =>
  readdirSync(dir)
    .filter((name) => /\.test\.tsx?$/.test(name))
    .sort()
    .map((name) => join(dir, name))
);
if (tests.length === 0) {
  console.error('No test files found.');
  process.exit(1);
}
const result = spawnSync(process.execPath, ['--import', 'tsx', '--test', ...tests], { stdio: 'inherit' });
if (result.error) console.error(result.error);
process.exit(result.status ?? 1);
