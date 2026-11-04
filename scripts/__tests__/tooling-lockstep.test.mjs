import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { compareReleaseVersions } from '../publish.mjs';

// The libs, @cngx/mcp and @cngx/cli release at one version through publish:*,
// so the root, packages/mcp and packages/cli manifests agree on main.

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const versionOf = (...path) => JSON.parse(readFileSync(join(ROOT, ...path, 'package.json'), 'utf8')).version;

// Exact triples allowed to differ, each with a written reason. The release
// that aligns the group makes its row unreachable; the next PR drops it.
const LOCKSTEP_EXEMPT = [
  {
    root: '0.1.0-rc.9',
    mcp: '0.2.0',
    cli: '0.1.0',
    closesWith: '0.3.0',
    reason: 'pre-alignment, closes with the first joint release 0.3.0',
  },
];

/** Whether the three versions are equal or match one exemption row exactly. */
function lockstepHolds(versions, exempt) {
  const aligned = versions.mcp === versions.root && versions.cli === versions.root;
  const excused = exempt.some(
    (row) => row.root === versions.root && row.mcp === versions.mcp && row.cli === versions.cli,
  );
  return aligned || excused;
}

describe('tooling lockstep', () => {
  const versions = { root: versionOf(), mcp: versionOf('packages', 'mcp'), cli: versionOf('packages', 'cli') };

  it('keeps the root, @cngx/mcp and @cngx/cli at one version', () => {
    expect(lockstepHolds(versions, LOCKSTEP_EXEMPT), JSON.stringify(versions)).toBe(true);
  });

  it('drops an exemption once the root has passed the release that closes it', () => {
    for (const row of LOCKSTEP_EXEMPT) {
      expect(
        compareReleaseVersions(versions.root, row.closesWith),
        `root ${versions.root} is past ${row.closesWith}; remove the row "${row.reason}"`,
      ).toBeLessThanOrEqual(0);
    }
  });

  it('gives every exemption a reason', () => {
    for (const row of LOCKSTEP_EXEMPT) {
      expect(row.reason.length).toBeGreaterThan(0);
    }
  });
});

describe('lockstepHolds', () => {
  const row = LOCKSTEP_EXEMPT[0];

  it('accepts three equal versions, with the exemption inert', () => {
    expect(lockstepHolds({ root: '0.3.0', mcp: '0.3.0', cli: '0.3.0' }, LOCKSTEP_EXEMPT)).toBe(true);
  });

  it('accepts only the exact exempt triple', () => {
    expect(lockstepHolds({ root: row.root, mcp: row.mcp, cli: row.cli }, LOCKSTEP_EXEMPT)).toBe(true);
    expect(lockstepHolds({ root: row.root, mcp: row.mcp, cli: '0.1.1' }, LOCKSTEP_EXEMPT)).toBe(false);
    expect(lockstepHolds({ root: '0.1.0-rc.10', mcp: row.mcp, cli: row.cli }, LOCKSTEP_EXEMPT)).toBe(false);
  });

  it('refuses one member behind the others', () => {
    expect(lockstepHolds({ root: '0.3.1', mcp: '0.3.1', cli: '0.3.0' }, LOCKSTEP_EXEMPT)).toBe(false);
    expect(lockstepHolds({ root: '0.3.1', mcp: '0.3.0', cli: '0.3.1' }, [])).toBe(false);
  });
});
