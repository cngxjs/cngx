import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

// The Angular 22 unit-test builder loads zone.js and zone.js/testing for a
// library test target (no `polyfills`) whenever the package resolves, while
// TestBed runs zoneless; every spec then logs NG0914 and timer-heavy specs
// fail. The libs, the examples app and the specs are zoneless, so the
// workspace keeps zone.js out of its tree on every Angular major.
describe('zone.js stays out of the workspace', () => {
  it('is not a root dependency', () => {
    const manifest = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
    expect(manifest.dependencies?.['zone.js']).toBeUndefined();
    expect(manifest.devDependencies?.['zone.js']).toBeUndefined();
  });

  it('does not resolve from the workspace root', () => {
    const requireFromRoot = createRequire(join(ROOT, 'package.json'));
    let resolved;
    try {
      resolved = requireFromRoot.resolve('zone.js');
    } catch {
      resolved = undefined;
    }
    expect(
      resolved,
      `zone.js resolves at ${resolved}; run "npm ls zone.js --all" to find the package that brought it back. ` +
        'The Angular 22 unit-test builder would load it for every library test target.',
    ).toBeUndefined();
  });
});
