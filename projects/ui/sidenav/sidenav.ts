import { type FocusTrap, FocusTrapFactory } from '@angular/cdk/a11y';
import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
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
  untracked,
  ViewEncapsulation,
} from '@angular/core';
import {
  createTransitionTracker,
  injectLocale,
  matchesKeyCombo,
  numberFormatterFor,
  parseKeyCombo,
} from '@cngx/core/utils';
import { CNGX_HOVER_INTENT_DEFAULTS } from '@cngx/common/interactive';
import {
  CNGX_CONTAINER_SIZE,
  CNGX_SIDEBAR_DRIVER,
  CngxSidebar,
  type CngxSidebarCollapsedAs,
  type CngxSidebarDriver,
} from '@cngx/common/layout';
import { clamp, cngxDevWarn } from '@cngx/utils';

import { injectSidenavConfig, injectSidenavLabels } from './config/inject-sidenav-config';
import { CNGX_SIDENAV } from './sidenav-token';

const PERCENT_FORMAT: Intl.NumberFormatOptions = { style: 'percent' };

/**
 * Logical position - flips in RTL.
 */
export type SidenavPosition = 'start' | 'end';
/**
 * How the sidenav interacts with the content area.
 *
 * - `'over'` - floats above content (overlay + backdrop)
 * - `'push'` - pushes content aside when open
 * - `'side'` - docked beside the content; `collapsed` rests it as a rail or
 *   hides it
 */
export type SidenavMode = 'auto' | 'over' | 'push' | 'side';

/**
 * A resolved mode - what `'auto'` settles on plus every pinnable value.
 */
export type ResolvedSidenavMode = Exclude<SidenavMode, 'auto'>;

/**
 * The width class of the surrounding `CngxSidenavLayout`, resolved by the
 * `@container` rule block in `sidenav-layout.css`: `compact` below 48rem,
 * `medium` from 48rem, `expanded` from 64rem.
 */
export type SidenavWidthClass = 'compact' | 'medium' | 'expanded';

const WIDTH_CLASSES: ReadonlySet<string> = new Set<SidenavWidthClass>([
  'compact',
  'medium',
  'expanded',
]);

/**
 * Declarative sidebar component for the drawer modes (`over`, `push`,
 * `side`) plus an `auto` default, two-way `[(opened)]` and `[(collapsed)]`
 * bindings, and content projection via header/footer slots.
 *
 * The rail is a composed `CngxSidebar`: docked, `[(collapsed)]` rests it as a
 * rail (`collapsedAs="rail"`, `miniWidth` wide) or hides it
 * (`collapsedAs="hidden"`), and a collapsed rail peeks at full width over the
 * content on a hover dwell (`expandOnHover`, `expandDelay`, `collapseDelay`).
 * `toggle()` follows the width class: `expanded` flips `collapsed`, `medium`
 * keeps the rail and opens the full nav as an overlay over it, `compact` opens
 * the drawer. `close()` collapses a docked rail.
 *
 * Responsive out of the box: `mode` defaults to `'auto'`, which follows the
 * width class of the surrounding `CngxSidenavLayout` (`widthClass`): it
 * overlays the content below `48rem` (`compact`) and docks beside it from
 * `48rem` (`medium`, `expanded`). Nothing needs to be bound. The thresholds
 * live in `sidenav-layout.css` and nowhere else - a `@container` rule block
 * writes `--cngx-sidenav-width-class` on the rail and this component reads
 * the resolved value, so ejecting the skin moves the thresholds with it. Any
 * explicit `mode` pins that mode at every width.
 *
 * In overlay (`over`) mode it drives a CDK focus trap directly via
 * `FocusTrapFactory` (the same primitive `CngxFocusTrap` wraps): focus
 * moves into the rail on open and is restored to the opener on close.
 * The shared backdrop and document scroll lock are coordinated by
 * `CngxSidenavLayout`. It does not compose `CngxDrawer` and has no
 * swipe-to-dismiss.
 *
 * Use inside `CngxSidenavLayout` for dual-sidebar support and
 * shared backdrop coordination.
 *
 * ```html
 * <cngx-sidenav-layout>
 *   <cngx-sidenav position="start" [(opened)]="navOpen">
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
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/sidenav/sidenav.ts
 * @since 0.1.0
 * @relatedTo CngxSidenavLayout, CngxSidenavContent, CngxSidenavHeader, CngxSidenavFooter
 * <example-url>/#/ui/sidenav/auto-mode</example-url>
 * <example-url>/#/ui/sidenav/dual-sidebar-master-detail</example-url>
 * <example-url>/#/ui/sidenav/full-navigation-sidebar</example-url>
 * <example-url>/#/ui/sidenav/material-theming-light-vs-dark</example-url>
 * @axis level organism
 */
