import { InjectionToken } from '@angular/core';

/**
 * Default cap for the `<cngx-tab-overflow>` anchor-retry loop run by
 * `[cngxMatTabs]` via `createDomAnchorRetry`. The retry runs on every
 * `afterNextRender` until `.mat-mdc-tab-header` materialises in the
 * subtree, and the cap exists so a never-rendered host does not
 * re-arm forever (e.g. `<mat-tab-group>` gated behind a `*ngIf` /
 * `@defer` block that never resolves true).
 *
 * `5` was chosen empirically: well above normal Material render lag
 * (a single `afterNextRender` is enough on every supported version),
 * low enough to surface a dev-mode `console.warn` promptly when the
 * host DOM never appears. Same value the
 * `<cngx-tab-overflow>` strip-attach loop uses for its rAF retry so
 * the two cngx-side retries share an upper bound.
 *
 * Override via `providers` / `viewProviders` to tune for a specific
 * Material version's render budget, a heavily deferred host, or test
 * environments where no retries are desired.
 *
 * @internal — exposed only to support the {@link
 * CNGX_MAT_TABS_ANCHOR_MAX_ATTEMPTS} token's default factory; consumers
 * should not import this constant directly.
 */
export const CNGX_MAT_TABS_ANCHOR_MAX_ATTEMPTS_DEFAULT = 5;

/**
 * DI token controlling the `[cngxMatTabs]` overflow-anchor retry cap.
 * The directive's constructor reads this token once and threads the
 * resolved value into `createDomAnchorRetry`'s `maxAttempts` plus the
 * dev-mode `onGiveUp` warning. Default is
 * {@link CNGX_MAT_TABS_ANCHOR_MAX_ATTEMPTS_DEFAULT} (`5`); override
 * via `providers` / `viewProviders` to expand the budget for a slow
 * Material version, tighten it in tests, or zero it out for a host
 * that is known to render synchronously.
 *
 * Symmetrical to {@link
 * https://cngx.dev/api/CNGX_MAT_TAB_HALF_WIRED_SLOT_SINK
 * `CNGX_MAT_TAB_HALF_WIRED_SLOT_SINK`} — both expose a previously
 * hardcoded `[cngxMatTabs]` knob through a token swap so production
 * consumers never need to fork the directive.
 *
 * @category interactive
 */
export const CNGX_MAT_TABS_ANCHOR_MAX_ATTEMPTS = new InjectionToken<number>(
  'CNGX_MAT_TABS_ANCHOR_MAX_ATTEMPTS',
  {
    providedIn: 'root',
    factory: () => CNGX_MAT_TABS_ANCHOR_MAX_ATTEMPTS_DEFAULT,
  },
);
