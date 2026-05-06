import {
  effect,
  type Injector,
  runInInjectionContext,
  type Signal,
  untracked,
} from '@angular/core';

/**
 * Options for {@link createOrganismScrollSync}.
 *
 * @category interactive
 */
export interface CngxOrganismScrollSyncOptions {
  /**
   * Reactive source for the active item id. The factory's `effect()`
   * tracks this signal — when it changes, the matching DOM child is
   * scrolled into view (subject to a null guard for unmatched ids).
   */
  readonly activeId: Signal<string | null>;
  /**
   * Host element whose subtree contains the per-item buttons. The
   * factory queries `hostElement.querySelector('[id="<itemId>-header"]')`
   * — i.e. items must carry an id of `${itemId}-header` for the look-up
   * to land. Mirrors the convention used by `<cngx-tab-group>` and
   * `<cngx-stepper>` for their tablist / steplist headers.
   */
  readonly hostElement: HTMLElement;
  /**
   * Forwarded to `Element.scrollIntoView`. Defaults to a smooth-center
   * scroll along the inline axis (matches the existing tab-group
   * organism). Override for vertical layouts or instant scroll.
   */
  readonly scrollOptions?: ScrollIntoViewOptions;
  /** Injector used to install the effect inside an injection context. */
  readonly injector: Injector;
}

const DEFAULT_SCROLL_OPTIONS: ScrollIntoViewOptions = {
  behavior: 'smooth',
  block: 'nearest',
  inline: 'center',
};

/**
 * Self-healing scroll-into-view effect for any organism that
 * surfaces a horizontal/vertical strip of focusable items keyed by id
 * (tabs, stepper headers, future scrolling lists). Tracks an
 * `activeId` signal and brings the matching `[id="<itemId>-header"]`
 * child into view on every change.
 *
 * The DOM call (`scrollIntoView`) lives inside `untracked()` per
 * `reference_signal_architecture` rule 2 — the effect tracks only the
 * `activeId` signal. jsdom does not implement `scrollIntoView`; the
 * factory guards with optional-chaining so unit specs don't blow up
 * (real browsers always have it).
 *
 * Replaces the inline `effect` previously in
 * `<cngx-tab-group>`'s constructor — extracted at Phase 4 of the
 * global-material-bridge plan to thin the organism class body and
 * make the same shape reusable by `<cngx-stepper>` /
 * `<cngx-mat-stepper>` if/when those organisms grow scrolling
 * strips.
 *
 * @category interactive
 */
export function createOrganismScrollSync(
  opts: CngxOrganismScrollSyncOptions,
): void {
  const { activeId, hostElement, scrollOptions, injector } = opts;
  const resolvedOptions = scrollOptions ?? DEFAULT_SCROLL_OPTIONS;

  runInInjectionContext(injector, () => {
    effect(() => {
      const id = activeId();
      if (!id) {
        return;
      }
      untracked(() => {
        const button = hostElement.querySelector<HTMLElement>(
          `[id="${id}-header"]`,
        );
        button?.scrollIntoView?.(resolvedOptions);
      });
    });
  });
}