@Component({
  selector: 'cngx-sidenav',
  exportAs: 'cngxSidenav',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./sidenav.css'],
  // The rail is a composed CngxSidebar: collapsed / collapsedAs / the hover
  // peek and its dwell (expandDelay / collapseDelay, app-wide through
  // CNGX_HOVER_INTENT_DEFAULTS below) come from the brain. `position` doubles
  // as the sidebar's `side`, so a peek grows away from the rail's edge. The
  // sidenav drives what the brain renders per width class through
  // CNGX_SIDEBAR_DRIVER; the consumer's [(collapsed)] stays the user decision.
  hostDirectives: [
    {
      directive: CngxSidebar,
      inputs: [
        'collapsed',
        'collapsedAs',
        'expandOnHover',
        'expandDelay',
        'collapseDelay',
        'side: position',
      ],
      outputs: ['collapsedChange'],
    },
  ],
  // Element-injector provider (not viewProviders): the sidebar's composed
  // CngxHoverIntent resolves CNGX_HOVER_INTENT_DEFAULTS from the host element
  // injector, so the config-resolved dwell reaches the atom. Un-configured,
  // cfg.hover is the 120/0 default, byte-identical to the atom's own literals.
  providers: [
    { provide: CNGX_HOVER_INTENT_DEFAULTS, useFactory: () => injectSidenavConfig().hover ?? {} },
    { provide: CNGX_SIDENAV, useExisting: CngxSidenav },
    { provide: CNGX_SIDEBAR_DRIVER, useExisting: CngxSidenav },
  ],
  host: {
    '[class.cngx-sidenav]': 'true',
    '[class.cngx-sidenav--start]': "position() === 'start'",
    '[class.cngx-sidenav--end]': "position() === 'end'",
    '[class.cngx-sidenav--open]': 'opened()',
    '[class.cngx-sidenav--over]': "effectiveMode() === 'over'",
    '[class.cngx-sidenav--push]': "effectiveMode() === 'push'",
    '[class.cngx-sidenav--side]': "effectiveMode() === 'side'",
    '[class.cngx-sidenav--resizable]': 'resizable()',
    '[class.cngx-sidenav--resizing]': 'resizing()',
    '[attr.role]': 'hostRole()',
    '[attr.aria-modal]': "overlayActive() ? 'true' : null",
    '[style.--cngx-sidenav-width]': 'width()',
    '[style.--cngx-sidenav-mini-width]': 'miniWidth()',
    '[style.--cngx-sidebar-size]': 'width()',
    '[style.--cngx-sidebar-rail-size]': 'miniWidth()',
    '(keydown.escape)': 'closeIfOverlay()',
  },
  template: `
    <ng-content select="cngx-sidenav-header, [cngxSidenavHeader]" />
    <div class="cngx-sidenav__body">
      <ng-content />
    </div>
    <ng-content select="cngx-sidenav-footer, [cngxSidenavFooter]" />
    <!-- Only at full width: a collapsed rail or peek has a fixed width, and a
         drag there would leave a stale width on the rail. -->
    @if (resizable() && sidebar.state() === 'expanded') {
      <div
        class="cngx-sidenav__resize-handle"
        (pointerdown)="handleResizeStart($event)"
        (keydown)="handleResizeKeydown($event)"
        (focus)="handleResizeFocus()"
        role="separator"
        tabindex="0"
        [attr.aria-label]="resolvedResizeLabel()"
        [attr.aria-orientation]="'vertical'"
        [attr.aria-valuenow]="widthValueNow()"
        [attr.aria-valuetext]="widthValueText()"
        [attr.aria-valuemin]="minWidthPx()"
        [attr.aria-valuemax]="maxWidthPx()"
      ></div>
    }
  `,
})
export class CngxSidenav implements CngxSidebarDriver {
  /**
   * Resolved sidenav configuration cascade. Seeds the dimension and
   * `shortcut` input defaults below so a per-instance binding still wins
   * (Controlled+Uncontrolled), an app-wide `provideSidenavConfig(...)` moves the
   * default, and an un-configured consumer keeps the byte-identical literals.
   * Declared first so the input field initialisers can read it.
   */
  private readonly cfg = injectSidenavConfig();

