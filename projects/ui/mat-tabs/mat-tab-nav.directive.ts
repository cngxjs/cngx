import { DestroyRef, Directive, ElementRef, inject, Injector, Renderer2 } from '@angular/core';

import {
  CNGX_TAB_GROUP_HOST,
  CNGX_TAB_NAV_HOST,
  CngxTabGroupPresenter,
  createTabNavAnnouncement,
  injectTabsI18n,
  type CngxTabGroupHost,
} from '@cngx/common/tabs';

import {
  createMatTabAggregatorDecoration,
  createMatTabRejectionDecoration,
} from './decorations/decoration-projectors';
import { createAggregatedErrorTabs } from './decorations/aggregated-error-tabs';
import { mountLiveRegionAnnouncer } from '../material-bridge/live-region';
import { createRejectionState } from './decorations/rejection-state';

/**
 * Layers the cngx error / rejection / announcement layer onto
 * Material's native router tabs (`<nav mat-tab-nav-bar>` /
 * `<a mat-tab-link>` / `<mat-tab-nav-panel>`). The parallel bridge to
 * {@link CngxMatTabs}: `MatTabNav` has no `MatTab` and no
 * `selectedIndex`, so handles register per `<a mat-tab-link>` via
 * {@link CngxMatTabLink}, and the decoration projectors target
 * `.mat-mdc-tab-link` instead of `.mat-mdc-tab`.
 *
 * Gating is **native**: each link is a `routerLink`, so the router runs
 * `CanDeactivate` directly and this directive installs no
 * commit-action. The active index follows the route - add
 * `[cngxTabsRouteSync]` to the same `<nav>` and give each
 * `[cngxMatTabLink]` an `id` matching its route segment; route-sync
 * reflects `NavigationEnd` onto `activeIndex` (its commit-action stays
 * dormant because link clicks navigate natively, never through
 * `presenter.select`). Ableitung statt Verwaltung - the route-active
 * link is the single source of the active index. `activeIndex` /
 * `activeIndexChange` are forwarded from the presenter hostDirective,
 * so a consumer without route-sync can two-way bind the active link
 * the same way `[cngxMatTabs]` consumers do.
 *
 * Active-link changes speak: the shared nav announcement bundle
 * ({@link createTabNavAnnouncement}) feeds the landing link's label to
 * the shared live announcer - silent through the mount window, so a
 * deep link's initial active state is not announced as a change.
 *
 * Composes {@link CngxTabGroupPresenter} via `hostDirectives` so the
 * `CNGX_STATEFUL` producer, the `lastFailedIndex` rejection slot, and
 * the live-region announcer come for free, identical to the cngx
 * organism (Pillar 2 - same communication across skins).
 *
 * Decoration content-template slots (`*cngxMatTabRejectionContent` /
 * `*cngxMatTabAggregatorContent`) are not forwarded on this bridge yet -
 * the projectors render their built-in `cngx-sr-only` spans. The slot
 * inputs that `[cngxMatTabs]` exposes are a deferred follow-up.
 *
 * @playground Native router tabs with a CanDeactivate guard ./examples/router-nav/router-nav.component.ts
 *
 * @category ui/mat-tabs
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/mat-tabs/mat-tab-nav.directive.ts
 * @since 0.1.0
 * @relatedTo CngxMatTabLink, CngxMatTabs, CngxTabsRouteSync
 */
@Directive({
  selector: '[cngxMatTabNav]',
  exportAs: 'cngxMatTabNav',
  standalone: true,
  // Presence-only marker: it tells a stacked [cngxTabsRouteSync] that its
  // links own subtrees, so the URL match is prefix rather than suffix.
  providers: [{ provide: CNGX_TAB_NAV_HOST, useValue: true }],
  hostDirectives: [
    {
      directive: CngxTabGroupPresenter,
      inputs: ['activeIndex'],
      outputs: ['activeIndexChange'],
    },
  ],
})
export class CngxMatTabNav {
  private readonly presenter = inject<CngxTabGroupHost>(CNGX_TAB_GROUP_HOST);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly renderer = inject(Renderer2);
  private readonly hostEl = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly i18n = injectTabsI18n();

  private readonly rejectionState = createRejectionState(this.presenter, this.i18n);
  private readonly aggregatedErrorTabs = createAggregatedErrorTabs(this.presenter);

  constructor() {
    mountLiveRegionAnnouncer({
      announcement: this.rejectionState.liveAnnouncement,
      injector: this.injector,
    });

    // Active-link landing announcement - same bundle as the cngx-native
    // <cngx-tab-nav>; the shared announcer coalesces both feeds into
    // one polite region.
    mountLiveRegionAnnouncer({
      announcement: createTabNavAnnouncement({
        presenter: this.presenter,
        injector: this.injector,
      }).liveAnnouncement,
      injector: this.injector,
    });

    // Same projector bodies as `[cngxMatTabs]`; only the per-tab element
    // selector differs (`.mat-mdc-tab-link` vs `.mat-mdc-tab`).
    createMatTabRejectionDecoration({
      hostEl: this.hostEl,
      failedHandleId: this.rejectionState.failedHandleId,
      failedIndex: this.presenter.lastFailedIndex,
      descriptorText: this.rejectionState.descriptorText,
      renderer: this.renderer,
      injector: this.injector,
      destroyRef: this.destroyRef,
      originLabel: this.rejectionState.originLabel,
      buttonSelector: '.mat-mdc-tab-link',
    });

    createMatTabAggregatorDecoration({
      hostEl: this.hostEl,
      errorTabs: this.aggregatedErrorTabs,
      renderer: this.renderer,
      injector: this.injector,
      destroyRef: this.destroyRef,
      buttonSelector: '.mat-mdc-tab-link',
    });
  }

  /**
   * Clears `presenter.lastFailedIndex`, dismissing the rejection
   * decoration. Mirrors {@link CngxMatTabs.clearLastFailed} so a
   * template ref (`#nav="cngxMatTabNav"`) is enough.
   */
  clearLastFailed(): void {
    this.presenter.clearLastFailed();
  }
}
