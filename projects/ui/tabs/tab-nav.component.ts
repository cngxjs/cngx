import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  afterNextRender,
  computed,
  inject,
  input,
  linkedSignal,
  signal,
  type Signal,
} from '@angular/core';

import { CngxLiveRegion } from '@cngx/common/a11y';
import {
  CNGX_TAB_GROUP_HOST,
  CNGX_TAB_NAV_HOST,
  CngxTabGroupPresenter,
  injectTabsConfig,
  type CngxTabsSkin,
} from '@cngx/common/tabs';

/**
 * CNGX tab-nav organism. \
 * A `role="navigation"` landmark that wraps consumer-authored
 * `<a cngxTabLink routerLink>` anchors into a tab bar. Native parallel of
 * `[cngxMatTabNav]` in `@cngx/ui/mat-tabs`, and the link-driven sibling of
 * the programmatic `<cngx-tab-group>` tablist: a navigation of natively
 * focusable links is a different WAI-ARIA pattern than an automatic-
 * activation tablist, so it is a separate organism, not a skin flag.
 *
 * Thin shell over {@link CngxTabGroupPresenter} via `hostDirectives` - the
 * registry, `activeIndex`, and `activeId` come from the same brain the
 * tablist organism and the Material bridge compose. There is no keyboard
 * model and no commit gating: links are natural `Tab` stops, `Enter`
 * activates the `routerLink`, and the router runs `CanDeactivate` natively.
 * Add `[cngxTabsRouteSync]` to drive the active link from the route - it
 * reflects `NavigationEnd` onto `activeIndex`; its commit-action stays
 * dormant because nothing here calls `presenter.select()`.
 *
 * `CngxLiveRegion` is mounted as a child `<span>` rather than a host
 * directive: its `role="status"` would clobber the host's `role="navigation"`
 * landmark. Its content is the active link's label (Pillar 2 - the active
 * change is announced).
 *
 * ```html
 * <cngx-tab-nav cngxTabsRouteSync aria-label="Sections">
 *   <a cngxTabLink id="overview" routerLink="overview">Overview</a>
 *   <a cngxTabLink id="profile" routerLink="profile">Profile</a>
 * </cngx-tab-nav>
 * <router-outlet></router-outlet>
 * ```
 *
 * @playground Native router tabs with a CanDeactivate guard ./examples/routed-nav/routed-nav.component.ts
 * @see {@link CngxTabGroup} for the programmatic tablist organism.
 *
 * @category ui/tabs
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/tabs/tab-nav.component.ts
 * @since 0.1.0
 * @relatedTo CngxTabLink, CngxTabsRouteSync, CngxTabGroup, CngxMatTabNav
 */
@Component({
  selector: 'cngx-tab-nav',
  exportAs: 'cngxTabNav',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CngxLiveRegion],
  // Presence-only marker: it tells a stacked [cngxTabsRouteSync] that its
  // links own subtrees, so the URL match is prefix rather than suffix.
  providers: [{ provide: CNGX_TAB_NAV_HOST, useValue: true }],
  styleUrls: ['../../common/tabs/styles/tabs-base.css', './tab-nav.component.css'],
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [
    {
      directive: CngxTabGroupPresenter,
      inputs: ['activeIndex', 'orientation'],
      outputs: ['activeIndexChange'],
    },
  ],
  templateUrl: './tab-nav.component.html',
  host: {
    class: 'cngx-tab-nav',
    role: 'navigation',
    '[attr.data-skin]': 'resolvedSkin()',
    '[attr.data-orientation]': 'presenter.orientation()',
    '[attr.aria-orientation]': 'presenter.orientation()',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-labelledby]': 'ariaLabelledBy()',
  },
})
export class CngxTabNav {
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  readonly ariaLabelledBy = input<string | undefined>(undefined, { alias: 'aria-labelledby' });

  /**
   * Visual skin. Cascade `input ?? config ?? 'line'`, reflected onto
   * `[data-skin]`. Resolved inline (single axis) rather than via
   * `createTabsHostAttrs`: that helper resolves five tablist axes the nav
   * does not use, so pulling it here would fabricate dead inputs - inline
   * resolution is Komposition statt Konfiguration (Pillar 3).
   */
  readonly skin = input<CngxTabsSkin | undefined>(undefined);

  protected readonly presenter = inject(CNGX_TAB_GROUP_HOST);
  private readonly config = injectTabsConfig();

  protected readonly resolvedSkin: Signal<CngxTabsSkin> = computed(
    () => this.skin() ?? this.config.skin ?? 'line',
  );

  /**
   * Whether the polite region is live yet. Stays `false` through the first
   * render and the microtask after it, so a `[cngxTabsRouteSync]` seed does
   * not push the landing section into the region: on a deep link the active
   * link is the page's *initial state*, not a change, and the browser
   * already announces the document. `<cngx-tab-group>` gets this for free
   * by gating its announcement on the commit transition
   * (`createTabGroupAnnouncements`); the nav path is commit-free, so the
   * mount window is the equivalent gate.
   */
  private readonly announcing = signal(false);

  /**
   * `activeId` before the most recent change - the tablist bundle's
   * prior-index tracker, keyed on id. Seeded when the mount window closes
   * rather than at construction, so whatever the seed resolved counts as
   * the starting point instead of as the first announcement.
   */
  private readonly priorActiveId = linkedSignal<string | null, string | null>({
    source: () => this.presenter.activeId(),
    computation: (curr, prev) => prev?.source ?? curr,
    equal: Object.is,
  });

  /**
   * Active link's accessible label, fed to the polite live region. Derived
   * from `activeId` through the registered handle (Pillar 1 - single
   * source, the route-fed active index). Empty while the id is unchanged,
   * so the region stays silent on no-op ticks and at rest.
   */
  protected readonly liveAnnouncement: Signal<string> = computed(() => {
    if (!this.announcing()) {
      return '';
    }
    const id = this.presenter.activeId();
    if (id === null || id === this.priorActiveId()) {
      return '';
    }
    return this.presenter.tabs().find((tab) => tab.id === id)?.label() ?? '';
  });

  constructor() {
    // queueMicrotask rather than the afterNextRender body: every
    // afterNextRender callback for one render runs in a single synchronous
    // batch, so deferring past it makes the gate independent of whether the
    // sync directive registered its seed before or after this one.
    afterNextRender(() => {
      queueMicrotask(() => {
        this.priorActiveId();
        this.announcing.set(true);
      });
    });
  }
}
