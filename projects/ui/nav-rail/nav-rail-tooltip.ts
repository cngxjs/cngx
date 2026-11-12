import {
  DestroyRef,
  ElementRef,
  effect,
  inject,
  InjectionToken,
  Renderer2,
  type Signal,
  untracked,
} from '@angular/core';
import { nextUid } from '@cngx/core/utils';

import { injectNavRailConfig } from './config/inject-nav-rail-config';
import { CNGX_NAV_RAIL_DEFAULTS } from './config/nav-rail.config.defaults';
import type { CngxNavRailSide } from './nav-rail';

const ROW_SELECTOR = '.cngx-nav-link, .cngx-nav-group';

/**
 * A row the rail leaves alone: one inside a group content (the flyout shows
 * it at full width), an open group head (its flyout sits where the tooltip
 * would), or a row that is described by a tooltip of its own (`[cngxTooltip]`).
 */
function skipsTooltip(row: HTMLElement): boolean {
  if (row.closest('.cngx-nav-group-content')) {
    return true;
  }
  if (row.getAttribute('aria-expanded') === 'true') {
    return true;
  }
  const describedBy = row.getAttribute('aria-describedby')?.split(/\s+/) ?? [];
  return describedBy.some(
    (id) => id && row.ownerDocument.getElementById(id)?.getAttribute('role') === 'tooltip',
  );
}

/**
 * The visible label of a nav row: its own text without the icon, the letter
 * fallback, a badge or a badge's visually hidden spoken text. An explicit
 * `aria-label` wins.
 */
