import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  model,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { matchesKeyCombo, parseKeyCombo } from '@cngx/core/utils';

/** Logical position — flips in RTL. */
export type SidenavPosition = 'start' | 'end';
/**
 * How the sidenav interacts with the content area.
 *
 * - `'over'` — floats above content (overlay + backdrop)
 * - `'push'` — pushes content aside when open
 * - `'side'` — always visible, content permanently offset
 * - `'mini'` — collapsed icon rail (miniWidth), expands to full width on hover
 */
export type SidenavMode = 'over' | 'push' | 'side' | 'mini';

/**
 * Declarative sidebar component that composes drawer, focus trap,
 * scroll lock, swipe dismiss, and media query atoms internally.
 *
 * Supports responsive mode switching, two-way `[(opened)]` binding,
 * and content projection via header/footer slots.
 *
 * Use inside `CngxSidenavLayout` for dual-sidebar support and
 * shared backdrop coordination.
 *
 * @usageNotes
 *
 * ```html
 * <cngx-sidenav-layout>
 *   <cngx-sidenav position="start" [(opened)]="navOpen"
 *                 [responsive]="'(min-width: 1024px)'">
 *     <cngx-sidenav-header>Logo</cngx-sidenav-header>
 *     <a cngxNavLink [active]="true">Dashboard</a>
 *     <cngx-sidenav-footer>v1.0</cngx-sidenav-footer>
 *   </cngx-sidenav>
 *   <cngx-sidenav-content>
 *     <router-outlet />
 *   </cngx-sidenav-content>
 * </cngx-sidenav-layout>
 * ```
 *
 * @category layout
 */
@Component({
  selector: 'cngx-sidenav',
  exportAs: 'cngxSidenav',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class.cngx-sidenav]': 'true',
    '[class.cngx-sidenav--start]': "position() === 'start'",
    '[class.cngx-sidenav--end]': "position() === 'end'",
    '[class.cngx-sidenav--open]': 'opened()',
    '[class.cngx-sidenav--over]': "effectiveMode() === 'over'",
    '[class.cngx-sidenav--push]': "effectiveMode() === 'push'",
    '[class.cngx-sidenav--side]': "effectiveMode() === 'side'",
    '[class.cngx-sidenav--mini]': "effectiveMode() === 'mini'",
    '[class.cngx-sidenav--expanded]': 'expanded()',
    '[class.cngx-sidenav--resizable]': 'resizable()',
    '[class.cngx-sidenav--resizing]': 'resizing()',
    '[attr.aria-hidden]':
      "effectiveMode() === 'side' || effectiveMode() === 'mini' ? null : !opened()",
    '[style.--cngx-sidenav-width]': 'effectiveWidth()',
    '[style.--cngx-sidenav-mini-width]': 'miniWidth()',
    role: 'complementary',
    '[attr.aria-label]': 'ariaLabel() || null',
    '(keydown.escape)': 'closeIfOverlay()',
    '(mouseenter)': 'handleMouseEnter()',
    '(mouseleave)': 'handleMouseLeave()',
  },
  template: `
    <ng-content select="cngx-sidenav-header, [cngxSidenavHeader]" />
    <div class="cngx-sidenav__body">
      <ng-content />
    </div>
    <ng-content select="cngx-sidenav-footer, [cngxSidenavFooter]" />
    @if (resizable()) {
      <div
        class="cngx-sidenav__resize-handle"
        (pointerdown)="handleResizeStart($event)"
        role="separator"
        [attr.aria-orientation]="'vertical'"
        [attr.aria-valuenow]="widthPx()"
        [attr.aria-valuemin]="minWidthPx()"
        [attr.aria-valuemax]="maxWidthPx()"
      ></div>
    }
  `,
})
export class CngxSidenav {
  /** Logical position: `'start'` (default left in LTR) or `'end'` (right in LTR). */
  readonly position = input<SidenavPosition>('start');

  /** Accessible label for the complementary landmark. */
  readonly ariaLabel = input<string | undefined>(undefined);

