import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { compileString } from 'sass';
import { describe, expect, it } from 'vitest';

/**
 * Token-name contract for the timeline Material bridge
 * (`projects/themes/material/timeline-theme.scss`). The bridges' historic
 * defect class is name drift - emitting `--cngx-*` custom properties no
 * component reads - so this spec pins the exact emitted token-name set and
 * additionally scans the consumer stylesheets, which span two libs: the
 * bridge assigns on the atoms and the molecule as well as the organism, so
 * the consumed set is the union over all four files. Rendered-value coverage
 * (does the token LAND on its read element) is the e2e harness's job
 * (e2e/material-bridge-rendered.spec.ts); this file guards the name surface
 * only.
 *
 * Sits in `projects/ui/timeline/` for sibling symmetry - the other four
 * bridge-bearing organism families (accordion, breadcrumb, stepper, tabs)
 * carry their bridge spec next to the ui organism, and the common atoms'
 * stylesheets enter via the consumed-set scan, not via spec location.
 */

const REPO_ROOT = resolve(__dirname, '../../..');
const LOAD_PATHS = [resolve(REPO_ROOT, 'node_modules'), resolve(REPO_ROOT, 'projects/themes')];

const CONSUMER_STYLESHEETS = [
  'projects/common/timeline/connector.component.css',
  'projects/common/timeline/marker.component.css',
  'projects/common/timeline/timeline-item.component.css',
  'projects/ui/timeline/timeline.component.css',
];

function emittedTokenNames(themeVersion: 'v1' | 'v0'): string[] {
  const theme =
    themeVersion === 'v1'
      ? `$theme: mat.define-theme((
  color: (theme-type: light, primary: mat.$azure-palette, tertiary: mat.$blue-palette),
));`
      : `$primary: mat.m2-define-palette(mat.$m2-indigo-palette);
$accent: mat.m2-define-palette(mat.$m2-pink-palette);
$theme: mat.m2-define-light-theme((color: (primary: $primary, accent: $accent)));`;
  const entry = `
@use '@angular/material' as mat;
@use 'material/timeline-theme' as bridge;

${theme}

@include bridge.theme($theme);
`;
  const css = compileString(entry, { loadPaths: LOAD_PATHS }).css;
  return [...new Set([...css.matchAll(/--cngx-[a-z0-9-]+(?=:)/g)].map((m) => m[0]))].sort();
}

function consumedTokenNames(): Set<string> {
  const names = new Set<string>();
  for (const stylesheet of CONSUMER_STYLESHEETS) {
    const css = readFileSync(resolve(REPO_ROOT, stylesheet), 'utf8');
    for (const match of css.matchAll(/--cngx-timeline-[a-z0-9-]+/g)) {
      names.add(match[0]);
    }
  }
  return names;
}

describe('timeline Material bridge', () => {
  // the color surface; spacing is deliberately absent from the bridge
  // (derived from --cngx-space-*, density-bridge territory)
  const CONSUMED = [
    '--cngx-timeline-active-color',
    '--cngx-timeline-connector-color',
    '--cngx-timeline-done-color',
    '--cngx-timeline-marker-fg',
    '--cngx-timeline-muted-color',
    '--cngx-timeline-rejected-color',
    '--cngx-timeline-surface',
    '--cngx-timeline-text-color',
    '--cngx-timeline-upcoming-color',
  ];

  it('emits only consumed token names (M3)', () => {
    expect(emittedTokenNames('v1')).toEqual(CONSUMED);
  });

  it('every emitted name has a read site in the four consumer stylesheets (M3)', () => {
    const consumed = consumedTokenNames();
    for (const name of emittedTokenNames('v1')) {
      expect(consumed).toContain(name);
    }
  });

  it('emits a consumed-name subset (M2)', () => {
    const names = emittedTokenNames('v0');
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(CONSUMED).toContain(name);
    }
  });
});
