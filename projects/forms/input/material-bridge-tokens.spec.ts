import { describe, expect, it } from 'vitest';

import { compileThemeEntry, emittedTokenNames } from '@cngx/testing/sass';

/**
 * Token-name contracts for the Material bridges whose consumers live in
 * `@cngx/forms/input`: rating and phone-input. Pins the exact emitted
 * token-name set against the names grep-verified in the component
 * stylesheets (the bridges' historic defect class is name drift).
 * Rendered-value coverage lives in e2e/material-bridge-rendered.spec.ts;
 * this file guards the name surface only. Mirrors the shape of
 * `projects/common/interactive/material-bridge-tokens.spec.ts`.
 */

function bridgeTokenNames(bridge: string): readonly string[] {
  return emittedTokenNames(
    compileThemeEntry(`
@use '@angular/material' as mat;
@use 'material/${bridge}' as bridge;

$theme: mat.define-theme((
  color: (theme-type: light, primary: mat.$azure-palette, tertiary: mat.$blue-palette),
));

@include bridge.theme($theme);
`),
  );
}

describe('rating Material bridge', () => {
  // every name is consumed by rating.component.css; size, focus-ring
  // geometry and the space-derived gaps deliberately stay unbridged
  const CONSUMED = [
    '--cngx-rating-color',
    '--cngx-rating-color-active',
    '--cngx-rating-focus-ring',
  ];

  it('emits only consumed token names (M3)', () => {
    expect(bridgeTokenNames('rating-theme')).toEqual(CONSUMED);
  });
});

describe('phone-input Material bridge', () => {
  // an intentional no-op: gap (space-derived) and number-min-width (content
  // geometry) have no Material counterpart, and the disabled parts fade by
  // the system-bridged field recipe
  it('emits no token names (M3)', () => {
    expect(bridgeTokenNames('phone-input-theme')).toEqual([]);
  });
});