  /** Drawer mode. Overridden by `responsive` when set. */
  readonly mode = input<SidenavMode>('over');

  /**
   * CSS media query string for responsive mode switching.
   * When the query matches, mode becomes `'side'` (permanent).
   * When it doesn't match, mode becomes `'over'` (overlay).
   */
  readonly responsive = input<string | undefined>(undefined);

  /** Width of the sidenav panel. Supports two-way `[(width)]` for resize. */
  readonly width = model<string>('280px');

  /** Width of the collapsed rail in `mini` mode. Any CSS value. */
  readonly miniWidth = input<string>('56px');

  /** Whether hovering the mini rail expands the sidenav to full width. */
  readonly expandOnHover = input<boolean>(true);

  /** Whether the sidebar is user-resizable via a drag handle. */
  readonly resizable = input<boolean>(false);

  /** Minimum width constraint during resize. */
  readonly minWidth = input<string>('120px');

  /** Maximum width constraint during resize. */
  readonly maxWidth = input<string>('600px');

  /**
   * Keyboard shortcut to toggle the sidenav, e.g. `'ctrl+b'` or `'meta+b'`.
   * Uses `ctrl` on Windows/Linux and `meta` (Cmd) on macOS automatically
   * when `'mod+<key>'` syntax is used.
   */
  readonly shortcut = input<string | undefined>(undefined);

  /** Whether a resize drag is in progress. */
  private readonly resizingState = signal(false);
  readonly resizing = this.resizingState.asReadonly();

  /** Two-way opened state. Supports `[(opened)]="signal"`. */
  readonly opened = model<boolean>(false);

  /** Whether the mini-mode rail is currently expanded (hover or programmatic). */
  private readonly expandedState = signal(false);
  readonly expanded = this.expandedState.asReadonly();

  /** @internal Reference to host element for layout positioning. */
  readonly elementRef = inject(ElementRef<HTMLElement>);

  // ── Responsive media query (inlined, not CngxMediaQuery directive) ──
  private readonly mediaMatches = signal(false);

  /** Resolved mode — responsive overrides to `'side'` when matching, falls back to `mode()`. */
  readonly effectiveMode = computed<SidenavMode>(() => {
    if (!this.responsive()) {
      return this.mode();
    }
    return this.mediaMatches() ? 'side' : this.mode();
  });

  /** Whether this sidenav is in overlay mode (over). */
  readonly isOverlay = computed(() => this.effectiveMode() === 'over');

  /** Resolved width — mini mode uses miniWidth unless expanded. */
  readonly effectiveWidth = computed(() => {
    if (this.effectiveMode() === 'mini' && !this.expandedState()) {
      return this.miniWidth();
    }
    return this.width();
  });

  private readonly doc = inject(DOCUMENT);
  private readonly win = this.doc.defaultView;

  /** Tracks the previous effective mode to detect transitions. */
  private readonly prevMode = signal<SidenavMode | undefined>(undefined);

  constructor() {
    // Wire responsive matchMedia
    effect((onCleanup) => {
      const query = this.responsive();
      const win = this.win;
      if (!query || !win) {
        return;
      }
      const mql = win.matchMedia(query);
      this.mediaMatches.set(mql.matches);
      const handler = (e: MediaQueryListEvent): void => this.mediaMatches.set(e.matches);
      mql.addEventListener('change', handler);
      onCleanup(() => mql.removeEventListener('change', handler));
    });

    // Keyboard shortcut toggle.
    // Uses document.addEventListener instead of a host listener because:
    // 1. The shortcut is a global hotkey — it must fire regardless of focus.
    // 2. The combo string is a signal that can change at runtime, so the
    //    listener must be torn down and re-registered on each change.
    // 3. Angular host listeners don't support dynamic registration/teardown
    //    driven by signal values — effect(onCleanup) handles this cleanly.
    const isMac = this.win?.navigator?.userAgent?.includes('Mac') ?? false;
    effect((onCleanup) => {
      const shortcut = this.shortcut();
      if (!shortcut) {
        return;
      }
      const combo = parseKeyCombo(shortcut);
      const handler = (e: KeyboardEvent): void => {
        if (matchesKeyCombo(e, combo, isMac)) {
          e.preventDefault();
          this.opened.set(!this.opened());
        }
      };
      this.doc.addEventListener('keydown', handler);
      onCleanup(() => this.doc.removeEventListener('keydown', handler));
    });

    // Sync opened state on mode transitions.
    // prevMode is a plain signal updated at the end of each run so the
    // effect can compare previous vs current mode without linkedSignal
    // (which updates eagerly before the effect reads it).
    effect(() => {
      const mode = this.effectiveMode();
      const prev = this.prevMode();
      if (prev !== undefined) {
        const alwaysVisible = (m: SidenavMode) => m === 'side' || m === 'mini';
        if (alwaysVisible(prev) && !alwaysVisible(mode)) {
          this.opened.set(true);
        }
        if (prev === 'mini' && mode !== 'mini') {
          this.expandedState.set(false);
        }
      }
      this.prevMode.set(mode);
    });
  }

