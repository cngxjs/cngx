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
    installPipeGuard(process.stdout);
    installPipeGuard(process.stderr);
    const { main } = await import('./cli-adapter.js');
    process.exitCode = await main(
      process.argv.slice(2),
      { dataDir: new URL('../data/', import.meta.url), packageJson: new URL('../package.json', import.meta.url) },
      { stdout: (text) => process.stdout.write(text), stderr: (text) => process.stderr.write(text) },
    );
  } catch (error) {
    // A module that fails to load never reaches the adapter's own net; same line, same exit 3.
    process.stderr.write(`cngx: internal error: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 3;
  }
} else {
  process.stderr.write(`${floorError}\n`);
  process.exitCode = 2;
}
