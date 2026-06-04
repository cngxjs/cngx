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
 * stepper headers, future scrolling lists). Tracks `activeId` and
 * scrolls the matching `[id="<itemId>-header"]` into view.
 *
 * The DOM call sits in `untracked()` (only `activeId` is tracked).
 * `scrollIntoView` is missing in jsdom - guarded with optional chain.
 *
 * @category common/tabs/scroll-sync
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
 * DI token for the active-item scroll-into-view policy. Defaults to
 * {@link createOrganismScrollSync}. Override for instant scroll,
 * custom selector, telemetry, or `prefers-reduced-motion` opt-out.
 * Sibling to `CNGX_DOM_ANCHOR_RETRY_FACTORY` and
 * `CNGX_OVERFLOW_POPOVER_HIGHLIGHT_FACTORY`.
 *
 * @category common/tabs/scroll-sync
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/tabs/scroll-sync/organism-scroll-sync.ts
 * @since 0.1.0
 */
export const CNGX_ORGANISM_SCROLL_SYNC_FACTORY = new InjectionToken<CngxOrganismScrollSyncFactory>(
  'CngxOrganismScrollSyncFactory',
  {
    providedIn: 'root',
    factory: () => createOrganismScrollSync,
  },
);
