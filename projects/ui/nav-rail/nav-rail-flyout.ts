import {
  afterRenderEffect,
  DestroyRef,
  DOCUMENT,
  type ElementRef,
  inject,
  InjectionToken,
  Renderer2,
  type Signal,
  untracked,
} from '@angular/core';
import { nextUid } from '@cngx/core/utils';

import type { CngxNavRailSide } from './nav-rail';

/**
 * A group head the flyout drives: its open state, a way to close it and
 * focus for Escape. `CngxNavGroup` matches it; another disclosure head with
 * the same members joins the flyout without a fork.
 *
 * @since 0.3.0
 */
export interface CngxNavRailFlyoutGroup {
  readonly disclosure: { readonly opened: Signal<boolean>; close(): void };
  focus(options?: FocusOptions): void;
}

/**
 * A group content the flyout shows beside its head; it names that head.
 * `CngxNavGroupContent` matches it.
 *
 * @since 0.3.0
 */
export interface CngxNavRailFlyoutContent {
  readonly group: Signal<CngxNavRailFlyoutGroup>;
}

/**
 * What `injectNavRailFlyout` reads from the organism that projects the rows.
 * Each directive query comes with its `read: ElementRef` twin over the same
 * selector and options, so the two lists hold the same nodes in the same
 * order.
 */
export interface CngxNavRailFlyoutSources {
  /** `true` while the rows are railed. */
  readonly railed: Signal<boolean>;
  /** The edge the rows sit on; the flyout opens away from it. */
  readonly side: Signal<CngxNavRailSide>;
  /** The projected group heads (`CngxNavGroup`). */
  readonly groups: Signal<readonly CngxNavRailFlyoutGroup[]>;
  /** The host elements of `groups`, in the same order. */
  readonly groupElements: Signal<readonly ElementRef<HTMLElement>[]>;
  /** The projected group contents; each one names its head through `group()`. */
  readonly contents: Signal<readonly CngxNavRailFlyoutContent[]>;
  /** The host elements of `contents`, in the same order. */
  readonly contentElements: Signal<readonly ElementRef<HTMLElement>[]>;
}

interface FlyoutPair {
  readonly group: CngxNavRailFlyoutGroup;
  readonly head: HTMLElement;
  readonly content: HTMLElement;
}

/**
 * Shows an open nav group as a flyout beside its head, away from `side`,
 * while the rows are railed. Call it in the constructor of the organism that projects the rows
 * and pass its content queries for `CngxNavGroup` and `CngxNavGroupContent`
 * (or any head and content matching `CngxNavRailFlyoutGroup` and
 * `CngxNavRailFlyoutContent`), each with its `read: ElementRef` twin. A content is paired with its head
 * through `CngxNavGroupContent.group()`, never by position.
 *
 * While railed, each `cngxNavGroupContent` becomes a native
 * `popover="manual"` anchored to its group head (`anchor-name` /
 * `position-anchor`); `cngx-nav.css` draws the surface
 * (`.cngx-nav-group-content:popover-open`) at the inline end of the head, or
 * at its inline start for `side: 'end'` (the content carries
 * `data-cngx-rail-side`).
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
 *       side: signal<CngxNavRailSide>('start'),
 *       groups: this.groups,
 *       groupElements: this.groupElements,
 *       contents: this.contents,
 *       contentElements: this.contentElements,
 *     });
 *   }
 * }
 * ```
 *
 * @param sources The rail state and the group and content queries.
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

  // WHY by index: a directive query and its `read: ElementRef` twin run the
  // same selector over the same view, so entry i of both is the same node.
  // Only that twin pairing is positional; a content finds its head through
  // `group()`.
  function pairs(): readonly FlyoutPair[] {
    const groupElements = sources.groupElements();
    const heads = new Map(
      sources.groups().map((group, i) => [group, groupElements[i]?.nativeElement] as const),
    );
    const contentElements = sources.contentElements();
    return sources.contents().flatMap((content, i) => {
      const group = content.group();
      const head = heads.get(group);
      const element = contentElements[i]?.nativeElement;
      return head && element ? [{ group, head, content: element }] : [];
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
    pair.content.removeAttribute('data-cngx-rail-side');
    pair.content.style.removeProperty('position-anchor');
    pair.head.style.removeProperty('anchor-name');
  }

  // Popover wiring and open state, derived from railed and each disclosure.
  // After render: the group contents' inputs are bound only then.
  let wasRailed = false;
  afterRenderEffect(() => {
    const railed = sources.railed();
    const side = sources.side();
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
        pair.content.setAttribute('data-cngx-rail-side', side);
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

/** The shape an override of {@link CNGX_NAV_RAIL_FLYOUT_FACTORY} must match. */
export type CngxNavRailFlyoutFactory = (sources: CngxNavRailFlyoutSources) => void;

/**
 * Swap token for the rail's group flyout. The default resolves to
 * {@link injectNavRailFlyout}; `cngx-nav-rail` and `cngx-sidenav` call
 * `inject(CNGX_NAV_RAIL_FLYOUT_FACTORY)(sources)` in their constructors, so
 * one override reaches both, runs in the organism's injection context and
 * gets the same group and content queries. Provide `() => {}` to keep groups as plain inline
 * disclosures (a group's content is then clipped by the narrow rail).
 *
 * ```ts
 * providers: [{ provide: CNGX_NAV_RAIL_FLYOUT_FACTORY, useValue: myMenuFlyout }];
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/nav-rail/nav-rail-flyout.ts
 * @since 0.3.0
 * @relatedTo injectNavRailFlyout, CngxNavRail, CNGX_NAV_RAIL_TOOLTIP_FACTORY
 */
export const CNGX_NAV_RAIL_FLYOUT_FACTORY = new InjectionToken<CngxNavRailFlyoutFactory>(
  'CngxNavRailFlyoutFactory',
  { providedIn: 'root', factory: () => injectNavRailFlyout },
);
