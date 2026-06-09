import { InjectionToken, type Signal } from '@angular/core';

import type { CngxTabsCommitAction } from './presenter.directive';

/**
 * Source supplied through {@link CNGX_TABS_COMMIT_ACTION}. A sync
 * directive (e.g. `[cngxTabsRouteSync]`) provides one so the presenter
 * picks up a commit-action without the consumer hand-binding
 * `[commitAction]`. Carries `mode` alongside `action` so the routed
 * path can pin pessimistic - the active tab must follow the *resolved*
 * route, and a stray `[commitMode]="'optimistic'"` must not override
 * that invariant.
 *
 * @category common/tabs
 */
export interface CngxTabsCommitActionSource {
  readonly action: Signal<CngxTabsCommitAction | null>;
  readonly mode: Signal<'optimistic' | 'pessimistic'>;
}

/**
 * DI fallback the presenter reads when its `[commitAction]` input is
 * unbound. Directives compose via DI tokens, not by hand-binding
 * another directive's input (Pillar 3). When a source is present and
 * exposes a non-null `action()`, its `mode()` wins over the
 * `[commitMode]` input.
 *
 * @category common/tabs
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/tabs/commit-action.token.ts
 * @since 0.1.0
 */
export const CNGX_TABS_COMMIT_ACTION = new InjectionToken<CngxTabsCommitActionSource>(
  'CngxTabsCommitAction',
);
