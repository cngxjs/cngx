import {
  afterRenderEffect,
  DestroyRef,
  DOCUMENT,
  effect,
  type ElementRef,
  inject,
  type Signal,
  untracked,
} from '@angular/core';
import type { CngxNavGroup, CngxNavGroupContent } from '@cngx/common/interactive';
import { nextUid } from '@cngx/core/utils';

/**
 * The nav groups and group contents an organism projects, as its content
 * queries return them: once as instances, once as host elements, in the
 * same order.
 */
export interface CngxNavRailFlyoutSources {
  /** `true` while the rows are railed. */
  readonly railed: Signal<boolean>;
  readonly groups: Signal<readonly CngxNavGroup[]>;
  readonly groupElements: Signal<readonly ElementRef<HTMLElement>[]>;
  readonly contents: Signal<readonly CngxNavGroupContent[]>;
  readonly contentElements: Signal<readonly ElementRef<HTMLElement>[]>;
}

interface FlyoutPair {
  readonly group: CngxNavGroup;
  readonly head: HTMLElement;
  readonly content: HTMLElement;
}

/**
 * Shows an open nav group as a flyout beside its head while the rows are
 * railed. Call it in the constructor of the organism that projects the rows
 * and pass its content queries for `CngxNavGroup` and `CngxNavGroupContent`
 * (instances and host elements).
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
 * inline again in its current state. Escape and a press outside the head and
 * the flyout close the group; Escape moves focus to the head, and a close
 * with focus inside the flyout hands focus to the head through
 * `CngxNavGroupContent`. An open flyout closes when the host turns `inert`
 * (a page-modal overlay opening over the rail).
 *
 * ```typescript
 * export class MyRail {
 *   private readonly groups = contentChildren(CngxNavGroup, { descendants: true });
 *   private readonly groupElements = contentChildren(CngxNavGroup, {
 *     descendants: true,
 *     read: ElementRef,
 *   });
 *   private readonly contents = contentChildren(CngxNavGroupContent, { descendants: true });
 *   private readonly contentElements = contentChildren(CngxNavGroupContent, {
 *     descendants: true,
 *     read: ElementRef,
 *   });
 *   constructor() {
 *     injectNavRailFlyout({
 *       railed: signal(true),
 *       groups: this.groups,
 *       groupElements: this.groupElements,
 *       contents: this.contents,
 *       contentElements: this.contentElements,
 *     });
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
  const anchorPrefix = `--${nextUid('cngx-nav-flyout')}`;
  let shown: readonly FlyoutPair[] = [];
  let inertObserver: MutationObserver | null = null;

  function pairs(): readonly FlyoutPair[] {
    const groups = sources.groups();
    const heads = sources.groupElements();
    const contents = sources.contents();
    const contentEls = sources.contentElements();
    const result: FlyoutPair[] = [];
    contents.forEach((content, i) => {
      const group = content.group();
      const head = heads[groups.indexOf(group)]?.nativeElement;
      const el = contentEls[i]?.nativeElement;
      if (head && el) {
        result.push({ group, head, content: el });
      }
    });
    return result;
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

  function closeAll({ focusHead }: { focusHead: boolean }): void {
    for (const pair of shown) {
      if (!isOpen(pair.content)) {
        continue;
      }
      pair.group.disclosure.close();
      if (focusHead) {
        pair.group.focus({ preventScroll: true });
      }
    }
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || !shown.some((pair) => isOpen(pair.content))) {
      return;
    }
    event.stopPropagation();
    closeAll({ focusHead: true });
  }

  function onPointerdown(event: PointerEvent): void {
    const target = event.target as Node | null;
    const inside = shown.some(
      (pair) =>
        isOpen(pair.content) && (pair.head.contains(target) || pair.content.contains(target)),
    );
    if (!inside) {
      closeAll({ focusHead: false });
    }
  }

  function watchDocument(active: boolean): void {
    if (active && !inertObserver) {
      doc.addEventListener('keydown', onKeydown, true);
      doc.addEventListener('pointerdown', onPointerdown, true);
      if (typeof MutationObserver === 'function') {
        inertObserver = new MutationObserver(() => {
          if (shown.some((pair) => pair.head.closest('[inert]'))) {
            closeAll({ focusHead: false });
          }
        });
        inertObserver.observe(doc.documentElement, {
          attributes: true,
          attributeFilter: ['inert'],
          subtree: true,
        });
      }
      return;
    }
    if (!active && inertObserver) {
      doc.removeEventListener('keydown', onKeydown, true);
      doc.removeEventListener('pointerdown', onPointerdown, true);
      inertObserver.disconnect();
      inertObserver = null;
    }
  }

  function release(pair: FlyoutPair): void {
    hideFlyout(pair);
    pair.content.removeAttribute('popover');
    pair.content.style.removeProperty('position-anchor');
    pair.head.style.removeProperty('anchor-name');
  }

  // Entering the rail closes every open group, so none pops up on its own.
  let wasRailed = false;
  effect(() => {
    const railed = sources.railed();
    const entered = railed && !wasRailed;
    wasRailed = railed;
    if (entered) {
      untracked(() => {
        for (const group of sources.groups()) {
          group.disclosure.close();
        }
      });
    }
  });

  // Popover wiring and open state, derived from railed and each disclosure.
  // After render: the group contents' inputs are bound only then.
  afterRenderEffect(() => {
    const railed = sources.railed();
    const current = pairs();
    const opened = current.map((pair) => pair.group.disclosure.opened());
    untracked(() => {
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
