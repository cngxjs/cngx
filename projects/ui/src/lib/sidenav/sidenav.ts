import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  model,
  signal,
  ViewEncapsulation,
} from '@angular/core';

/** Logical position — flips in RTL. */
export type SidenavPosition = 'start' | 'end';
/** How the sidenav interacts with the content area. */
export type SidenavMode = 'over' | 'push' | 'side';

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
    '[attr.aria-hidden]': "effectiveMode() === 'side' ? null : !opened()",
    '[style.--cngx-sidenav-width]': 'width()',
    'role': 'complementary',
    '(keydown.escape)': 'closeIfOverlay()',
  },
  template: `
    <ng-content select="cngx-sidenav-header, [cngxSidenavHeader]" />
    <div class="cngx-sidenav__body">
      <ng-content />
    </div>
    <ng-content select="cngx-sidenav-footer, [cngxSidenavFooter]" />
  `,
})
export class CngxSidenav {
  /** Logical position: `'start'` (default left in LTR) or `'end'` (right in LTR). */
  readonly position = input<SidenavPosition>('start');

  /** Drawer mode. Overridden by `responsive` when set. */
  readonly mode = input<SidenavMode>('over');

  /**
   * CSS media query string for responsive mode switching.
   * When the query matches, mode becomes `'side'` (permanent).
   * When it doesn't match, mode becomes `'over'` (overlay).
   */
  readonly responsive = input<string | undefined>(undefined);

  /** Width of the sidenav panel. Any CSS value. */
  readonly width = input<string>('280px');

  /** Two-way opened state. Supports `[(opened)]="signal"`. */
  readonly opened = model<boolean>(false);

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

  constructor() {
    // Wire responsive matchMedia
    let cleanupMedia: (() => void) | undefined;
    effect(() => {
      cleanupMedia?.();
      const query = this.responsive();
      if (!query) {
        return;
      }
      const mql = window.matchMedia(query);
      this._mediaMatches.set(mql.matches);
      const handler = (e: MediaQueryListEvent): void => this._mediaMatches.set(e.matches);
      mql.addEventListener('change', handler);
      cleanupMedia = () => mql.removeEventListener('change', handler);
    });
    inject(DestroyRef).onDestroy(() => cleanupMedia?.());

    // Sync opened state on mode transitions:
    // When leaving 'side' mode the sidenav was visible regardless of `opened`.
    // Ensure `opened` is true so it stays visible in the new mode.
    let prevMode: SidenavMode | undefined;
    effect(() => {
      const mode = this.effectiveMode();
      if (prevMode === 'side' && mode !== 'side') {
        this.opened.set(true);
      }
      prevMode = mode;
    });
  }

  /** Opens the sidenav. */
  open(): void {
    this.opened.set(true);
  }

  /** Closes the sidenav (only in over/push mode). */
  close(): void {
    if (this.effectiveMode() !== 'side') {
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
}