  /** Opens the sidenav. */
  open(): void {
    this.opened.set(true);
  }

  /** Closes the sidenav (only in over/push mode). No-op in side/mini mode. */
  close(): void {
    const mode = this.effectiveMode();
    if (mode !== 'side' && mode !== 'mini') {
      this.opened.set(false);
    }
  }

  /** Toggles the sidenav. */
  toggle(): void {
    if (this.opened()) {
      this.close();
    } else {
      this.open();
    }
  }

  /** @internal Close only if in overlay mode (for Escape key, click-outside). */
  closeIfOverlay(): void {
    if (this.isOverlay()) {
      this.close();
    }
  }

  /** Expand the mini rail to full width. */
  expand(): void {
    this.expandedState.set(true);
  }

  /** Collapse the expanded mini rail back to miniWidth. */
  collapse(): void {
    this.expandedState.set(false);
  }

  /** @internal */
  handleMouseEnter(): void {
    if (this.effectiveMode() === 'mini' && this.expandOnHover()) {
      this.expandedState.set(true);
    }
  }

  /** @internal */
  handleMouseLeave(): void {
    if (this.effectiveMode() === 'mini') {
      this.expandedState.set(false);
    }
  }

  // ── Resize ──────────────────────────────────────────────────────

  /** @internal Parse a CSS px value to a number. */
  widthPx = computed(() => Number.parseInt(this.width(), 10) || 280);
  minWidthPx = computed(() => Number.parseInt(this.minWidth(), 10) || 120);
  maxWidthPx = computed(() => Number.parseInt(this.maxWidth(), 10) || 600);

  /** @internal */
  handleResizeStart(e: PointerEvent): void {
    if (!this.resizable()) {
      return;
    }
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    this.resizingState.set(true);
    const startX = e.clientX;
    const el = this.elementRef.nativeElement as HTMLElement;
    const startWidth = el.getBoundingClientRect().width;
    const isEnd = this.position() === 'end';
    const min = this.minWidthPx();
    const max = this.maxWidthPx();
    let currentWidth = startWidth;
    let rafId = 0;

    const onMove = (ev: PointerEvent): void => {
      const delta = isEnd ? startX - ev.clientX : ev.clientX - startX;
      currentWidth = Math.round(Math.max(min, Math.min(max, startWidth + delta)));
      // Set CSS var directly on DOM — no Angular change detection per frame
      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          el.style.setProperty('--cngx-sidenav-width', `${currentWidth}px`);
          rafId = 0;
        });
      }
    };

    const onUp = (): void => {
      cancelAnimationFrame(rafId);
      this.resizingState.set(false);
      // Sync final width back to the model (single CD cycle)
      this.width.set(`${currentWidth}px`);
      this.doc.removeEventListener('pointermove', onMove);
      this.doc.removeEventListener('pointerup', onUp);
    };

    this.doc.addEventListener('pointermove', onMove);
    this.doc.addEventListener('pointerup', onUp);
  }
}
