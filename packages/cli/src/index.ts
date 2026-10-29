#!/usr/bin/env node
// @cngx/cli entry. Holds no logic and is imported by nothing: it checks the
// Node floor with the one static import, then loads the pipe guard and the
// adapter dynamically, so an older Node never evaluates code that needs a newer
// one. `src/index.ts` and `dist/index.js` both sit one level below the package
// root, which is what the two URLs below rely on.

import { checkNodeFloor } from './node-floor.js';

const floorError = checkNodeFloor(process.versions.node);
if (floorError === null) {
  try {
    const { installPipeGuard } = await import('./pipe-guard.js');
    let streamFailed = false;
    const guardDeps = {
      stderr: (text: string) => process.stderr.write(text),
      setExitCode: (code: number) => {
        streamFailed = true;
        process.exitCode = code;
      },
    };
    installPipeGuard(process.stdout, guardDeps);
    installPipeGuard(process.stderr, guardDeps);
    const { main } = await import('./cli-adapter.js');
    const code = await main(
      process.argv.slice(2),
      { dataDir: new URL('../data/', import.meta.url), packageJson: new URL('../package.json', import.meta.url) },
      { stdout: (text) => process.stdout.write(text), stderr: (text) => process.stderr.write(text) },
    );
    // A stream that already failed keeps its exit 3 over the answer's own code.
    if (!streamFailed) {
      process.exitCode = code;
    }
  } catch (error) {
    // A module that fails to load never reaches the adapter's own net; same line, same exit 3.
    // The adapter never parsed argv, so --format json is read raw here.
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`cngx: internal error: ${message}\n`);
    const argv = process.argv.slice(2);
    const json = argv.includes('--format=json') || argv.some((arg, i) => arg === '--format' && argv[i + 1] === 'json');
    if (json) {
      process.stdout.write(await bootstrapFailureDocument(message));
    }
    process.exitCode = 3;
  }
} else {
  process.stderr.write(`${floorError}\n`);
  process.exitCode = 2;
}

/** The adapter's failure document when the adapter loads, else the same literal. */
async function bootstrapFailureDocument(message: string): Promise<string> {
  try {
    const { failureDocument } = await import('./cli-adapter.js');
    return failureDocument('internal', message);
  } catch {
    return `${JSON.stringify({ cngxVersion: null, result: null, error: { reason: 'internal', message } }, null, 2)}\n`;
  }
}
