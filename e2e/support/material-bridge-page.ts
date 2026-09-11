import { resolve } from 'node:path';

import type { Page } from '@playwright/test';
import { compileString } from 'sass';

/**
 * Rendered-value harness for the Material bridges. The name-contract specs
 * (compileString, emitted-set == consumed-set) pin WHAT a bridge emits; this
 * helper exists for the class of proof they structurally cannot give: that a
 * themed token actually LANDS on its read element. jsdom ignores `@property`,
 * so `getComputedStyle` under ng test lies about the cascade (see the
 * rationale in e2e/css-contract-system-tokens.spec.ts) - the assertions have
 * to run in a real browser.
 *
 * Fixtures are self-contained `page.setContent` documents, not examples-app
 * routes: material-lab loads only a bridge subset and a prebuilt theme, while
 * this injects exactly the CSS under test - layers.css first (declares the
 * cascade-layer order), then the component stylesheet(s), then the
 * sass-compiled bridge, then unlayered `--mat-sys-*` stand-ins with
 * distinctive values, so every assertion traces one token to one Material
 * role.
 */

const REPO_ROOT = resolve(__dirname, '../..');
const LOAD_PATHS = [resolve(REPO_ROOT, 'node_modules'), resolve(REPO_ROOT, 'projects/themes')];
const LAYERS_CSS = resolve(REPO_ROOT, 'projects/core/theming/layers.css');

export type ThemeVersion = 'v1' | 'v0';

/**
 * Compiles `projects/themes/material/<bridge>.scss` against a real Material
 * theme. Entry shape mirrors the name-contract specs
 * (projects/common/interactive/material-bridge-tokens.spec.ts).
 */
export function compileBridge(bridge: string, themeVersion: ThemeVersion = 'v1'): string {
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
@use 'material/${bridge}' as bridge;

${theme}

@include bridge.theme($theme);
`;
  return compileString(entry, { loadPaths: LOAD_PATHS }).css;
}

/**
 * The `--mat-sys-*` color roles the bridges reference. Each gets a
 * machine-derived, pairwise-distinct rgb() stand-in, so a bridge that maps a
 * token to the wrong role can never accidentally pass an equality assertion.
 * rgb() with 0-255 channels on purpose: it round-trips getComputedStyle's
 * serialization verbatim in every engine.
 */
const MAT_SYS_COLOR_TOKENS = [
  'primary',
  'on-primary',
  'primary-container',
  'on-primary-container',
  'secondary',
  'on-secondary',
  'secondary-container',
  'on-secondary-container',
  'tertiary',
  'on-tertiary',
  'tertiary-container',
  'on-tertiary-container',
  'error',
  'on-error',
  'error-container',
  'on-error-container',
  'surface',
  'on-surface',
  'surface-variant',
  'on-surface-variant',
  'surface-container',
  'surface-container-low',
  'surface-container-lowest',
  'surface-container-high',
  'surface-container-highest',
  'outline',
  'outline-variant',
  'scrim',
  'shadow',
  'inverse-surface',
  'inverse-on-surface',
  'inverse-primary',
] as const;

export type MatSysColorToken = (typeof MAT_SYS_COLOR_TOKENS)[number];

/** The stand-in value a fixture page carries for `--mat-sys-<token>`. */
export function matSys(token: MatSysColorToken): string {
  const index = MAT_SYS_COLOR_TOKENS.indexOf(token);
  return `rgb(${index + 1}, ${100 + index}, ${200 - index})`;
}

/**
 * Unlayered `:root` block assigning every stand-in. Unlayered on purpose: it
 * models a consumer theme, which must beat every layered cngx rule.
 */
export const MAT_SYS_STANDINS = `:root {\n${MAT_SYS_COLOR_TOKENS.map(
  (token) => `  --mat-sys-${token}: ${matSys(token)};`,
).join('\n')}\n}`;

export interface BridgeFixture {
  /** Repo-relative stylesheet paths, injected in order after layers.css. */
  componentCss: readonly string[];
  /** Sass-compiled bridge CSS - a compileBridge() result. */
  bridgeCss: string;
  /** Body markup built from the component's shipped classes and attributes. */
  html: string;
}

export async function renderFixture(page: Page, fixture: BridgeFixture): Promise<void> {
  await page.setContent(
    `<!doctype html><html><head><meta charset="utf-8"></head><body>${fixture.html}</body></html>`,
  );
  await page.addStyleTag({ path: LAYERS_CSS });
  for (const css of fixture.componentCss) {
    await page.addStyleTag({ path: resolve(REPO_ROOT, css) });
  }
  await page.addStyleTag({ content: fixture.bridgeCss });
  await page.addStyleTag({ content: MAT_SYS_STANDINS });
}

/**
 * Computed value of `property` (custom property or painted longhand) on the
 * first match of `selector`.
 */
export function computedValue(page: Page, selector: string, property: string): Promise<string> {
  return page
    .locator(selector)
    .first()
    .evaluate((el, prop) => getComputedStyle(el).getPropertyValue(prop).trim(), property);
}
