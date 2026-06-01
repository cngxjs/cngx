import { resolve } from 'node:path';

import { compileString } from 'sass';
import { describe, expect, it } from 'vitest';

/**
 * Phase 0 baseline for the Material bridge mixin in
 * `projects/themes/material/stepper-theme.scss`. Pins the resolved
 * `--cngx-step-*` declarations produced by the `color($theme)` mixin
 * against both theme versions:
 *
 *   - v1 (M3): `mat.define-theme(...)` with the `--mat-sys-*` token
 *     branch active.
 *   - v0 (M2): `mat.m2-define-light-theme(...)` with the
 *     `get-theme-color($theme, primary)` branch active.
 *
 * Phase B Commit 6 and Phase C Commit 6 will EXTEND the mixin with
 * additional `--cngx-step-*` overrides for new skin / variant
 * properties. The Phase 0 baseline lines documented here MUST stay
 * unchanged across those phases — the snapshot diff Phase B and C
 * produce is purely additive. Any change to a Phase 0 line is a
 * regression.
 *
 * The spec runs under `ng test ui` rather than via a dedicated themes
 * test project: `projects/themes/material/` carries no `ng-package.json`
 * and is not wired into `npm run test`. Co-locating the spec next to
 * the cngx-stepper organism keeps the consumer-side regression net
 * close to the symbols it protects.
 */

const REPO_ROOT = resolve(__dirname, '../../..');
const LOAD_PATHS = [
  resolve(REPO_ROOT, 'node_modules'),
  resolve(REPO_ROOT, 'projects/themes'),
];

interface CompileOptions {
  themeVersion: 'v1' | 'v0';
  variant: 'light' | 'dark';
}

function buildEntry(opts: CompileOptions): string {
  if (opts.themeVersion === 'v1') {
    return `
@use '@angular/material' as mat;
@use 'material/stepper-theme' as stepper;

$theme: mat.define-theme((
  color: (
    theme-type: ${opts.variant},
    primary: mat.$violet-palette,
    tertiary: mat.$cyan-palette,
  ),
));

.cngx-stepper-test {
  @include stepper.color($theme);
}
`;
  }
  return `
@use '@angular/material' as mat;
@use 'material/stepper-theme' as stepper;

$primary: mat.m2-define-palette(mat.$m2-indigo-palette);
$accent: mat.m2-define-palette(mat.$m2-pink-palette);
$warn: mat.m2-define-palette(mat.$m2-red-palette);

$theme: mat.m2-define-light-theme((
  color: (
    primary: $primary,
    accent: $accent,
    warn: $warn,
  ),
));

.cngx-stepper-test {
  @include stepper.color($theme);
}
`;
}

function parseCustomPropertyDeclarations(css: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /(--cngx-step-[a-z0-9-]+)\s*:\s*([^;]+);/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(css)) !== null) {
    out[match[1]] = match[2].trim().replace(/\s+/g, ' ');
  }
  return out;
}

function compileAndExtract(opts: CompileOptions): Record<string, string> {
  const result = compileString(buildEntry(opts), {
    loadPaths: LOAD_PATHS,
    style: 'expanded',
    quietDeps: true,
  });
  return parseCustomPropertyDeclarations(result.css);
}

describe('Material stepper-theme mixin baseline', () => {
  it('v1 light: resolved --cngx-step-* declarations match the baseline', () => {
    expect(compileAndExtract({ themeVersion: 'v1', variant: 'light' })).toMatchSnapshot();
  });

  it('v1 dark: resolved --cngx-step-* declarations match the baseline', () => {
    expect(compileAndExtract({ themeVersion: 'v1', variant: 'dark' })).toMatchSnapshot();
  });

  it('v0 light: resolved --cngx-step-* declarations match the baseline', () => {
    expect(compileAndExtract({ themeVersion: 'v0', variant: 'light' })).toMatchSnapshot();
  });
});
