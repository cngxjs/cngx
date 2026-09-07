/**
 * Guards the @cngx/themes aggregate wiring:
 *
 * 1. Every relative @import in cngx.css resolves to a file on disk -
 *    a per-file theming CSS is dead until imported here, and a typo'd
 *    path only surfaces in a consumer bundler.
 * 2. The four per-lib theming/system-tokens.css placeholders are
 *    imported eagerly, so a future @property added there cannot go
 *    dead-until-imported silently.
 * 3. Every ../<lib>/ import has a matching @cngx/<lib> peerDependency
 *    (the published file resolves the relative path onto the sibling
 *    peer package).
 * 4. The header does not advertise the non-existent material/theme.css
 *    (the exports map only resolves .scss under ./material/).
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const THEMES = join(ROOT, 'projects', 'themes');
const cngxCss = readFileSync(join(THEMES, 'cngx.css'), 'utf8');

const importSpecifiers = [...cngxCss.matchAll(/^@import '([^']+)';/gm)].map((m) => m[1]);

describe('themes aggregate (cngx.css)', () => {
  it('resolves every relative @import to a file on disk', () => {
    expect(importSpecifiers.length).toBeGreaterThan(0);
    for (const specifier of importSpecifiers) {
      expect(specifier).toMatch(/^\.\.\//);
      expect(existsSync(resolve(THEMES, specifier)), `unresolved import: ${specifier}`).toBe(true);
    }
  });

  it('imports all four per-lib system-tokens placeholders', () => {
    for (const lib of ['common', 'forms', 'ui', 'data-display']) {
      expect(importSpecifiers).toContain(`../${lib}/theming/system-tokens.css`);
    }
  });

  it('declares a @cngx peer for every lib the imports resolve onto', () => {
    const pkg = JSON.parse(readFileSync(join(THEMES, 'package.json'), 'utf8'));
    const libs = new Set(importSpecifiers.map((s) => s.split('/')[1]));
    for (const lib of libs) {
      expect(
        pkg.peerDependencies[`@cngx/${lib}`],
        `missing peerDependency @cngx/${lib}`,
      ).toBeDefined();
    }
  });

  it('does not advertise the non-existent material/theme.css specifier', () => {
    expect(cngxCss).not.toContain('material/theme.css');
    expect(existsSync(join(THEMES, 'material', 'theme.scss'))).toBe(true);
  });
});