  /** Logical position: `'start'` (default left in LTR) or `'end'` (right in LTR). */
  readonly position = input<SidenavPosition>('start');

  /**
   * Accessible name of the rail: of the `complementary` landmark, or of the
   * modal `dialog` while it is an open overlay. Unbound, the `startRegion` /
   * `endRegion` label (`withSidenavLabels`, then the language pack) applies by
   * `position`, so two rails never share one name. An empty or blank value
   * counts as unbound, so the rail is never left without a name.
   */
  readonly ariaLabel = input<string | undefined, string | undefined>(undefined, {
    transform: (value) => (value?.trim() ? value : undefined),
  });

  /** @internal The composed sidebar brain. */
  protected readonly sidebar = inject(CngxSidebar, { self: true });

  /**
   * Element id of the rail: a static `id="..."` attribute on the host, else a
   * generated one (the composed sidebar owns it).
   *
   * An external toggle names this id in its `aria-controls`
   * (`[attr.aria-controls]="nav.id()"`). `CngxSidenavLayout` ignores a
   * `pointerdown` inside such a control when it dismisses open overlays, so
   * the toggle's own click can close the rail instead of reopening it.
   */
  readonly id = this.sidebar.id;

  /**
   * Drawer mode. `'auto'` (the default) resolves from `widthClass`: `'over'`
   * in `compact`, `'side'` in `medium` and `expanded`. Any other value pins
   * that mode at every width.
   */
  readonly mode = input<SidenavMode>('auto');

  /** Width of the sidenav panel. Supports two-way `[(width)]` for resize. */
  readonly width = model<string>(this.cfg.dimensions?.width ?? '280px');

  /** Width of the collapsed rail (`collapsed` with `collapsedAs="rail"`). Any CSS value. */
  readonly miniWidth = input<string>(this.cfg.dimensions?.miniWidth ?? '56px');

  /** Whether the sidebar is user-resizable via a drag handle. */
  readonly resizable = input<boolean>(false);

  /**
   * Accessible name of the resize separator. Unbound, the `resizeHandle` label
   * (`withSidenavLabels`) applies; per-instance like `ariaLabel`, since it
   * names this rail's handle.
   */
  readonly resizeLabel = input<string | undefined>(undefined);

  private readonly labels = injectSidenavLabels();
  private readonly locale = injectLocale();

  /**
   * @internal An open overlay is a modal dialog (focus trap, Escape, backdrop);
   * every other state is a complementary landmark. `aria-modal` follows the
   * same `overlayActive()`, so it never sits on a non-dialog role.
   */
  protected readonly hostRole = computed(() =>
    this.overlayActive() ? 'dialog' : 'complementary',
  );

  /** @internal */
  protected readonly resolvedAriaLabel = computed(() => {
    const labels = this.labels();
    const fallback = this.position() === 'end' ? labels.endRegion : labels.startRegion;
    return this.ariaLabel() ?? fallback;
  });

