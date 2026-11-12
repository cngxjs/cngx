import {
  afterRenderEffect,
  DestroyRef,
  DOCUMENT,
  inject,
  Renderer2,
  type Signal,
  untracked,
} from '@angular/core';
import type { CngxNavGroup, CngxNavGroupContent } from '@cngx/common/interactive';
import { nextUid } from '@cngx/core/utils';

/** What `injectNavRailFlyout` reads from the organism that projects the rows. */
export interface CngxNavRailFlyoutSources {
  /** `true` while the rows are railed. */
  readonly railed: Signal<boolean>;
  /** The projected group contents; each one names its head through `group()`. */
  readonly contents: Signal<readonly CngxNavGroupContent[]>;
}

interface FlyoutPair {
  readonly group: CngxNavGroup;
  readonly head: HTMLElement;
  readonly content: HTMLElement;
}

/**
 * Shows an open nav group as a flyout beside its head while the rows are
 * railed. Call it in the constructor of the organism that projects the rows
 * and pass its content query for `CngxNavGroupContent`; each content names
 * its group head, so nothing is paired by index.
 *
 * While railed, each `cngxNavGroupContent` becomes a native
 * `popover="manual"` anchored to its group head (`anchor-name` /
 * `position-anchor`); `cngx-nav.css` draws the surface
 * (`.cngx-nav-group-content:popover-open`) at the inline end of the head.
 * The flyout is open exactly while the group's `disclosure.opened()` is, so
 * `aria-expanded` on the head stays the one source of state. It is a
 * disclosure, not a menu: the links keep their link role and Tab walks
 * them in DOM order.
 *
 * Entering the rail closes open groups (an open group would otherwise pop up
 * as a flyout on its own); leaving it hides the flyout and the group shows
 * inline again in its current state. Escape on the head or inside the flyout
 * closes the group and moves focus to the head; Escape anywhere else is left
 * alone. Focus moving to an element outside the head and the flyout, and a
 * press outside both, close the group; a close with focus inside the flyout
 * hands focus to the head through `CngxNavGroupContent`. An open flyout
 * closes when the host turns `inert` (a page-modal overlay opening over the
 * rail).
 *
 * ```typescript
 * export class MyRail {
 *   private readonly contents = contentChildren(CngxNavGroupContent, { descendants: true });
 *   constructor() {
 *     injectNavRailFlyout({ railed: signal(true), contents: this.contents });
 *   }
 * }
 * ```
 *
 * @param sources The rail state and the content queries.
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/nav-rail/nav-rail-flyout.ts
 * @since 0.3.0
 * @relatedTo injectNavRailTooltip, CngxNavGroup, CngxNavGroupContent, CngxDisclosure
 */
