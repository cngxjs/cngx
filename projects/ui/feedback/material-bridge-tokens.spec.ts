import { describe, expect, it } from 'vitest';

import { compileThemeEntry, emittedTokenNames } from '@cngx/testing/sass';

/**
 * Token-name contract for the feedback Material bridge
 * (`projects/themes/material/feedback-theme.scss`), consumed by the
 * loading / progress / alert / toast / alert-stack / banner surfaces in
 * `@cngx/ui/feedback`. The bridge's historic dead names were the
 * `--cngx-{alert,toast}-dismiss-*` families (CngxCloseButton shipped
 * its own tokens) plus `--cngx-toast-count-gap` and
 * `--cngx-banner-action-min-size`; this file pins the emitted name set
 * against the names grep-verified in the component stylesheets. The
 * placement block additionally locks the host + descendants broadcast
 * the inherits:false tokens need; rendered values stay the
 * rendered-value harness's job.
 *
 * Co-located with the consumer (mirrors `material-bridge-tokens.spec.ts`
 * next to the sidenav) because `projects/themes/material/` carries no
 * test target.
 */

function compiledTheme(): string {
  const entry = `
@use '@angular/material' as mat;
@use 'material/feedback-theme' as feedback;

$theme: mat.define-theme((
  color: (theme-type: light, primary: mat.$azure-palette, tertiary: mat.$blue-palette),
));

@include feedback.theme($theme);
`;
  return compileThemeEntry(entry);
}

function bridgeTokenNames(): readonly string[] {
  return emittedTokenNames(compiledTheme());
}

describe('feedback Material bridge', () => {
  // every name is consumed by the ui/feedback component stylesheets
  const CONSUMED = [
    '--cngx-alert-action-color',
    '--cngx-alert-actions-gap',
    '--cngx-alert-bg',
    '--cngx-alert-border-radius',
    '--cngx-alert-error-bg',
    '--cngx-alert-error-border',
    '--cngx-alert-error-icon',
    '--cngx-alert-gap',
    '--cngx-alert-icon-size',
    '--cngx-alert-info-bg',
    '--cngx-alert-info-border',
    '--cngx-alert-info-icon',
    '--cngx-alert-padding',
    '--cngx-alert-stack-gap',
    '--cngx-alert-stack-message-line-height',
    '--cngx-alert-stack-message-size',
    '--cngx-alert-stack-overflow-border',
    '--cngx-alert-stack-overflow-color',
    '--cngx-alert-stack-overflow-padding',
    '--cngx-alert-stack-overflow-size',
    '--cngx-alert-stack-reserve-height',
    '--cngx-alert-success-bg',
    '--cngx-alert-success-border',
    '--cngx-alert-success-icon',
    '--cngx-alert-title-gap',
    '--cngx-alert-title-weight',
    '--cngx-alert-warning-bg',
    '--cngx-alert-warning-border',
    '--cngx-alert-warning-icon',
    '--cngx-banner-action-color',
    '--cngx-banner-action-font-size',
    '--cngx-banner-action-font-weight',
    '--cngx-banner-action-padding',
    '--cngx-banner-action-radius',
    '--cngx-banner-bg',
    '--cngx-banner-color',
    '--cngx-banner-error-bg',
    '--cngx-banner-error-border',
    '--cngx-banner-error-color',
    '--cngx-banner-error-font-size',
    '--cngx-banner-error-icon',
    '--cngx-banner-font-size',
    '--cngx-banner-gap',
    '--cngx-banner-icon-size',
    '--cngx-banner-info-bg',
    '--cngx-banner-info-border',
    '--cngx-banner-info-icon',
    '--cngx-banner-line-height',
    '--cngx-banner-padding',
    '--cngx-banner-pending-opacity',
    '--cngx-banner-success-bg',
    '--cngx-banner-success-border',
    '--cngx-banner-success-icon',
    '--cngx-banner-warning-bg',
    '--cngx-banner-warning-border',
    '--cngx-banner-warning-icon',
    '--cngx-banner-z-index',
    '--cngx-loading-bar-height',
    '--cngx-loading-bar-radius',
    '--cngx-loading-indicator-color',
    '--cngx-loading-indicator-size',
    '--cngx-loading-indicator-track',
    '--cngx-loading-overlay-backdrop-bg',
    '--cngx-loading-overlay-backdrop-opacity',
    '--cngx-loading-overlay-z-index',
    '--cngx-progress-border-radius',
    '--cngx-progress-circle-label-size',
    '--cngx-progress-circle-size',
    '--cngx-progress-color',
    '--cngx-progress-height',
    '--cngx-progress-label-color',
    '--cngx-progress-label-gap',
    '--cngx-progress-label-size',
    '--cngx-progress-track-color',
    '--cngx-toast-action-color',
    '--cngx-toast-action-size',
    '--cngx-toast-action-weight',
    '--cngx-toast-bg',
    '--cngx-toast-border',
    '--cngx-toast-border-radius',
    '--cngx-toast-color',
    '--cngx-toast-description-color',
    '--cngx-toast-error-accent',
    '--cngx-toast-font-size',
    '--cngx-toast-gap',
    '--cngx-toast-icon-size',
    '--cngx-toast-info-accent',
    '--cngx-toast-inner-gap',
    '--cngx-toast-line-height',
    '--cngx-toast-max-width',
    '--cngx-toast-outlet-padding',
    '--cngx-toast-padding',
    '--cngx-toast-shadow',
    '--cngx-toast-success-accent',
    '--cngx-toast-title-color',
    '--cngx-toast-warning-accent',
    '--cngx-toast-z-index',
  ];

  it('emits only consumed token names (M3)', () => {
    expect(bridgeTokenNames()).toEqual(CONSUMED);
  });

  it('pins the alert, banner and toast action to the pure severity accent (M3)', () => {
    // The cngx default mixes the accent into the text colour for 4.5:1 on the
    // light tint; the M3 accents already clear it, so the bridge keeps the
    // Material look.
    const m3 = compiledTheme();
    expect(m3).toContain('--cngx-alert-action-color: var(--cngx-alert-icon-color)');
    expect(m3).toContain('--cngx-banner-action-color: var(--cngx-banner-accent)');
    expect(m3).toContain('--cngx-toast-action-color: var(--cngx-toast-accent)');
  });

  it('does not resurrect the dead dismiss families', () => {
    for (const name of bridgeTokenNames()) {
      expect(name).not.toMatch(/-dismiss-/);
    }
  });
});

describe('feedback Material bridge placement', () => {
  // Each family carries inherits:false tokens read on inner elements
  // (spinner track, progress track/label, alert icon/title, toast rows,
  // banner rows/actions); theme() must broadcast to host + descendants
  // (select-theme precedent) or the bridge values resolve to the
  // initial-value at the read sites.
  const BROADCAST_HOSTS = [
    '.cngx-loading-indicator',
    '.cngx-loading-overlay',
    '.cngx-progress',
    '.cngx-alert',
    '.cngx-toast-outlet',
    '.cngx-alert-stack',
    '.cngx-banner-outlet',
  ];

  it('broadcasts every family block to host + descendants', () => {
    const css = compiledTheme();
    for (const host of BROADCAST_HOSTS) {
      expect(css).toMatch(new RegExp(`:where\\(\\${host}, \\${host} \\*\\)\\s*\\{`));
    }
  });
});