  /** @internal */
  protected readonly resolvedResizeLabel = computed(
    () => this.resizeLabel() ?? this.labels().resizeHandle,
  );

  /**
   * Minimum width constraint during resize. Use a px value: drag and keyboard
   * clamping (and `aria-valuemin`) resolve px only; a rem/ch constraint falls
   * back to the 120px default for clamping and omits the ARIA value.
   */
  readonly minWidth = input<string>(this.cfg.dimensions?.minWidth ?? '120px');

  /**
   * Maximum width constraint during resize. Use a px value: drag and keyboard
   * clamping (and `aria-valuemax`) resolve px only; a rem/ch constraint falls
   * back to the 600px default for clamping and omits the ARIA value.
   */
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

  /** @internal Reference to host element for layout positioning. */
  readonly elementRef = inject(ElementRef<HTMLElement>);

  /** The layout's query container, absent when the rail is mounted standalone. */
  private readonly container = inject(CNGX_CONTAINER_SIZE, { optional: true });

  /**
   * The raw `--cngx-sidenav-width-class` the `@container` rule block in
   * `sidenav-layout.css` writes on this rail. The rule styles the rail rather
   * than the layout because a container query resolves against an *ancestor*
   * container - a rule whose subject is the container itself would never match.
   *
   * Empty until the layout's first `ResizeObserver` entry arrives, so `auto`
   * resolves to `compact` for that first frame. The observer's initial callback
   * runs after layout and before paint, so nothing flashes; do NOT seed this
   * with a constructor-time `getComputedStyle`, which would read before the
   * first layout.
   */
  private readonly rawWidthClass =
    this.container?.property(
      '--cngx-sidenav-width-class',
      this.elementRef.nativeElement as Element,
    ) ?? signal('').asReadonly();

  /**
   * The width class of the surrounding layout: `compact` below 48rem, `medium`
   * from 48rem, `expanded` from 64rem. Outside a layout, and for a value the
   * rule block does not define, it is `compact`.
   */
  readonly widthClass = computed<SidenavWidthClass>(() => {
    const raw = this.rawWidthClass().trim();
    return WIDTH_CLASSES.has(raw) ? (raw as SidenavWidthClass) : 'compact';
  });

  /** Resolved mode - `'auto'` derives from the width class, anything else pins. */
  readonly effectiveMode = computed<ResolvedSidenavMode>(() => {
    const mode = this.mode();
    if (mode !== 'auto') {
      return mode;
    }
    return this.widthClass() === 'compact' ? 'over' : 'side';
  });

  /**
   * `auto` in the `medium` width class: the rail is the resting state and
   * `toggle()` opens the full nav as an overlay over it (no reflow).
   */
  private readonly railBase = computed(
    () => this.mode() === 'auto' && this.widthClass() === 'medium',
  );

  /**
   * Whether `opened` shows the rail as an overlay: the `over` drawer, or the
   * full nav over the `medium` rail.
   */
  readonly isOverlay = computed(() => this.effectiveMode() === 'over' || this.railBase());

  /** Whether the sidenav is currently a modal overlay: overlay presentation and open. */
  readonly overlayActive = computed(() => this.isOverlay() && this.opened());

  /**
   * Whether the full nav is shown: the overlay or push rail while `opened`, a
   * docked rail while not `collapsed` or while it peeks. What a trigger's
   * `aria-expanded` mirrors.
   */
  readonly expanded = computed(() => {
    if (this.isOverlay() || this.effectiveMode() === 'push') {
      return this.opened();
    }
    return this.sidebar.expanded();
  });

  /** @internal Drives the composed `CngxSidebar`: the collapsed state per presentation. */
  readonly sidebarCollapsed = computed(() => {
    if (this.railBase()) {
      return true;
    }
    switch (this.effectiveMode()) {
      case 'over':
        return false;
      case 'push':
        return !this.opened();
      default:
        return this.sidebar.collapsed();
    }
  });

