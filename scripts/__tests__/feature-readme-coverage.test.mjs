import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

/**
 * Guard that every library README is shown on a docs page.
 *
 * compodocx renders a README only as the page of the feature it belongs to
 * (`semantic.features[].readme` in the JSON export). Which folder becomes a
 * feature follows the `features` globs in `.compodocrc.json` first and the
 * import-cohesion rule after that, so a new import between two sibling
 * folders can merge them and drop one README from the site without any
 * warning. A dropped README fails this guard: give its folder a `features`
 * glob in `.compodocrc.json`.
 *
 * READMEs no glob can reach are the exact list below with their reason. A row
 * whose README gets a page fails the guard too (drop the row).
 *
 * Needs a fresh `.compodoc/documentation.json`; CI builds it before
 * `test:scripts`.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const PROJECTS = join(ROOT, 'projects');
const DOC_PATH = join(ROOT, '.compodoc/documentation.json');

/** READMEs without a docs page, `{ file, reason }`. */
const NO_PAGE = [
  {
    file: 'projects/core/README.md',
    reason: 'package root without a root symbol: no root feature',
  },
  {
    file: 'projects/common/a11y/README.md',
    reason: 'package root without a root symbol: no root feature',
  },
  {
    file: 'projects/interop/README.md',
    reason: 'package root without a root symbol: no root feature',
  },
  {
    file: 'projects/common/display/tag/shared/README.md',
    reason: 'internal folder, no documented symbol',
  },
  {
    file: 'projects/forms/select/shared/internal/README.md',
    reason: 'internal folder, no documented symbol',
  },
  {
    file: 'projects/forms/select/shared/internal/panel/README.md',
    reason: 'internal folder, no documented symbol',
  },
  {
    file: 'projects/forms/select/shared/internal/panel-shell/README.md',
    reason: 'internal folder, no documented symbol',
  },
  { file: 'projects/core/schematics/README.md', reason: 'excluded by tsconfig.doc.json' },
  { file: 'projects/testing/README.md', reason: 'excluded by tsconfig.doc.json, not published' },
];

function readmes(dir) {
  return readdirSync(dir).flatMap((name) => {
    if (name === 'node_modules' || name.startsWith('.')) {
      return [];
    }
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      return readmes(path);
    }
    return name === 'README.md' ? [relative(ROOT, path).split('\\').join('/')] : [];
  });
}

describe('feature README coverage', () => {
  it('reads the compodocx JSON export', () => {
    expect(existsSync(DOC_PATH), 'run `npm run docs:json` first').toBe(true);
  });

  it('shows every library README on a docs page, except the listed ones', () => {
    const doc = JSON.parse(readFileSync(DOC_PATH, 'utf8'));
    const shown = new Set(
      (doc.semantic?.features ?? []).map((feature) => feature.readme).filter(Boolean),
    );
    const listed = new Set(NO_PAGE.map((row) => row.file));
    const all = readmes(PROJECTS).sort();

    expect(all.filter((file) => !shown.has(file) && !listed.has(file))).toEqual([]);
    expect(NO_PAGE.filter((row) => shown.has(row.file) || !all.includes(row.file))).toEqual([]);
  });
});
