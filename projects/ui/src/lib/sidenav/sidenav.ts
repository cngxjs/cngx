import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  linkedSignal,
  model,
  signal,
  ViewEncapsulation,
} from '@angular/core';

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
    '[attr.aria-hidden]': "effectiveMode() === 'side' || effectiveMode() === 'mini' ? null : !opened()",
    '[style.--cngx-sidenav-width]': 'effectiveWidth()',
    '[style.--cngx-sidenav-mini-width]': 'miniWidth()',
    'role': 'complementary',
    '[attr.aria-label]': 'ariaLabel() || null',
    '(keydown.escape)': 'closeIfOverlay()',
    '(mouseenter)': '_onMouseEnter()',
    '(mouseleave)': '_onMouseLeave()',
  },
  template: `
    <ng-content select="cngx-sidenav-header, [cngxSidenavHeader]" />
    <div class="cngx-sidenav__body">
      <ng-content />
    </div>
    <ng-content select="cngx-sidenav-footer, [cngxSidenavFooter]" />
    @if (resizable()) {
      <div class="cngx-sidenav__resize-handle"
           (pointerdown)="_onResizeStart($event)"
           role="separator"
           [attr.aria-orientation]="'vertical'"
           [attr.aria-valuenow]="_widthPx()"
           [attr.aria-valuemin]="_minWidthPx()"
           [attr.aria-valuemax]="_maxWidthPx()"></div>
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
  private readonly _resizing = signal(false);
  readonly resizing = this._resizing.asReadonly();

  /** Two-way opened state. Supports `[(opened)]="signal"`. */
  readonly opened = model<boolean>(false);

  /** Whether the mini-mode rail is currently expanded (hover or programmatic). */
  private readonly _expanded = signal(false);
  readonly expanded = this._expanded.asReadonly();

  /** @internal Reference to host element for layout positioning. */
  readonly elementRef = inject(ElementRef<HTMLElement>);

  // ── Responsive media query (inlined, not CngxMediaQuery directive) ──
  private readonly _mediaMatches = signal(false);

  /** Resolved mode — responsive overrides to `'side'` when matching, falls back to `mode()`. */
  readonly effectiveMode = computed<SidenavMode>(() => {
    if (!this.responsive()) {
      return this.mode();
    }
    return this._mediaMatches() ? 'side' : this.mode();
  });

  /** Whether this sidenav is in overlay mode (over). */
  readonly isOverlay = computed(() => this.effectiveMode() === 'over');

  /** Resolved width — mini mode uses miniWidth unless expanded. */
  readonly effectiveWidth = computed(() => {
    if (this.effectiveMode() === 'mini' && !this._expanded()) {
      return this.miniWidth();
    }
    return this.width();
  });

  private readonly _doc = inject(DOCUMENT);
  private readonly _win = this._doc.defaultView;

  /** Tracks the previous effective mode to detect transitions. */
  private readonly _prevMode = linkedSignal<SidenavMode>(() => this.effectiveMode());

  constructor() {
    // Wire responsive matchMedia
    effect((onCleanup) => {
      const query = this.responsive();
      const win = this._win;
      if (!query || !win) {
        return;
      }
      const mql = win.matchMedia(query);
      this._mediaMatches.set(mql.matches);
      const handler = (e: MediaQueryListEvent): void => this._mediaMatches.set(e.matches);
      mql.addEventListener('change', handler);
      onCleanup(() => mql.removeEventListener('change', handler));
    });

    // Keyboard shortcut toggle
    effect((onCleanup) => {
      const combo = this.shortcut();
      if (!combo) {
        return;
      }
      const parts = combo.toLowerCase().split('+').map((s) => s.trim());
      const key = parts.pop()!;
      const needsCtrl = parts.includes('ctrl');
      const needsMeta = parts.includes('meta');
      const needsMod = parts.includes('mod');
      const needsShift = parts.includes('shift');
      const needsAlt = parts.includes('alt');

      const handler = (e: KeyboardEvent): void => {
        if (e.key.toLowerCase() !== key) {
          return;
        }
        if (needsShift && !e.shiftKey) {
          return;
        }
        if (needsAlt && !e.altKey) {
          return;
        }
        if (needsMod) {
          const isMac = (this._win as Window & { navigator: Navigator }).navigator?.userAgent?.includes('Mac') ?? false;
          if (isMac ? !e.metaKey : !e.ctrlKey) {
            return;
          }
        } else {
          if (needsCtrl && !e.ctrlKey) {
            return;
          }
          if (needsMeta && !e.metaKey) {
            return;
          }
        }
        e.preventDefault();
        this.opened.set(!this.opened());
      };
      this._doc.addEventListener('keydown', handler);
      onCleanup(() => this._doc.removeEventListener('keydown', handler));
    });

    // Sync opened state on mode transitions
    effect(() => {
      const mode = this.effectiveMode();
      const prev = this._prevMode();
      const alwaysVisible = (m: SidenavMode) => m === 'side' || m === 'mini';
      if (alwaysVisible(prev) && !alwaysVisible(mode)) {
        this.opened.set(true);
      }
      if (prev === 'mini' && mode !== 'mini') {
        this._expanded.set(false);
      }
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
    this._expanded.set(true);
  }

  /** Collapse the expanded mini rail back to miniWidth. */
  collapse(): void {
    this._expanded.set(false);
  }

  /** @internal */
  _onMouseEnter(): void {
    if (this.effectiveMode() === 'mini' && this.expandOnHover()) {
      this._expanded.set(true);
    }
  }

  /** @internal */
  _onMouseLeave(): void {
    if (this.effectiveMode() === 'mini') {
      this._expanded.set(false);
    }
  }

  // ── Resize ──────────────────────────────────────────────────────

  /** @internal Parse a CSS px value to a number. */
  _widthPx = computed(() => parseInt(this.width(), 10) || 280);
  _minWidthPx = computed(() => parseInt(this.minWidth(), 10) || 120);
  _maxWidthPx = computed(() => parseInt(this.maxWidth(), 10) || 600);

  /** @internal */
  _onResizeStart(e: PointerEvent): void {
    if (!this.resizable()) {return;}
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    this._resizing.set(true);
    const startX = e.clientX;
    const el = this.elementRef.nativeElement as HTMLElement;
    const startWidth = el.getBoundingClientRect().width;
    const isEnd = this.position() === 'end';
    const min = this._minWidthPx();
    const max = this._maxWidthPx();
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
      this._resizing.set(false);
      // Sync final width back to the model (single CD cycle)
      this.width.set(`${currentWidth}px`);
      this._doc.removeEventListener('pointermove', onMove);
      this._doc.removeEventListener('pointerup', onUp);
    };

    this._doc.addEventListener('pointermove', onMove);
    this._doc.addEventListener('pointerup', onUp);
  }
}