  /** @internal Drives the composed `CngxSidebar`: `medium` always rests as a rail. */
  readonly sidebarCollapsedAs = computed<CngxSidebarCollapsedAs>(() => {
    if (this.railBase()) {
      return 'rail';
    }
    return this.effectiveMode() === 'push' ? 'hidden' : this.sidebar.collapsedAs();
  });

  /** @internal Drives the composed `CngxSidebar`: the `medium` overlay shows over the rail. */
  readonly sidebarPeek = computed(() => this.railBase() && this.opened());

  /** @internal Drives the composed `CngxSidebar`: a closed drawer leaves the a11y tree. */
  readonly sidebarConcealed = computed(
    () => this.effectiveMode() === 'over' && !this.opened(),
  );

  /** @internal Drives the composed `CngxSidebar`: the rail's accessible name. */
  readonly sidebarLabel = computed(() => this.resolvedAriaLabel());

  private readonly doc = inject(DOCUMENT);
  private readonly win = this.doc.defaultView;

  /**
   * Current/previous effective-mode pair for transition detection. The shared
   * `createTransitionTracker` is generic since it stopped being `AsyncStatus`-
   * typed, so the hand-rolled `linkedSignal` twin this class used to carry is
   * gone. `previous` seeds to `current` on the first run, which the consumer
   * effect's equality guard already treats as "no transition".
   */
  private readonly modeTransition = createTransitionTracker<ResolvedSidenavMode>(() =>
    this.effectiveMode(),
  );

  /** CDK focus trap over the host; enabled only while a modal overlay is open. */
  private readonly focusTrap: FocusTrap;

  /** Element that held focus when the overlay opened, restored to it on close. */
  private restoreTarget: HTMLElement | null = null;

  /**
   * Set when the mode-transition effect auto-opens an overlay (a viewport-driven
   * `side` -> `over` switch). The focus effect reads it to enable the trap
   * without pulling focus into the rail, since that open was not user-initiated.
   */
  private autoOpenInFlight = false;

  /** Aborts the in-flight resize drag's document listeners (pointerup or teardown). */
  private resizeAbort: AbortController | null = null;

