/**
 * Guards the form of the `<example-url>` JSDoc tags under `projects/`.
 *
 * Every tag is a relative hash route (`<example-url>/#/forms/select/...`).
 * compodocx resolves it against `exampleUrlBase` (.compodocrc.json: the
 * published examples app; docs:serve and docs:watch pass the local dev
 * server). A tag with a host pins the docs to that host - a localhost tag
 * renders a dead iframe on the published site. Fix offenders with
 * `node scripts/relativize-example-urls.mjs`.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const PROJECTS = join(ROOT, 'projects');

const TAG = /<example-url>([^<]*)<\/example-url>/g;

/** Every `.ts` file below `dir`. */
const tsFiles = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return tsFiles(p);
    return p.endsWith('.ts') ? [p] : [];
  });

/** `file:line url` of every tag that is not a relative hash route. */
const offenders = () =>
  tsFiles(PROJECTS).flatMap((file) =>
    readFileSync(file, 'utf8')
      .split('\n')
      .flatMap((line, i) =>
        [...line.matchAll(TAG)]
          .map((m) => m[1].trim())
          .filter((url) => !url.startsWith('/#/'))
          .map((url) => `${relative(ROOT, file)}:${i + 1} ${url}`),
      ),
  );

describe('<example-url> tags', () => {
  it('are relative hash routes', () => {
    expect(offenders()).toEqual([]);
  });
});