export function injectNavRailFlyout(sources: CngxNavRailFlyoutSources): void {
  const doc = inject(DOCUMENT);
  const renderer = inject(Renderer2);
  const anchorPrefix = `--${nextUid('cngx-nav-flyout')}`;
  let shown: readonly FlyoutPair[] = [];
  const wired = new Map<HTMLElement, () => void>();
  let inertObserver: MutationObserver | null = null;

  function pairs(): readonly FlyoutPair[] {
    return sources.contents().map((content) => {
      const group = content.group();
      return { group, head: group.element, content: content.element };
    });
  }

  function isOpen(el: HTMLElement): boolean {
    return el.hasAttribute('data-cngx-flyout-open');
  }

  function showFlyout(pair: FlyoutPair): void {
    if (isOpen(pair.content) || typeof pair.content.showPopover !== 'function') {
      return;
    }
    pair.content.setAttribute('data-cngx-flyout-open', '');
    pair.content.showPopover();
  }

  function hideFlyout(pair: FlyoutPair): void {
    if (!isOpen(pair.content)) {
      return;
    }
    pair.content.removeAttribute('data-cngx-flyout-open');
    try {
      pair.content.hidePopover();
    } catch {
      // Already hidden or disconnected.
    }
  }

  function closeAll(): void {
    for (const pair of shown) {
      if (isOpen(pair.content)) {
        pair.group.disclosure.close();
      }
    }
  }

  function onPointerdown(event: PointerEvent): void {
    const target = event.target as Node | null;
    const inside = shown.some(
      (pair) =>
        isOpen(pair.content) && (pair.head.contains(target) || pair.content.contains(target)),
    );
    if (!inside) {
      closeAll();
    }
  }

  // Pointer presses and inert land anywhere, so these two watch the document,
  // and only while a flyout is open.
  function watchDocument(active: boolean): void {
    if (active && !inertObserver) {
      doc.addEventListener('pointerdown', onPointerdown, true);
      inertObserver = new MutationObserver(() => {
        if (shown.some((pair) => pair.head.closest('[inert]'))) {
          closeAll();
        }
      });
      inertObserver.observe(doc.documentElement, {
        attributes: true,
        attributeFilter: ['inert'],
        subtree: true,
      });
      return;
    }
    if (!active && inertObserver) {
      doc.removeEventListener('pointerdown', onPointerdown, true);
      inertObserver.disconnect();
      inertObserver = null;
    }
  }

  // Escape and focus loss belong to the head and its flyout only.
  function wire(pair: FlyoutPair): void {
    if (wired.has(pair.content)) {
      return;
    }
    const within = (node: EventTarget | null): boolean =>
      node instanceof Node && (pair.head.contains(node) || pair.content.contains(node));
    const onKeydown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape' || !isOpen(pair.content)) {
        return;
      }
      event.stopPropagation();
      pair.group.disclosure.close();
      pair.group.focus({ preventScroll: true });
    };
    const onFocusout = (event: FocusEvent): void => {
      // A null target is the window losing focus, not the user leaving.
      if (isOpen(pair.content) && event.relatedTarget && !within(event.relatedTarget)) {
        pair.group.disclosure.close();
      }
    };
    const stops = [pair.head, pair.content].flatMap((el) => [
      renderer.listen(el, 'keydown', onKeydown),
      renderer.listen(el, 'focusout', onFocusout),
    ]);
    wired.set(pair.content, () => {
      for (const stop of stops) {
        stop();
      }
    });
  }

  function release(pair: FlyoutPair): void {
    hideFlyout(pair);
    wired.get(pair.content)?.();
    wired.delete(pair.content);
    pair.content.removeAttribute('popover');
    pair.content.style.removeProperty('position-anchor');
    pair.head.style.removeProperty('anchor-name');
  }

  // Popover wiring and open state, derived from railed and each disclosure.
  // After render: the group contents' inputs are bound only then.
  let wasRailed = false;
  afterRenderEffect(() => {
    const railed = sources.railed();
    const current = pairs();
    const opened = current.map((pair) => pair.group.disclosure.opened());
    // Entering the rail closes every open group, so none pops up on its own.
    const entered = railed && !wasRailed;
    wasRailed = railed;
    untracked(() => {
      if (entered) {
        for (const pair of current) {
          pair.group.disclosure.close();
        }
        opened.fill(false);
      }
      const kept = new Set(current.map((pair) => pair.content));
      for (const pair of shown) {
        if (!kept.has(pair.content)) {
          release(pair);
        }
      }
      shown = current;
      current.forEach((pair, i) => {
        if (!railed) {
          release(pair);
          return;
        }
        const anchor = `${anchorPrefix}-${i}`;
        pair.head.style.setProperty('anchor-name', anchor);
        pair.content.style.setProperty('position-anchor', anchor);
        pair.content.setAttribute('popover', 'manual');
        wire(pair);
        if (opened[i]) {
          showFlyout(pair);
        } else {
          hideFlyout(pair);
        }
      });
      watchDocument(current.some((pair) => isOpen(pair.content)));
    });
  });

  inject(DestroyRef).onDestroy(() => {
    watchDocument(false);
    for (const pair of shown) {
      release(pair);
    }
  });
}