  constructor() {
    this.focusTrap = inject(FocusTrapFactory).create(this.elementRef.nativeElement as HTMLElement);

    // Seed the separator's aria-valuenow for non-px rails: the attribute must
    // exist before the first focus, and only layout can resolve a rem width.
    afterNextRender(() => {
      if (this.widthPx() === null) {
        this.measureWidth();
      }
      if (
        typeof ngDevMode !== 'undefined' &&
        ngDevMode &&
        this.mode() === 'auto' &&
        !this.container
      ) {
        cngxDevWarn(
          'CNGX3010',
          '[cngx-sidenav] auto mode needs a <cngx-sidenav-layout> (or [cngxContainer]) ancestor; rendering as over.',
        );
      }
    });

    if (typeof ngDevMode !== 'undefined' && ngDevMode) {
      effect(() => {
        const raw = this.rawWidthClass().trim();
        if (raw !== '' && !WIDTH_CLASSES.has(raw)) {
          untracked(() => warnUnknownWidthClass(raw));
        }
      });
    }

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
        // auto-open driven by an auto-mode switch (container resize) engages
        // the trap - the rail is now modal - but must not steal focus.
        const viaAutoOpen = this.autoOpenInFlight;
        this.autoOpenInFlight = false;
        if (!viaAutoOpen) {
          const activeEl = this.doc.activeElement;
          this.restoreTarget = activeEl instanceof HTMLElement ? activeEl : null;
          // preventScroll: the rail is still translated off-canvas when focus
          // lands, and the layout (overflow: hidden) is script-scrollable, so a
          // scrolling focus() shifts the whole layout by the rail width.
          void this.focusTrap.focusFirstTabbableElementWhenReady({ preventScroll: true });
        }
      } else if (!active && wasOverlayActive) {
        const target = this.restoreTarget;
        this.restoreTarget = null;
        // Move focus out of the rail synchronously, before aria-hidden flips
        // true in this same flush (host binding: !opened()). The queued restore
        // alone would leave the trapped focus under aria-hidden for a microtask,
        // which the browser blocks and warns about; the deferred restore still
        // returns focus to the opener afterwards.
        const activeEl = this.doc.activeElement;
        const host = this.elementRef.nativeElement as HTMLElement;
        if (activeEl instanceof HTMLElement && host.contains(activeEl)) {
          activeEl.blur();
        }
        queueMicrotask(() => target?.focus());
      }
      wasOverlayActive = active;
    });

    inject(DestroyRef).onDestroy(() => {
      this.focusTrap.destroy();
      this.resizeAbort?.abort();
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
          // Through toggle(), not a raw opened flip: close() no-ops in the
          // always-visible modes, so the hotkey cannot desync the model (and
          // a router sync would not write ?nav=closed on a rail that stays
          // visually open).
          this.toggle();
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
      const current = this.modeTransition.current();
      const previous = this.modeTransition.previous();
      if (current === previous) {
        return;
      }
      const alwaysVisible = (m: ResolvedSidenavMode) => m === 'side';
      if (alwaysVisible(previous) && !alwaysVisible(current)) {
        // Flag only overlay auto-opens so the focus effect skips the focus-move.
        // A `push` auto-open never raises overlayActive, so it must not leave
        // the flag stuck for a later open.
        this.autoOpenInFlight = current === 'over';
        this.opened.set(true);
      }
    });
  }

  /**
   * Shows the full nav: opens the overlay or push rail, expands a docked
   * rail (`collapsed = false`).
   */
  open(): void {
    if (this.dockedRail()) {
      this.sidebar.pin();
      return;
    }
    this.opened.set(true);
  }

  /**
   * Hides the full nav: closes the overlay or push rail, collapses a docked
   * rail (`collapsed = true`). On a collapsed docked rail it ends a peek.
   */
  close(): void {
    if (!this.dockedRail()) {
      this.opened.set(false);
      return;
    }
    if (!this.sidebar.collapsed()) {
      this.sidebar.collapsed.set(true);
      return;
    }
    this.sidebar.unpeek();
  }

  /**
   * Toggles the full nav per width class: flips `collapsed` on a docked rail
   * (the content reflows), opens or closes the overlay over the `medium` rail
   * or the `compact` drawer.
   */
  toggle(): void {
    if (this.dockedRail()) {
      this.sidebar.toggle();
      return;
    }
    this.opened.update((opened) => !opened);
  }

  /** Whether `collapsed` (not `opened`) is the state `toggle()` and `close()` change. */
  private dockedRail(): boolean {
    return this.effectiveMode() === 'side' && !this.railBase();
  }

  /** @internal Close only if in overlay mode (for Escape key, click-outside). */
  protected closeIfOverlay(): void {
    if (this.isOverlay()) {
      this.close();
    }
  }

  // px-strict: a rem/ch width must not leak a lying aria-valuenow (parseInt
  // on '17.5rem' is 17, below the min). Null omits the attribute instead.
  /** @internal Numeric px of the current width, or null for non-px units. */
  protected readonly widthPx = computed(() => parsePx(this.width()));
  protected readonly minWidthPx = computed(() => parsePx(this.minWidth()));
  protected readonly maxWidthPx = computed(() => parsePx(this.maxWidth()));

  /**
   * Rect-measured width for non-px rails: seeded after first render (a
   * focusable separator must expose `aria-valuenow` before it is ever
   * focused) and refreshed each time the separator gains focus, so the value
   * AT reads at interaction time is current.
   */
  private readonly measuredWidthPx = signal<number | null>(null);

  /**
   * @internal `aria-valuenow` of the separator: the px width when parseable,
   * else the rect measurement - the window-splitter pattern wants a valuenow
   * on a focusable separator even for rem-sized rails.
   */
  protected readonly widthValueNow = computed(() => this.widthPx() ?? this.measuredWidthPx());

  /**
   * @internal `aria-valuetext` of the separator: its position as a percent of
   * the min-max range, formatted in the locale, so AT speaks where the handle
   * sits instead of a bare pixel count. `null` (AT reads `aria-valuenow`) while
   * the width or a bound is not in px.
   */
  protected readonly widthValueText = computed(() => {
    const width = this.widthValueNow();
    const min = this.minWidthPx();
    const max = this.maxWidthPx();
    if (width === null || min === null || max === null || max <= min) {
      return null;
    }
    const percent = Math.round(clamp((width - min) / (max - min), 0, 1) * 100);
    const formatted = numberFormatterFor(this.locale(), PERCENT_FORMAT).format(percent / 100);
    return this.labels().resizeValueText(percent, formatted);
  });

  private measureWidth(): void {
    const el = this.elementRef.nativeElement as HTMLElement;
    this.measuredWidthPx.set(Math.round(el.getBoundingClientRect().width) || null);
  }

  /** @internal Refresh the measurement the moment AT is about to read it. */
  protected handleResizeFocus(): void {
    this.measureWidth();
  }

  /**
   * @internal Arrow-key resize on the separator, so the handle is operable
   * without a pointer (WCAG 2.1.1): arrows step by 16px (direction-aware for
   * `position="end"`), Home/End jump to the min/max constraint. Any modified
   * key (shift included) passes through untouched - browser and AT shortcuts
   * stay theirs.
   */
  protected handleResizeKeydown(event: KeyboardEvent): void {
    if (!this.resizable() || event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) {
      return;
    }
    const el = this.elementRef.nativeElement as HTMLElement;
    const current = el.getBoundingClientRect().width;
    const min = this.minWidthPx() ?? 120;
    const max = this.maxWidthPx() ?? 600;
    const isEnd = this.position() === 'end';
    let target: number;
    switch (event.key) {
      case 'ArrowRight':
        target = current + (isEnd ? -RESIZE_KEY_STEP : RESIZE_KEY_STEP);
        break;
      case 'ArrowLeft':
        target = current + (isEnd ? RESIZE_KEY_STEP : -RESIZE_KEY_STEP);
        break;
      case 'Home':
        target = min;
        break;
      case 'End':
        target = max;
        break;
      default:
        return;
    }
    event.preventDefault();
    this.width.set(`${Math.round(Math.max(min, Math.min(max, target)))}px`);
  }

  /** @internal */
  protected handleResizeStart(e: PointerEvent): void {
    if (!this.resizable() || this.sidebar.state() !== 'expanded') {
      return;
    }
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    this.resizingState.set(true);
    const startX = e.clientX;
    const el = this.elementRef.nativeElement as HTMLElement;
    const startWidth = el.getBoundingClientRect().width;
    const isEnd = this.position() === 'end';
    const min = this.minWidthPx() ?? 120;
    const max = this.maxWidthPx() ?? 600;
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

/**
 * Dev-only: the layout wrote a width class the sidenav does not know (a typo
 * in an overridden rule block). The rail renders as `compact`.
 */
function warnUnknownWidthClass(value: string): void {
  if (typeof ngDevMode === 'undefined' || !ngDevMode) {
    return;
  }
  cngxDevWarn(
    'CNGX3026',
    `[cngx-sidenav] unknown --cngx-sidenav-width-class "${value}"; expected compact, medium or expanded. Rendering as compact.`,
    { value },
  );
}

/** Per-keypress width change of the arrow-key resize, in px. */
const RESIZE_KEY_STEP = 16;

/**
 * Numeric value of a px-unit (or unitless) CSS length, `null` for any other
 * unit. rem/ch widths cannot be resolved without layout, and a guessed number
 * would surface as a lying `aria-valuenow`.
 */
function parsePx(value: string): number | null {
  const match = /^\s*(\d+(?:\.\d+)?)(?:px)?\s*$/.exec(value);
  return match ? Number.parseFloat(match[1]) : null;
}
