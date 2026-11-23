import { describe, expect, it } from 'vitest';

import { compileThemeEntry, emittedTokenNames } from '@cngx/testing/sass';

/**
 * Token-name contract for the card Material bridge
 * (`projects/themes/material/card-theme.scss`). Pins the emitted token-name
 * set against the names the card family reads, and the shape of the radius
 * rule. Co-located with the consumer because `projects/themes/material/` has
 * no test target.
 */

function compileBridge(): string {
  return compileThemeEntry(`
@use '@angular/material' as mat;
@use 'material/card-theme' as bridge;

$theme: mat.define-theme((
  color: (theme-type: light, primary: mat.$azure-palette, tertiary: mat.$blue-palette),
));

@include bridge.theme($theme);
`);
}

describe('card Material bridge', () => {
  // every name is read by card.component.css, metric, trend,
  // card-timestamp or card-skeleton
  const CONSUMED = [
    '--cngx-card-bg',
    '--cngx-card-border',
    '--cngx-card-color',
    '--cngx-card-divider',
    '--cngx-card-focus-color',
    '--cngx-card-radius',
    '--cngx-card-selected-bg',
    '--cngx-card-selected-border',
    '--cngx-card-subtitle-color',
    '--cngx-card-subtitle-size',
    '--cngx-card-timestamp-color',
    '--cngx-card-timestamp-size',
    '--cngx-card-title-color',
    '--cngx-card-title-size',
    '--cngx-metric-unit-color',
    '--cngx-metric-unit-size',
    '--cngx-metric-value-color',
    '--cngx-metric-value-size',
    '--cngx-metric-value-weight',
    '--cngx-skeleton-bg',
    '--cngx-skeleton-shimmer',
    '--cngx-trend-color',
    '--cngx-trend-size',
    '--cngx-trend-weight',
  ];

  it('emits only consumed token names (M3)', () => {
    expect(emittedTokenNames(compileBridge())).toEqual(CONSUMED);
  });

  it('maps the corner onto the Material card shape on every read site (M3 12px)', () => {
    // The cngx default reads --cngx-radius-lg, which the system bridge maps
    // to corner-large (16px). The radius is inherits:false and read on the
    // card, its selection bar and its media, so the rule names all three.
    const rule =
      /@layer cngx\.components\s*\{\s*:where\(\.cngx-card, \.cngx-card__media\),\s*:where\(\.cngx-card\)::before\s*\{([^}]*)\}/;
    const m3 = compileBridge().match(rule);
    expect(m3).not.toBeNull();
    expect(m3![1]).toContain('--cngx-card-radius: var(--mat-sys-corner-medium, 12px)');
  });
});
