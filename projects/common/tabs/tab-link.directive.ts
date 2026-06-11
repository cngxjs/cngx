import {
  computed,
  DestroyRef,
  Directive,
  inject,
  input,
  type OnInit,
  type Signal,
  signal,
} from '@angular/core';

import { nextUid } from '@cngx/core/utils';

import type { CngxErrorAggregatorContract } from '@cngx/common/interactive';

import { CNGX_TAB_GROUP_HOST, type CngxTabHandle } from './tab-group-host.token';

/**
 * Turns a consumer `<a routerLink>` into a registered {@link CngxTabHandle}
 * inside a {@link CngxTabNav}. Native parallel of {@link CngxMatTabLink}: in a
 * navigation bar the link IS the tab, so this per-anchor directive is the
 * registration seam - symmetric with how `CngxTab` registers each `[cngxTab]`.
 *
 * Carries no rendering and no click handler. Navigation is the native
 * `routerLink` (middle-click, open-in-new-tab and the hover URL all work),
 * gating is the link's own `CanDeactivate`, and the active marker comes from
 * the route: `[cngxTabsRouteSync]` on the nav reflects `NavigationEnd` onto the
 * presenter's `activeId`, which this link matches against its own `id`. There
 * is no `select()` call - invoking it would re-enter the commit path the
 * routed-nav model deliberately keeps dormant.
 *
 * ```html
 * <cngx-tab-nav cngxTabsRouteSync>
 *   <a cngxTabLink id="overview" routerLink="overview">Overview</a>
 *   <a cngxTabLink id="profile" routerLink="profile" [error]="profileInvalid">Profile</a>
 * </cngx-tab-nav>
 * ```
 *
 * @category common/tabs
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/tabs/tab-link.directive.ts
 * @since 0.1.0
 * @relatedTo CngxTabNav, CngxTabsRouteSync, CngxTab, CngxMatTabLink
 */
@Directive({
  selector: '[cngxTabLink]',
  exportAs: 'cngxTabLink',
  standalone: true,
  host: {
    class: 'cngx-tab-nav__link',
    '[attr.aria-current]': "selected() ? 'page' : null",
    '[attr.aria-invalid]': "hasError() ? 'true' : null",
    '[class.cngx-tab-nav__link--active]': 'selected()',
    '[class.cngx-tab-nav__link--error]': 'hasError()',
  },
})
export class CngxTabLink implements OnInit {
  private readonly host = inject(CNGX_TAB_GROUP_HOST, { optional: true });
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Handle id. Set it to the link's route segment so the nav's
   * `[cngxTabsRouteSync]` reflects the active route onto this link via the
   * default `(h) => [h.id]` mapping. Defaults to a fresh uid when route-sync
   * is not used.
   */
  readonly id = input<string>(nextUid('cngx-tab-link-'));
  /** Accessible label fed to the nav's live-region announcer. */
  readonly label = input<string | undefined>(undefined);
  /**
   * Direct error flag for the link - `true` or a non-empty string marks it
   * invalid (the string doubles as the message). Mirrors `CngxTab.error`.
   */
  readonly error = input<string | boolean>(false);
  /** Optional rich error aggregator for the link. */
  readonly errorAggregator = input<CngxErrorAggregatorContract | undefined>(undefined);

  /**
   * Resolved direct-error message: the `[error]` string when non-empty, else
   * `undefined`. Carried onto the registration handle by reference.
   * `computed` over the input - never written.
   */
  private readonly errorMessage: Signal<string | undefined> = computed(() => {
    const value = this.error();
    return typeof value === 'string' && value !== '' ? value : undefined;
  });

  /**
   * Per-link error fold driving `aria-invalid` and the `--error` class.
   * `true` when the direct `[error]` flag is set OR the optional aggregator
   * wants to reveal (`shouldShow()`, so deferred-reveal validation stays
   * silent until revealed). Mirrors `CngxTab.hasError`.
   */
  protected readonly hasError: Signal<boolean> = computed(
    () => {
      const direct = this.error();
      return (
        (direct !== false && direct !== '') ||
        (this.errorAggregator()?.shouldShow?.() ?? false)
      );
    },
    { equal: Object.is },
  );

  /** `true` when the presenter's `activeId` equals this link's id. */
  protected readonly selected: Signal<boolean> = computed(
    () => this.host?.activeId() === this.id(),
    { equal: Object.is },
  );

  constructor() {
    if (!this.host) {
      throw new Error(
        'CngxTabLink: no enclosing CngxTabGroupPresenter found. Wrap the link inside <cngx-tab-nav> (or an element carrying [cngxTabGroup]).',
      );
    }
  }

  ngOnInit(): void {
    // Register in ngOnInit, NOT the constructor: a dynamically-bound `[id]`
    // signal input is not applied until the first change detection, so a
    // constructor read would capture the default auto-id. The handle id is the
    // stable key the nav's route-sync matches the URL segment against.
    const host = this.host!;
    const handle: CngxTabHandle = {
      id: this.id(),
      label: this.label,
      subLabel: signal(undefined),
      disabled: signal(false),
      errorAggregator: this.errorAggregator,
      hasError: this.hasError,
      errorMessage: this.errorMessage,
      closable: signal(undefined),
    };
    host.register(handle);
    this.destroyRef.onDestroy(() => host.unregister(handle.id));
  }
}
