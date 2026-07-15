import { type FocusTrap, FocusTrapFactory } from '@angular/cdk/a11y';
import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  linkedSignal,
  model,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { matchesKeyCombo, parseKeyCombo } from '@cngx/core/utils';
import { CngxHoverIntent } from '@cngx/common/interactive';

import { injectSidenavConfig } from './config/inject-sidenav-config';

/**
 * Logical position - flips in RTL.
 *
 * @category ui/sidenav
 */
export type SidenavPosition = 'start' | 'end';
/**
 * How the sidenav interacts with the content area.
 *
 * - `'over'` - floats above content (overlay + backdrop)
 * - `'push'` - pushes content aside when open
 * - `'side'` - always visible, content permanently offset
 * - `'mini'` - collapsed icon rail (miniWidth), expands to full width on hover
 *
 * @category ui/sidenav
 */
export type SidenavMode = 'over' | 'push' | 'side' | 'mini';

/**
 * Declarative sidebar component for the four drawer modes (`over`,
 * `push`, `side`, `mini`), with responsive mode switching, two-way
 * `[(opened)]` binding, and content projection via header/footer
 * slots.
 *
 * In overlay (`over`) mode it drives a CDK focus trap directly via
 * `FocusTrapFactory` (the same primitive `CngxFocusTrap` wraps): focus
 * moves into the rail on open and is restored to the opener on close.
 * Responsive switching runs off an inline `matchMedia` listener; the
 * shared backdrop and document scroll lock are coordinated by
 * `CngxSidenavLayout`. It does not compose `CngxDrawer` and has no
 * swipe-to-dismiss.
 *
 * Use inside `CngxSidenavLayout` for dual-sidebar support and
 * shared backdrop coordination.
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
 * @category ui/sidenav
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/sidenav/sidenav.ts
 * @since 0.1.0
 * @relatedTo CngxSidenavLayout, CngxSidenavContent, CngxSidenavHeader, CngxSidenavFooter
 * <example-url>http://localhost:4200/#/ui/sidenav/dual-sidebar-master-detail</example-url>
 * <example-url>http://localhost:4200/#/ui/sidenav/full-navigation-sidebar</example-url>
 * <example-url>http://localhost:4200/#/ui/sidenav/material-theming-light-vs-dark</example-url>
 */
