#!/usr/bin/env node
// @cngx/cli entry. Holds no logic and is imported by nothing: it checks the
// Node floor with the one static import, then loads the pipe guard and the
// adapter dynamically, so an older Node never evaluates code that needs a newer
// one. `src/index.ts` and `dist/index.js` both sit one level below the package
// root, which is what the two URLs below rely on.

import { checkNodeFloor } from './node-floor.js';

const floorError = checkNodeFloor(process.versions.node);
if (floorError === null) {
  // Until the pipe guard loads, a write must not throw out of the catch below.
  let stderr = (text: string): void => {
    try {
      process.stderr.write(text);
    } catch {
      // nothing left to report to
    }
  };
  try {
    const { installPipeGuard, installStderrGuard, writeQuietly } = await import('./pipe-guard.js');
    stderr = writeQuietly((text) => process.stderr.write(text));
    let stdoutFailed = false;
    installPipeGuard(process.stdout, {
      stderr,
      setExitCode: (code: number) => {
        stdoutFailed = true;
        process.exitCode = code;
      },
    });
    installStderrGuard(process.stderr);
    const { main } = await import('./cli-adapter.js');
    const code = await main(
      process.argv.slice(2),
      { dataDir: new URL('../data/', import.meta.url), packageJson: new URL('../package.json', import.meta.url) },
      { stdout: (text) => process.stdout.write(text), stderr },
    );
    // A failed stdout keeps its exit 3 over the answer's own code; a failed stderr never does.
    if (!stdoutFailed) {
      process.exitCode = code;
    }
  } catch (error) {
    // A module that fails to load never reaches the adapter's own net; same line, same exit 3.
    // The adapter never parsed argv, so --format json is read raw here.
    const message = error instanceof Error ? error.message : String(error);
    stderr(`cngx: internal error: ${message}\n`);
    if (rawFormat(process.argv.slice(2)) === 'json') {
      try {
        process.stdout.write(await bootstrapFailureDocument(message));
      } catch {
        // stdout is gone too; the exit code still says what happened
      }
    }
    process.exitCode = 3;
  }
} else {
  process.stderr.write(`${floorError}\n`);
  process.exitCode = 2;
}

/** The last `--format` value before `--`, read the way the adapter's parser reads it. */
function rawFormat(argv: string[]): string | undefined {
  let format: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--') {
      break;
    }
    if (arg.startsWith('--format=')) {
      format = arg.slice('--format='.length);
    } else if (arg === '--format') {
      format = argv[++i];
    }
  }
  return format;
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
