import {
  DestroyRef,
  ElementRef,
  effect,
  inject,
  Renderer2,
  type Signal,
  untracked,
} from '@angular/core';
import { nextUid } from '@cngx/core/utils';

/** Pointer dwell before the tooltip shows, like `CngxTooltip`'s default delay. */
const HOVER_DELAY_MS = 300;

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
 * fallback or a badge. An explicit `aria-label` wins.
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
      node.classList.contains('cngx-nav-badge');
    if (!decorative) {
      text += node.textContent ?? '';
    }
  }
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Shows the clipped label of a nav row in a tooltip while a navigation rail
 * is collapsed. Call it in the constructor of the organism that hosts the
 * rows (`cngx-nav-rail`, `cngx-sidenav`) and pass a derived signal that is
 * `true` while the rows are railed; nothing shows while it is `false`.
 *
 * One tooltip element per host, created like the one of `CngxTooltip`
 * (`popover="manual"`, class `cngx-tooltip`, so the skin is
 * `cngx-tooltip.css`). Event delegation on the host finds the row under the
 * pointer or focus, so projected rows need no directive of their own. Focus
 * shows the tooltip at once, the pointer after a 300ms dwell; leaving the
 * row, blur, a click, Escape and the rail opening hide it. Rows inside a
 * group content, an open group head and rows with a `[cngxTooltip]` of their
 * own get no rail tooltip. The tooltip sits at the
 * inline end of the row through CSS anchor positioning (`anchor-name` on the
 * row; `cngx-nav.css` places it at the row's inline end with the
 * `--cngx-nav-tooltip-offset` gap), so it follows the row and mirrors under
 * `dir="rtl"`. A browser without CSS anchor positioning shows it at the
 * top-layer default position.
 *
 * The row label is already the row's accessible name, so the tooltip is
 * `aria-hidden`: it repeats the name for sighted users and is never
 * announced twice.
 *
 * ```typescript
 * export class MyRail {
 *   readonly collapsed = input(false);
 *   constructor() {
 *     injectNavRailTooltip(this.collapsed);
 *   }
 * }
 * ```
 *
 * @param railed `true` while the rows are railed and their labels clipped.
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/nav-rail/nav-rail-tooltip.ts
 * @since 0.3.0
 * @relatedTo injectNavRailFlyout, CngxNavLink, CngxNavGroup, CngxTooltip
 */
export function injectNavRailTooltip(railed: Signal<boolean>): void {
  const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  const renderer = inject(Renderer2);
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
    renderer.listen(host, 'focusin', (event: FocusEvent) => {
      const row = rowOf(event.target);
      if (row && untracked(railed)) {
        show(row);
      }
    }),
    renderer.listen(host, 'focusout', () => hide()),
    // Activating a row (a group head opening its flyout) dismisses the tooltip.
    renderer.listen(host, 'click', () => hide()),
    renderer.listen(host, 'pointerover', (event: PointerEvent) => {
      const row = rowOf(event.target);
      if (!row || row === anchored || !untracked(railed)) {
        return;
      }
      clearTimer();
      timer = setTimeout(() => show(row), HOVER_DELAY_MS);
    }),
    renderer.listen(host, 'pointerout', (event: PointerEvent) => {
      const row = rowOf(event.target);
      if (row?.contains(event.relatedTarget as Node | null)) {
        return;
      }
      hide();
    }),
  ];

  effect(() => {
    if (!railed()) {
      untracked(hide);
    }
  });

  inject(DestroyRef).onDestroy(() => {
    hide();
    for (const stop of unlisten) {
      stop();
    }
    tip.remove();
  });
}
