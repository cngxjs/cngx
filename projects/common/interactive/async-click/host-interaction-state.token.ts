import { InjectionToken, type Signal } from '@angular/core';

/**
 * Interaction state a host component publishes to the directives it
 * co-hosts. A button that renders its own `disabled` as `aria-disabled`
 * provides this so a co-hosted `CngxAsyncClick` folds the same flag into
 * its `aria-disabled` binding and its click guard. Without it both
 * directives bind `aria-disabled` on one element and the later binding
 * wins, so a disabled button with an idle async click would render no
 * `aria-disabled` at all.
 */
export interface CngxHostInteractionState {
  /** `true` while the host is disabled; clicks are swallowed and `aria-disabled` is set. */
  readonly disabled: Signal<boolean>;
  /**
   * `true` while the host shows a run the directive did not start itself
   * (an external async state the host reflects). Folded into `aria-busy`.
   */
  readonly busy?: Signal<boolean>;
  /**
   * Text the directive's live region speaks instead of its own settle
   * announcement, for a host that derives the announcement from more than
   * the directive's runs (labels, an external state). The host reads its
   * copy untracked, so a language switch never re-voices the region.
   */
  readonly announcement?: Signal<string>;
}

/**
 * DI token a host component provides on its own element with its
 * {@link CngxHostInteractionState}. Read by `CngxAsyncClick` with
 * `{ self: true, optional: true }`, so only a directive on the same
 * element sees it.
 *
 * No `providedIn`, no default: an element without a providing host has
 * no extra state to fold in.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/async-click/host-interaction-state.token.ts
 * @since 0.1.0
 * @relatedTo CngxAsyncClick
 * <example-url>http://localhost:4200/#/common/button/button/async-click-busy</example-url>
 */
export const CNGX_HOST_INTERACTION_STATE = new InjectionToken<CngxHostInteractionState>(
  'CngxHostInteractionState',
);
