import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { compileThemeEntry, emittedTokenNames } from '@cngx/testing/sass';

/**
 * Token-name contract for the Material bridges whose consumers live in
 * `@cngx/common/interactive` (+ the shared indicator atoms in
 * `@cngx/common/display`). The bridges' historic defect class is name
 * drift - writing `--cngx-*` custom properties no component reads - so
 * these specs pin the exact emitted token-name set against the names
 * grep-verified in the component stylesheets. Rendered-value coverage
 * (inherits:false placement) is the snapshot harness's job; this file
 * guards the name surface only.
 *
 * Co-located with the consumer (mirrors `material-theme.snapshot.spec.ts`
 * next to the ui organisms) because `projects/themes/material/` carries
 * no test target.
 */

function bridgeCss(bridge: string): string {
  return compileThemeEntry(`
@use '@angular/material' as mat;
@use 'material/${bridge}' as bridge;

$theme: mat.define-theme((
  color: (theme-type: light, primary: mat.$azure-palette, tertiary: mat.$blue-palette),
));

@include bridge.theme($theme);
`);
}

function bridgeTokenNames(bridge: string): readonly string[] {
  return emittedTokenNames(bridgeCss(bridge));
}

describe('interactive-controls Material bridge', () => {
  // every name is consumed by checkbox-indicator.component.css,
  // radio-indicator.component.css, or toggle.component.css
  const CONSUMED = [
    '--cngx-checkbox-border',
    '--cngx-checkbox-checked-bg',
    '--cngx-checkbox-checked-color',
    '--cngx-checkbox-radius',
    '--cngx-radio-indicator-checked-color',
    '--cngx-radio-indicator-color',
    '--cngx-radio-indicator-mark-color',
    '--cngx-toggle-thumb-bg',
    '--cngx-toggle-track-bg-off',
    '--cngx-toggle-track-bg-on',
  ];

  it('emits only consumed token names (M3)', () => {
    expect(bridgeTokenNames('interactive-controls-theme')).toEqual(CONSUMED);
  });

  it('maps the checkbox box onto the fixed 2px mat-checkbox corner (M3)', () => {
    // The cngx default reads --cngx-radius-sm, which the system bridge maps
    // to corner-extra-small (4px); mat-checkbox draws 2px.
    expect(bridgeCss('interactive-controls-theme')).toContain('--cngx-checkbox-radius: 2px');
  });

  it('state-scopes the checked thumb to on-primary (M3)', () => {
    const entry = `
@use '@angular/material' as mat;
@use 'material/interactive-controls-theme' as bridge;

$theme: mat.define-theme((
  color: (theme-type: light, primary: mat.$azure-palette, tertiary: mat.$blue-palette),
));

@include bridge.theme($theme);
`;
    const css = compileThemeEntry(entry);
    const checkedBlock = css.match(/:where\(\.cngx-toggle--checked[^{]*\{[^}]*\}/)?.[0];
    expect(checkedBlock).toContain('--cngx-toggle-thumb-bg: var(--mat-sys-on-primary)');
    // the resting broadcast keeps the outline thumb
    expect(css).toContain('--cngx-toggle-thumb-bg: var(--mat-sys-outline)');
  });

  it('maps the check skin mark onto on-primary (M3)', () => {
    const css = compileThemeEntry(`
@use '@angular/material' as mat;
@use 'material/interactive-controls-theme' as bridge;

$theme: mat.define-theme((
  color: (theme-type: light, primary: mat.$azure-palette, tertiary: mat.$blue-palette),
));

@include bridge.theme($theme);
`);
    expect(css).toContain('--cngx-radio-indicator-mark-color: var(--mat-sys-on-primary)');
  });
});

describe('menu Material bridge', () => {
  // every name is read by cngx-menu.css on [cngxMenu] or its rows
  const CONSUMED = [
    '--cngx-menu-bg',
    '--cngx-menu-border',
    '--cngx-menu-color',
    '--cngx-menu-item-checked-color',
    '--cngx-menu-item-gap',
    '--cngx-menu-item-highlight-bg',
    '--cngx-menu-item-kbd-color',
    '--cngx-menu-item-padding',
    '--cngx-menu-item-radius',
    '--cngx-menu-padding',
    '--cngx-menu-radius',
    '--cngx-menu-separator-color',
    '--cngx-menu-shadow',
  ];

  it('emits only consumed token names (M3)', () => {
    expect(bridgeTokenNames('menu-theme')).toEqual(CONSUMED);
  });

  it('is read by cngx-menu.css', () => {
    const sheet = readFileSync(
      resolve(process.cwd(), 'projects/common/theming/components/cngx-menu.css'),
      'utf-8',
    );
    for (const name of CONSUMED) {
      expect(sheet, name).toMatch(new RegExp(`var\\(\\s*${name}[,)]`));
    }
  });

  it('drops the border and derives the M3 row metrics from the space scale', () => {
    const m3 = compileThemeEntry(`@use '@angular/material' as mat;
@use 'material/menu-theme' as bridge;
$theme: mat.define-theme((color: (theme-type: light, primary: mat.$azure-palette)));
@include bridge.theme($theme);`);
    expect(m3).toContain('--cngx-menu-border: none');
    expect(m3).toContain('--cngx-menu-bg: var(--mat-sys-surface-container)');
    expect(m3).toContain('--cngx-menu-item-padding: calc(var(--cngx-space-sm, 8px) * 1.75) calc(var(--cngx-space-sm, 8px) * 1.5)');
    expect(m3).toContain('font-size: var(--mat-sys-label-large-size, 0.875rem)');
    expect(m3).toContain('-webkit-font-smoothing: antialiased');
    expect(m3).not.toMatch(/@layer\s+(?!cngx\.components)/);
  });
});

describe('copy-block Material bridge', () => {
  // every name is consumed by copy-block.css on the __button element
  const CONSUMED = [
    '--cngx-copy-block-btn-bg',
    '--cngx-copy-block-btn-border',
    '--cngx-copy-block-btn-color',
    '--cngx-copy-block-btn-copied-bg',
    '--cngx-copy-block-btn-copied-border',
    '--cngx-copy-block-btn-copied-color',
  ];

  it('emits only consumed token names (M3)', () => {
    expect(bridgeTokenNames('copy-block-theme')).toEqual(CONSUMED);
  });

  // inherits:false tokens and the host-SET copied border land on the button
  // through the broadcast; the two inheriting copied tokens land on the theme
  // host and are re-asserted on the scheme scopes copy-block.css SETs.
  it('splits the emission per token registration', () => {
    const css = bridgeCss('copy-block-theme');
    const blocks = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, sel, body]) => ({
      selector: sel.trim(),
      names: emittedTokenNames(body),
    }));
    const find = (pred: (selector: string) => boolean) => blocks.filter((b) => pred(b.selector));

    const broadcast = find((s) => s === ':where(.cngx-copy-block, .cngx-copy-block *)');
    expect(broadcast.map((b) => b.names)).toEqual([
      [
        '--cngx-copy-block-btn-bg',
        '--cngx-copy-block-btn-border',
        '--cngx-copy-block-btn-color',
        '--cngx-copy-block-btn-copied-border',
      ],
    ]);
    const inherited = ['--cngx-copy-block-btn-copied-bg', '--cngx-copy-block-btn-copied-color'];
    expect(find((s) => s === ':root').map((b) => b.names)).toEqual([inherited]);
    const schemes = find((s) => s.startsWith(':where(') && s.includes('.dark'));
    expect(schemes.map((b) => b.names)).toEqual([inherited]);
    for (const scope of [
      '[data-color-scheme=dark]',
      '.dark',
      '[data-color-scheme=light]',
      '.light',
    ]) {
      expect(schemes[0].selector, scope).toContain(scope);
    }
  });

  // The scheme-scope re-assertion mirrors the scopes copy-block.css SETs the
  // copied literals on; a scope added or renamed there must fail here, not
  // silently shadow the bridge.
  it('re-asserts on exactly the scheme scopes copy-block.css SETs', () => {
    const sheet = readFileSync(
      resolve(process.cwd(), 'projects/common/interactive/copy/copy-block.css'),
      'utf-8',
    );
    const normalize = (list: string): string[] =>
      list
        .split(',')
        .map((sel) => sel.trim().replace(/['"]/g, ''))
        .filter(Boolean);
    const componentScopes = [...sheet.matchAll(/([^{}]+)\{[^{}]*--cngx-copy-block-btn-copied-bg:/g)]
      .map(([, sel]) => sel.replace(/\/\*[\s\S]*?\*\//g, '').trim())
      .filter((sel) => !sel.startsWith(':root'))
      .flatMap(normalize)
      .sort();
    const css = bridgeCss('copy-block-theme');
    const bridgeScopes = [...css.matchAll(/:where\(([^)]*\.dark[^)]*)\)\s*\{/g)]
      .flatMap(([, list]) => normalize(list))
      .sort();
    expect(componentScopes.length).toBeGreaterThan(0);
    expect(bridgeScopes).toEqual(componentScopes);
  });
});

describe('ripple Material bridge', () => {
  // every name is consumed by cngx-ripple.css on the __wave child
  const CONSUMED = ['--cngx-ripple-duration', '--cngx-ripple-opacity'];

  it('emits only consumed token names (M3)', () => {
    expect(bridgeTokenNames('ripple-theme')).toEqual(CONSUMED);
  });

  it('layers the bridge on the .cngx-ripple host class', () => {
    const entry = `
@use '@angular/material' as mat;
@use 'material/ripple-theme' as bridge;

$theme: mat.define-theme((
  color: (theme-type: light, primary: mat.$azure-palette, tertiary: mat.$blue-palette),
));

@include bridge.theme($theme);
`;
    const css = compileThemeEntry(entry);
    // formerly the only unlayered bridge besides filter-builder - an
    // unlayered rule would beat any layered consumer override
    expect(css).toMatch(/@layer cngx\.components\s*\{/);
    // the class is on every ripple host, including cngxPressRipple and
    // hostDirectives compositions that carry no [cngxRipple] attribute
    expect(css).toMatch(/:where\(\.cngx-ripple\)\s*\{/);
    expect(css).not.toContain('[cngxRipple]');
  });
});

describe('button-toggle Material bridge', () => {
  // The leaf chrome (theming/components/cngx-button-toggle.css) reads no
  // component-level color token - every tone derives from the foundation
  // knobs, so the bridge routes those (tabs-theme precedent): the primary
  // for the unchecked hover tint, the strong pair for the checked segment.
  // The padding tokens are SET per segment inside @scope, so metrics()
  // assigns them in a raw rule on the --cngx-space-sm rung. The shape rides
  // the --cngx-radius-md knob, read by the first and last segment corners
  // and by the group radius derivation.
  const CONSUMED = [
    '--cngx-button-toggle-padding-block',
    '--cngx-button-toggle-padding-inline',
    '--cngx-color-border',
    '--cngx-color-on-primary-strong',
    '--cngx-color-primary',
    '--cngx-color-primary-strong',
    '--cngx-color-surface',
    '--cngx-color-text',
    '--cngx-radius-md',
  ];

  it('emits only consumed token names (M3)', () => {
    expect(bridgeTokenNames('button-toggle-theme')).toEqual(CONSUMED);
  });

  it('assigns on the group hosts and the toggle button, layered and zero-specificity', () => {
    const entry = `
@use '@angular/material' as mat;
@use 'material/button-toggle-theme' as bridge;

$theme: mat.define-theme((
  color: (theme-type: light, primary: mat.$azure-palette, tertiary: mat.$blue-palette),
));

@include bridge.theme($theme);
`;
    const css = compileThemeEntry(entry);
    expect(css).toMatch(/@layer cngx\.components\s*\{/);
    const block = css.match(
      /:where\(cngx-button-toggle-group, cngx-button-multi-toggle-group, button\[cngxButtonToggle\]\)\s*\{[^}]*\}/,
    );
    expect(block).not.toBeNull();
    expect(block![0]).toContain('--cngx-color-primary: var(--mat-sys-primary)');
    expect(block![0]).toContain('--cngx-color-primary-strong: var(--mat-sys-secondary-container)');
    expect(block![0]).toContain('--cngx-color-border: var(--mat-sys-outline)');
  });

  it('assigns the padding on the density rungs in a raw rule above the @scope SET (M3)', () => {
    const css = bridgeCss('button-toggle-theme');
    const segment = css.match(/\n\s*button\.cngx-button-toggle\s*\{[^}]*\}/);
    expect(segment).not.toBeNull();
    expect(segment![0]).toContain('--cngx-button-toggle-padding-block: calc(var(--cngx-space-sm, 8px) * 1.25)');
    expect(segment![0]).toContain('--cngx-button-toggle-padding-inline: calc(var(--cngx-space-sm, 8px) * 1.5)');
    expect(segment![0]).toContain('line-height: var(--mat-sys-label-large-line-height, 1.25rem)');
    expect(segment![0]).not.toContain('letter-spacing');
    expect(css).not.toMatch(/--cngx-button-toggle-padding-(block|inline): \d+px/);
  });

  it('lays the on-surface hover state layer over both segment states (M3)', () => {
    const css = bridgeCss('button-toggle-theme');
    expect(css).toContain(
      'background: color-mix(in srgb, var(--mat-sys-on-surface) 8%, var(--cngx-color-surface))',
    );
    expect(css).toContain(
      'background: color-mix(in srgb, var(--mat-sys-on-surface) 8%, var(--mat-sys-secondary-container))',
    );
  });

  it('routes the Material group corner through the radius knob on hosts and segments', () => {
    // The segments paint the visible corners from --cngx-radius-md; the
    // group radius token is inherits:false and never reaches them.
    const hosts =
      /:where\(cngx-button-toggle-group, cngx-button-multi-toggle-group, button\[cngxButtonToggle\]\)\s*\{[^}]*\}/;
    expect(bridgeCss('button-toggle-theme').match(hosts)![0]).toContain(
      '--cngx-radius-md: var(--mat-sys-corner-extra-large, 28px)',
    );
    expect(bridgeCss('button-toggle-theme')).not.toContain('--cngx-button-toggle-group-radius');
  });
});

describe('divider Material bridge', () => {
  // every name is read by theming/components/cngx-divider.css on .cngx-divider
  const CONSUMED = ['--cngx-divider-color', '--cngx-divider-spacing'];

  it('emits only consumed token names (M3)', () => {
    expect(bridgeTokenNames('divider-theme')).toEqual(CONSUMED);
  });

  it('drops the spacing to the zero margin of mat-divider (M3)', () => {
    // The cngx default reads --cngx-space-sm (8px at density 0).
    expect(bridgeCss('divider-theme')).toContain('--cngx-divider-spacing: 0');
  });
});

describe('async-click Material bridge', () => {
  // every name is consumed by theming/components/cngx-async.css on the
  // cngxAsyncClick host (button-family hosts are excluded from that paint)
  const CONSUMED = [
    '--cngx-async-error-bg',
    '--cngx-async-error-border',
    '--cngx-async-error-color',
    '--cngx-async-success-bg',
    '--cngx-async-success-border',
    '--cngx-async-success-color',
  ];

  it('emits only consumed token names (M3)', () => {
    expect(bridgeTokenNames('async-click-theme')).toEqual(CONSUMED);
  });

  // The tokens are registered `inherits: true`, so the bridge lands on the
  // include host and the state hosts inherit them; a per-element selector
  // would shadow an ancestor SET.
  function asyncClickCss(includeAt: string | null): string {
    const include = '@include bridge.theme($theme);';
    return compileThemeEntry(`
@use '@angular/material' as mat;
@use 'material/async-click-theme' as bridge;

$theme: mat.define-theme((
  color: (theme-type: light, primary: mat.$azure-palette, tertiary: mat.$blue-palette),
));

${includeAt ? `${includeAt} { ${include} }` : include}
`);
  }

  it('emits on :root for a root include, not on the state hosts', () => {
    const css = asyncClickCss(null);
    const block = css.match(/@layer cngx\.components\s*\{\s*:root\s*\{([^}]*)\}/);
    expect(block).not.toBeNull();
    expect(emittedTokenNames(block![1])).toEqual(CONSUMED);
    expect(block![1]).toContain('--cngx-async-error-color: var(--mat-sys-error)');
    expect(block![1]).toContain('--cngx-async-success-color: var(--mat-sys-primary)');
    expect(css).not.toContain('.cngx-async');
    expect(css).not.toContain(':where(');
  });

  it('emits on the selector the bridge is included in', () => {
    const css = asyncClickCss('.app-theme');
    const block = css.match(/@layer cngx\.components\s*\{\s*\.app-theme\s*\{([^}]*)\}/);
    expect(block).not.toBeNull();
    expect(emittedTokenNames(block![1])).toEqual(CONSUMED);
    expect(css).not.toContain(':root');
    expect(css).not.toContain('.cngx-async');
  });
});