@Component({
  selector: 'cngx-sidenav',
  exportAs: 'cngxSidenav',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./sidenav.css'],
  // Debounced expand-on-hover: CngxHoverIntent's pointerenter/pointerleave
  // listeners replace the sidenav's instant ones so a sweep-through never
  // expands. The directive is composed unconditionally - its listeners arm in
  // every mode - but only `mini` reads its `active()` signal (see hoverSource);
  // non-mini modes gate the debounced result to false downstream. The dwell is
  // tunable per instance via the forwarded [enterDelay]/[leaveDelay] inputs and
  // app-wide via CNGX_HOVER_INTENT_DEFAULTS (provided from the config below);
  // un-set, the atom's 120/0 literals apply so behaviour stays unchanged.
  hostDirectives: [{ directive: CngxHoverIntent, inputs: ['enterDelay', 'leaveDelay'] }],
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
    '[attr.aria-modal]': "overlayActive() ? 'true' : null",
    '[style.--cngx-sidenav-width]': 'effectiveWidth()',
    '[style.--cngx-sidenav-mini-width]': 'miniWidth()',
    role: 'complementary',
    '[attr.aria-label]': 'ariaLabel() || null',
    '(keydown.escape)': 'closeIfOverlay()',
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
  /**
   * Resolved sidenav configuration cascade. Seeds the dimension, `responsive`,
   * and `shortcut` input defaults below so a per-instance binding still wins
   * (Controlled+Uncontrolled), an app-wide `provideSidenavConfig(...)` moves the
   * default, and an un-configured consumer keeps the byte-identical literals.
   * Declared first so the input field initialisers can read it.
   */
  private readonly cfg = injectSidenavConfig();

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
  readonly responsive = input<string | undefined>(this.cfg.responsive);

  /** Width of the sidenav panel. Supports two-way `[(width)]` for resize. */
  readonly width = model<string>(this.cfg.dimensions?.width ?? '280px');

  /** Width of the collapsed rail in `mini` mode. Any CSS value. */
  readonly miniWidth = input<string>(this.cfg.dimensions?.miniWidth ?? '56px');

  /** Whether hovering the mini rail expands the sidenav to full width. */
  readonly expandOnHover = input<boolean>(true);

  /** Whether the sidebar is user-resizable via a drag handle. */
  readonly resizable = input<boolean>(false);

  /** Minimum width constraint during resize. */
  readonly minWidth = input<string>(this.cfg.dimensions?.minWidth ?? '120px');

  /** Maximum width constraint during resize. */
  readonly maxWidth = input<string>(this.cfg.dimensions?.maxWidth ?? '600px');

  /**
   * Keyboard shortcut to toggle the sidenav, e.g. `'ctrl+b'` or `'meta+b'`.
   * Uses `ctrl` on Windows/Linux and `meta` (Cmd) on macOS automatically
   * when `'mod+<key>'` syntax is used.
   */
  readonly shortcut = input<string | undefined>(this.cfg.shortcut);

  /** Whether a resize drag is in progress. */
  private readonly resizingState = signal(false);
  readonly resizing = this.resizingState.asReadonly();

  /** Two-way opened state. Supports `[(opened)]="signal"`. */
  readonly opened = model<boolean>(false);

  /** Debounced mini expand-on-hover, composed as a hostDirective (its own pointer listeners drive it). */
  private readonly hoverIntent = inject(CngxHoverIntent, { host: true });

  /**
   * Composed source for `expandedState`: the effective mode, the debounced
   * hover-intent signal, and the on/off switch. Carries an explicit `equal` so
   * the object literal never churns identity and re-runs the computation when
   * none of the three fields actually changed.
   */
  private readonly hoverSource = computed(
    () => ({
      mode: this.effectiveMode(),
      hover: this.hoverIntent.active(),
      enabled: this.expandOnHover(),
    }),
    { equal: (a, b) => a.mode === b.mode && a.hover === b.hover && a.enabled === b.enabled },
  );

  /**
   * Whether the mini-mode rail is currently expanded. A pure derivation of
   * `(effectiveMode, hoverIntent.active, expandOnHover)`, not two imperative
   * event-handler writes:
   *
   * - outside `mini` it is always `false`;
   * - with `expandOnHover=true` the debounced hover is the source of truth, so a
   *   pointer edge overrides a prior `expand()`/`collapse()` (see `expand()`);
   * - with `expandOnHover=false` hover is ignored and the prior value is kept, so
   *   `expand()`/`collapse()` retain full programmatic authority.
   *
   * It stays a writable `linkedSignal` so `expand()`/`collapse()` can `set()` it;
   * the next source change re-derives from the debounced hover.
   */
  private readonly expandedState = linkedSignal<
    { mode: SidenavMode; hover: boolean; enabled: boolean },
    boolean
  >({
    source: this.hoverSource,
    computation: ({ mode, hover, enabled }, prev) => {
      if (mode !== 'mini') {
        return false;
      }
      return enabled ? hover : (prev?.value ?? false);
    },
  });
  readonly expanded = this.expandedState.asReadonly();

  /** @internal Reference to host element for layout positioning. */
  readonly elementRef = inject(ElementRef<HTMLElement>);

  // Inlined matchMedia - host directive would force a wrapper element.
  private readonly mediaMatches = signal(false);

  /** Resolved mode - responsive overrides to `'side'` when matching, falls back to `mode()`. */
  readonly effectiveMode = computed<SidenavMode>(() => {
    if (!this.responsive()) {
      return this.mode();
    }
    return this.mediaMatches() ? 'side' : this.mode();
  });

  /** Whether this sidenav is in overlay mode (over). */
  readonly isOverlay = computed(() => this.effectiveMode() === 'over');

  /** Whether the sidenav is currently a modal overlay: overlay mode and open. */
  readonly overlayActive = computed(() => this.isOverlay() && this.opened());

  /** Resolved width - mini mode uses miniWidth unless expanded. */
  readonly effectiveWidth = computed(() => {
    if (this.effectiveMode() === 'mini' && !this.expandedState()) {
      return this.miniWidth();
    }
    return this.width();
  });

  private readonly doc = inject(DOCUMENT);
  private readonly win = this.doc.defaultView;

  /**
   * Current/previous effective-mode pair for transition detection. Mirrors the
   * `createTransitionTracker` shape from `@cngx/core/utils`, inlined because that
   * helper is typed to `AsyncStatus`; `SidenavMode` needs the same `linkedSignal`
   * pattern. Replaces the hand-rolled `prevMode` signal that was `.set()` inside
   * the mode effect.
   */
  private readonly modeTransition = linkedSignal<
    SidenavMode,
    { current: SidenavMode; previous: SidenavMode | undefined }
  >({
    source: () => this.effectiveMode(),
    computation: (current, prev) => ({ current, previous: prev?.value.current }),
    equal: (a, b) => a.current === b.current && a.previous === b.previous,
  });

  /** CDK focus trap over the host; enabled only while a modal overlay is open. */
  private readonly focusTrap: FocusTrap;

  /** Element that held focus when the overlay opened, restored to it on close. */
  private restoreTarget: HTMLElement | null = null;

  /**
   * Set when the mode-transition effect auto-opens an overlay (a viewport-driven
   * `side`/`mini` -> `over` switch). The focus effect reads it to enable the trap
   * without pulling focus into the rail, since that open was not user-initiated.
   */
  private autoOpenInFlight = false;

  /** Aborts the in-flight resize drag's document listeners (pointerup or teardown). */
  private resizeAbort: AbortController | null = null;

  constructor() {
    this.focusTrap = inject(FocusTrapFactory).create(this.elementRef.nativeElement as HTMLElement);

    // Modal-overlay focus contract: on the open edge move focus into the rail
    // and trap it; on the close edge restore focus to whatever opened it, after
    // the DOM settles. overlayActive is the single tracked trigger; restoreTarget
    // is a plain field, not a signal, so this stays a pure side-effect and never
    // feeds a write back into the reactive graph.
    let wasOverlayActive = false;
    effect(() => {
      const active = this.overlayActive();
      this.focusTrap.enabled = active;
      if (active && !wasOverlayActive) {
        // Only pull focus into the rail when the open was user-initiated. An
        // auto-open driven by a responsive mode switch (viewport resize) engages
        // the trap - the rail is now modal - but must not steal focus.
        const viaAutoOpen = this.autoOpenInFlight;
        this.autoOpenInFlight = false;
        if (!viaAutoOpen) {
          const activeEl = this.doc.activeElement;
          this.restoreTarget = activeEl instanceof HTMLElement ? activeEl : null;
          void this.focusTrap.focusFirstTabbableElementWhenReady();
        }
      } else if (!active && wasOverlayActive) {
        const target = this.restoreTarget;
        this.restoreTarget = null;
        queueMicrotask(() => target?.focus());
      }
      wasOverlayActive = active;
    });

    inject(DestroyRef).onDestroy(() => {
      this.focusTrap.destroy();
      this.resizeAbort?.abort();
    });

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

    // Global hotkey: document listener inside effect(onCleanup) so the combo
    // signal can re-register at runtime. Host listeners cannot rebind.
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

    // Residual transition side-effect, not a derivation: opened is a consumer
    // model() the user can still toggle, so leaving an always-visible mode for an
    // overlay mode auto-opens the rail once. Guarded by the current/previous
    // compare so it fires only on the transition edge.
    effect(() => {
      const { current, previous } = this.modeTransition();
      if (previous === undefined || current === previous) {
        return;
      }
      const alwaysVisible = (m: SidenavMode) => m === 'side' || m === 'mini';
      if (alwaysVisible(previous) && !alwaysVisible(current)) {
        // Flag only overlay auto-opens so the focus effect skips the focus-move.
        // `over` is the only overlay mode; a `push` auto-open never raises
        // overlayActive, so it must not leave the flag stuck for a later open.
        this.autoOpenInFlight = current === 'over';
        this.opened.set(true);
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
  protected closeIfOverlay(): void {
    if (this.isOverlay()) {
      this.close();
    }
  }

  /**
   * Expand the mini rail to full width.
   *
   * When `expandOnHover=true` (the default) the debounced hover is the source of
   * truth for `expanded`, so a programmatic `expand()` is transient: the next
   * pointer edge overrides it. For authoritative programmatic control set
   * `expandOnHover=false`, which hands `expand()`/`collapse()` full authority.
   */
  expand(): void {
    this.expandedState.set(true);
  }

  /**
   * Collapse the expanded mini rail back to miniWidth.
   *
   * Same reconciliation as `expand()`: transient while `expandOnHover=true`,
   * authoritative while `expandOnHover=false`.
   */
  collapse(): void {
    this.expandedState.set(false);
  }

  /** @internal Parse a CSS px value to a number. */
  protected readonly widthPx = computed(() => Number.parseInt(this.width(), 10) || 280);
  protected readonly minWidthPx = computed(() => Number.parseInt(this.minWidth(), 10) || 120);
  protected readonly maxWidthPx = computed(() => Number.parseInt(this.maxWidth(), 10) || 600);

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

    // One controller per drag removes both document listeners in a single abort:
    // on pointerup below, and - critically - if the component is torn down
    // mid-drag (the onDestroy hook aborts this.resizeAbort).
    const controller = new AbortController();
    this.resizeAbort = controller;

    const onMove = (ev: PointerEvent): void => {
      const delta = isEnd ? startX - ev.clientX : ev.clientX - startX;
      currentWidth = Math.round(Math.max(min, Math.min(max, startWidth + delta)));
      // CSS var on the DOM node directly, no CD per frame during drag.
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
      // Single CD on pointerup - model catches up with the DOM.
      this.width.set(`${currentWidth}px`);
      controller.abort();
      this.resizeAbort = null;
    };

    this.doc.addEventListener('pointermove', onMove, { signal: controller.signal });
    this.doc.addEventListener('pointerup', onUp, { signal: controller.signal });
  }
}
