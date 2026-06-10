import {
  effect,
  InjectionToken,
  type Injector,
  runInInjectionContext,
  type Signal,
  untracked,
} from '@angular/core';

/**
 * Options for {@link createOrganismScrollSync}.
 *
 * @category common/tabs/scroll-sync
 */
export interface CngxOrganismScrollSyncOptions {
  /** Reactive source for the active item id; tracked by the effect. */
  readonly activeId: Signal<string | null>;
  /**
   * Host element containing the per-item buttons. Items must carry
   * `id="${itemId}-header"` - the convention used by
   * `<cngx-tab-group>` and `<cngx-stepper>`.
   */
  readonly hostElement: HTMLElement;
  /**
   * Forwarded to `Element.scrollIntoView`. Default: smooth-center
   * along the inline axis. Override for vertical or instant scroll.
   */
  readonly scrollOptions?: ScrollIntoViewOptions;
  /** Injector for installing the effect. */
  readonly injector: Injector;
}

const DEFAULT_SCROLL_OPTIONS: ScrollIntoViewOptions = {
  behavior: 'smooth',
  block: 'nearest',
  inline: 'center',
};

/**
 * Scroll-into-view effect for any strip-based organism (tabs,
 * stepper headers, future scrolling lists). \
 * Tracks `activeId` and scrolls the matching `[id="<itemId>-header"]` into view.
 *
 * The DOM call sits in `untracked()` (only `activeId` is tracked). \
 * `scrollIntoView` is missing in jsdom - guarded with optional chain.
 *
 * ### UX / a11y
 * - The active tab is never stranded off-screen: when activation moves to
 *   a tab clipped by overflow (keyboard arrow, deep link, programmatic
 *   select), its header scrolls into view, so the focused and selected
 *   tab is always visible (WCAG 2.4.7 Focus Visible).
 * - Pairs with the overflow surface: picking a hidden tab from the "More"
 *   popover scrolls it back into the strip, and the overflow recompute
 *   then self-trims - keyboard navigation and the overflow list stay in
 *   sync.
 * - Motion is overridable for reduced motion: the default is smooth-center
 *   along the inline axis; pass `scrollOptions` (e.g. `behavior: 'auto'`)
 *   to honour `prefers-reduced-motion` or to scroll vertically.
 *
 * ```ts
 * // Install once from the organism's field-init (needs an injection context).
 * createOrganismScrollSync({
 *   activeId: this.presenter.activeId, // Signal<string | null>
 *   hostElement: this.hostElement,     // holds the [id="<tabId>-header"] buttons
 *   injector: this.injector,
 *   // scrollOptions omitted -> smooth-center; override for reduced motion:
 *   // scrollOptions: { behavior: 'auto' },
 * });
 * ```
 *
 * @category common/tabs/scroll-sync
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/tabs/scroll-sync/organism-scroll-sync.ts
 * @since 0.1.0
 * @relatedTo CngxTabGroup, CngxTabOverflow, CNGX_ORGANISM_SCROLL_SYNC_FACTORY
 */
export function createOrganismScrollSync(opts: CngxOrganismScrollSyncOptions): void {
  const { activeId, hostElement, scrollOptions, injector } = opts;
  const resolvedOptions = scrollOptions ?? DEFAULT_SCROLL_OPTIONS;

  runInInjectionContext(injector, () => {
    effect(() => {
      const id = activeId();
      if (!id) {
        return;
      }
      untracked(() => {
        const button = hostElement.querySelector<HTMLElement>(`[id="${id}-header"]`);
        button?.scrollIntoView?.(resolvedOptions);
      });
    });
  });
}

/**
 * Factory signature for {@link CNGX_ORGANISM_SCROLL_SYNC_FACTORY}.
 *
 * @category common/tabs/scroll-sync
 */
export type CngxOrganismScrollSyncFactory = (opts: CngxOrganismScrollSyncOptions) => void;

/**
 * DI token for the active-item scroll-into-view policy. \
 * The default, {@link createOrganismScrollSync}, scrolls the active tab's header into
 * view on every `activeId` change. \
 * Override the whole policy to swap the
 * scroll behaviour, target a different selector, add telemetry, opt out
 * of motion, or disable it entirely.
 *
 * Provided in root with the default factory, so consumers override only
 * when they need to. \
 *
 * Sibling to
 * - `CNGX_DOM_ANCHOR_RETRY_FACTORY` and
 * - `CNGX_OVERFLOW_POPOVER_HIGHLIGHT_FACTORY`.
 *
 * ```ts
 * // Honour prefers-reduced-motion app-wide:
 * providers: [
 *   {
 *     provide: CNGX_ORGANISM_SCROLL_SYNC_FACTORY,
 *     useValue: (opts) =>
 *       createOrganismScrollSync({ ...opts, scrollOptions: { behavior: 'auto' } }),
 *   },
 * ];
 * // Or disable scroll-into-view entirely: useValue: () => {}
 * ```
 *
 * @category common/tabs/scroll-sync
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/tabs/scroll-sync/organism-scroll-sync.ts
 * @since 0.1.0
 * @relatedTo createOrganismScrollSync, CngxOrganismScrollSyncFactory
 */
export const CNGX_ORGANISM_SCROLL_SYNC_FACTORY = new InjectionToken<CngxOrganismScrollSyncFactory>(
  'CngxOrganismScrollSyncFactory',
  {
    providedIn: 'root',
    factory: () => createOrganismScrollSync,
  },
);