function rowLabel(row: HTMLElement): string {
  const explicit = row.getAttribute('aria-label');
  if (explicit) {
    return explicit.trim();
  }
  let text = '';
  for (const node of Array.from(row.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent ?? '';
      continue;
    }
    if (!(node instanceof HTMLElement)) {
      continue;
    }
    const decorative =
      node.getAttribute('aria-hidden') === 'true' ||
      node.classList.contains('cngx-nav-icon') ||
      node.classList.contains('cngx-nav-badge') ||
      node.classList.contains('cngx-sr-only');
    if (!decorative) {
      text += node.textContent ?? '';
    }
  }
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Shows the clipped label of a nav row in a tooltip while a navigation rail
 * is collapsed. Call it in the constructor of the organism that hosts the
 * rows (today `cngx-nav-rail`) and pass a derived signal that is `true`
 * while the rows are railed and the tooltip is wanted. While it is `false`
 * no tooltip element exists and no listener is attached; each flip sets the
 * tooltip up or tears it down, so an organism can switch it off at runtime
 * (`cngx-nav-rail` folds its `tooltip` input in).
 *
 * One tooltip element per host, created like the one of `CngxTooltip`
 * (`popover="manual"`, class `cngx-tooltip`, so the skin is
 * `cngx-tooltip.css`). Event delegation on the host finds the row under the
 * pointer or focus, so projected rows need no directive of their own.
 * Keyboard focus shows the tooltip at once, the pointer after a dwell (300ms,
 * set app-wide through `withNavRailTooltipDelay`); leaving the row, blur, a
 * click, Escape and the rail opening hide it. Rows inside a group content, an
 * open group head and rows with a `[cngxTooltip]` of their own get no rail
 * tooltip. The tooltip opens away from `side`: at the inline end of the row,
 * or at its inline start for an end-side rail, through CSS anchor positioning
 * (`anchor-name` on the row, `data-cngx-rail-side` on the tooltip;
 * `nav-rail.css`, the stylesheet of `cngx-nav-rail`, places it with the
 * `--cngx-nav-tooltip-offset` gap). It follows the row, mirrors under
 * `dir="rtl"` and flips to the other side when the viewport has no room. The
 * side is read on each show, so a flip applies from the next one. A browser without CSS anchor
 * positioning shows it at the top-layer default position.
 *
 * The row label is already the row's accessible name, so the tooltip is
 * `aria-hidden`: it repeats the name for sighted users and is never
 * announced twice.
 *
 * ```typescript
 * export class MyRail {
 *   readonly collapsed = input(false);
 *   readonly side = input<'start' | 'end'>('start');
 *   constructor() {
 *     injectNavRailTooltip(this.collapsed, this.side);
 *   }
 * }
 * ```
 *
 * @param railed `true` while the rows are railed, their labels clipped and the tooltip wanted.
 * @param side The edge the rows sit on; the tooltip opens away from it.
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/nav-rail/nav-rail-tooltip.ts
 * @since 0.3.0
 * @relatedTo injectNavRailFlyout, withNavRailTooltipDelay, withNavRailTooltip, CngxNavLink, CngxNavGroup, CngxTooltip
 */
export function injectNavRailTooltip(railed: Signal<boolean>, side: Signal<CngxNavRailSide>): void {
  const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  const renderer = inject(Renderer2);
  const hoverDelay = injectNavRailConfig().tooltipDelay ?? CNGX_NAV_RAIL_DEFAULTS.tooltipDelay;
  let detach: (() => void) | null = null;

  effect(() => {
    const active = railed();
    untracked(() => {
      if (active && !detach) {
        detach = attachNavRailTooltip(host, renderer, hoverDelay, side);
        return;
      }
      if (!active && detach) {
        detach();
        detach = null;
      }
    });
  });

  inject(DestroyRef).onDestroy(() => {
    detach?.();
    detach = null;
  });
}

/** Creates the tooltip element and its listeners; returns the teardown. */
function attachNavRailTooltip(
  host: HTMLElement,
  renderer: Renderer2,
  hoverDelay: number,
  side: Signal<CngxNavRailSide>,
): () => void {
  const doc = host.ownerDocument;
  const anchorName = `--${nextUid('cngx-nav-rail-tip')}`;

  const tip = renderer.createElement('div') as HTMLElement;
  tip.setAttribute('popover', 'manual');
  tip.setAttribute('role', 'tooltip');
  tip.setAttribute('aria-hidden', 'true');
  tip.classList.add('cngx-tooltip', 'cngx-nav-rail-tooltip');
  tip.style.setProperty('position-anchor', anchorName);
  renderer.appendChild(host, tip);

  let anchored: HTMLElement | null = null;
  let open = false;
  // The row a click dismissed the tooltip on: hover stays quiet on it until
  // the pointer leaves the row.
  let dismissed: HTMLElement | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  function clearTimer(): void {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function onEscape(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      hide();
    }
  }

  function hide(): void {
    clearTimer();
    anchored?.style.removeProperty('anchor-name');
    anchored = null;
    if (!open) {
      return;
    }
    open = false;
    doc.removeEventListener('keydown', onEscape, true);
    try {
      tip.hidePopover();
    } catch {
      // Already hidden or disconnected.
    }
  }

  function show(row: HTMLElement): void {
    clearTimer();
    const label = rowLabel(row);
    if (!label || typeof tip.showPopover !== 'function') {
      return;
    }
    anchored?.style.removeProperty('anchor-name');
    anchored = row;
    row.style.setProperty('anchor-name', anchorName);
    tip.textContent = label;
    // Plain read: an event handler, so a side flip applies on the next show.
    tip.setAttribute('data-cngx-rail-side', side());
    if (open) {
      return;
    }
    open = true;
    tip.showPopover();
    doc.addEventListener('keydown', onEscape, true);
  }

  const rowOf = (target: EventTarget | null): HTMLElement | null => {
    if (!(target instanceof Element)) {
      return null;
    }
    const row = target.closest<HTMLElement>(ROW_SELECTOR);
    return row && host.contains(row) && !skipsTooltip(row) ? row : null;
  };

  const unlisten = [
    // Keyboard focus only: a pointer press focuses the row too, and showing
    // there would flash the tooltip until the click hides it again.
    renderer.listen(host, 'focusin', (event: FocusEvent) => {
      const row = rowOf(event.target);
      if (row?.matches(':focus-visible')) {
        show(row);
      }
    }),
    renderer.listen(host, 'focusout', () => hide()),
    // Activating a row (a group head opening its flyout) dismisses the tooltip.
    renderer.listen(host, 'click', (event: MouseEvent) => {
      dismissed = rowOf(event.target);
      hide();
    }),
    renderer.listen(host, 'pointerover', (event: PointerEvent) => {
      const row = rowOf(event.target);
      if (!row || row === anchored || row === dismissed) {
        return;
      }
      clearTimer();
      timer = setTimeout(() => show(row), hoverDelay);
    }),
    renderer.listen(host, 'pointerout', (event: PointerEvent) => {
      const row = rowOf(event.target);
      if (row?.contains(event.relatedTarget as Node | null)) {
        return;
      }
      dismissed = null;
      hide();
    }),
  ];

  return () => {
    hide();
    for (const stop of unlisten) {
      stop();
    }
    tip.remove();
  };
}

/** The shape an override of {@link CNGX_NAV_RAIL_TOOLTIP_FACTORY} must match. */
export type CngxNavRailTooltipFactory = (
  railed: Signal<boolean>,
  side: Signal<CngxNavRailSide>,
) => void;

/**
 * Swap token for the rail's label tooltip. The default resolves to
 * {@link injectNavRailTooltip}; `cngx-nav-rail` calls
 * `inject(CNGX_NAV_RAIL_TOOLTIP_FACTORY)(active, side)` in its constructor, so an
 * override runs in the rail's injection context and may inject what it needs
 * (`ElementRef`, `Renderer2`, `CngxTooltip` infrastructure). Provide
 * `() => {}` to drop the tooltip machinery entirely.
 *
 * `active` already folds in the look and the `[tooltip]` / `withNavRailTooltip`
 * switch: it is `true` only in the `'end'` look with the tooltip on, so an
 * override honours the switch by reading it.
 *
 * ```ts
 * providers: [{ provide: CNGX_NAV_RAIL_TOOLTIP_FACTORY, useValue: () => {} }];
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/nav-rail/nav-rail-tooltip.ts
 * @since 0.3.0
 * @relatedTo injectNavRailTooltip, CngxNavRail, CNGX_NAV_RAIL_FLYOUT_FACTORY
 */
export const CNGX_NAV_RAIL_TOOLTIP_FACTORY = new InjectionToken<CngxNavRailTooltipFactory>(
  'CngxNavRailTooltipFactory',
  { providedIn: 'root', factory: () => injectNavRailTooltip },
);
