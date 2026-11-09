import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  HostAttributeToken,
  inject,
  input,
  model,
  signal,
  untracked,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { createTransitionTracker, injectLocale, numberFormatterFor } from '@cngx/core/utils';
import { CNGX_HOVER_INTENT_DEFAULTS, injectHotkeys } from '@cngx/common/interactive';
import {
  CNGX_CONTAINER_SIZE,
  CNGX_DRAWER_SURFACE_DRIVER,
  CNGX_PANEL_TARGET,
  CNGX_SIDEBAR_DRIVER,
  type CngxDrawerModality,
  CngxDrawerSurface,
  type CngxDrawerSurfaceDriver,
  type CngxPanelMode,
  type CngxPanelTarget,
  CngxResizable,
  CngxSidebar,
  type CngxSidebarCollapsedAs,
  type CngxSidebarDriver,
} from '@cngx/common/layout';
import { clamp, cngxDevWarn } from '@cngx/utils';

import { injectSidenavConfig, injectSidenavLabels } from './config/inject-sidenav-config';
import { CNGX_SIDENAV_STORAGE } from './config/sidenav.config.defaults';
import { CNGX_SIDENAV_ANNOUNCER_FACTORY } from './sidenav-announcer';
import { CNGX_SIDENAV, CNGX_SIDENAV_LAYOUT, type CngxSidenavContract } from './sidenav-token';

const PERCENT_FORMAT: Intl.NumberFormatOptions = { style: 'percent' };

/**
 * Logical position - flips in RTL.
 */
export type SidenavPosition = 'start' | 'end';
/**
 * How the sidenav interacts with the content area.
 *
 * - `'over'` - floats above content (overlay + backdrop)
 * - `'side'` - docked beside the content; `collapsed` rests it as a rail or
 *   hides it (`collapsedAs="hidden"`, the former push mode)
 */
export type SidenavMode = 'auto' | 'over' | 'side';

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
 * Declarative sidebar component for the drawer modes (`over`, `side`) plus an `auto` default, two-way `[(opened)]` and `[(collapsed)]`
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
 * An open overlay runs on a composed `CngxDrawerSurface` (`@cngx/common/layout`)
 * with the `modality` input (`'page'` by default): focus moves into the rail
 * and is trapped, the page outside is `inert` and scroll-locked, Escape, the
 * back gesture and a press outside close it, and focus returns to the opener.
 * `CngxSidenavLayout` only draws the backdrop. It does not compose
 * `CngxDrawer` and has no swipe-to-dismiss.
 *
 * Use inside `CngxSidenavLayout` for dual-sidebar support and the width
 * class.
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
    // The overlay engine: while the rail is an open overlay the surface traps
    // focus (modality page), restores it on close, makes the page outside
    // inert, locks scrolling and asks for dismissal on Escape, the back
    // gesture and an outside press. Driven through CNGX_DRAWER_SURFACE_DRIVER.
    { directive: CngxDrawerSurface, inputs: [], outputs: [] },
  ],
  // Element-injector provider (not viewProviders): the sidebar's composed
  // CngxHoverIntent resolves CNGX_HOVER_INTENT_DEFAULTS from the host element
  // injector, so the config-resolved dwell reaches the atom. Un-configured,
  // cfg.hover is the 120/0 default, byte-identical to the atom's own literals.
  providers: [
    { provide: CNGX_HOVER_INTENT_DEFAULTS, useFactory: () => injectSidenavConfig().hover ?? {} },
    { provide: CNGX_SIDENAV, useExisting: CngxSidenav },
    { provide: CNGX_SIDEBAR_DRIVER, useExisting: CngxSidenav },
    { provide: CNGX_DRAWER_SURFACE_DRIVER, useExisting: CngxSidenav },
    // Over the composed sidebar's: an in-rail trigger (a pin or close button)
    // follows the sidenav's per-width-class toggle, not the bare sidebar's.
    { provide: CNGX_PANEL_TARGET, useFactory: () => inject(CngxSidenav).panelTarget },
  ],
  host: {
    '[class.cngx-sidenav]': 'true',
    '[class.cngx-sidenav--start]': "position() === 'start'",
    '[class.cngx-sidenav--end]': "position() === 'end'",
    '[class.cngx-sidenav--open]': 'opened()',
    '[class.cngx-sidenav--over]': "effectiveMode() === 'over'",
    '[class.cngx-sidenav--side]': "effectiveMode() === 'side'",
    '[class.cngx-sidenav--resizable]': 'resizable()',
    '[class.cngx-sidenav--resizing]': 'resizing()',
    '[style.--cngx-sidenav-width]': 'width()',
    '[style.--cngx-sidenav-mini-width]': 'miniWidth()',
    '[style.--cngx-sidebar-size]': 'width()',
    '[style.--cngx-sidebar-rail-size]': 'miniWidth()',
  },
  imports: [CngxResizable],
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
        cngxResizable
        [size]="sizePx()"
        (sizeChange)="handleSizeChange($event)"
        [min]="minPx()"
        [max]="maxPx()"
        [edge]="position() === 'end' ? 'inline-start' : 'inline-end'"
        [label]="resolvedResizeLabel()"
        [valueText]="formatValueText()"
        [attr.aria-controls]="id()"
        (focus)="measureWidth()"
      ></div>
    }
  `,
})
export class CngxSidenav
  implements CngxSidenavContract, CngxSidebarDriver, CngxDrawerSurfaceDriver
{
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
   * (`[attr.aria-controls]="nav.id()"`). A press inside such a control is not
   * outside the open overlay, so the toggle's own click can close the rail
   * instead of reopening it.
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

  /** The resize handle, present while `resizable` and at full width. */
  private readonly resizeHandle = viewChild(CngxResizable);

  /** Whether a resize drag is in progress. */
  readonly resizing = computed(() => this.resizeHandle()?.resizing() ?? false);

  /** Two-way opened state. Supports `[(opened)]="signal"`. */
  readonly opened = model<boolean>(false);

  /**
   * How far an open overlay takes over the page: `'page'` (default, a modal
   * dialog: focus trap, `aria-modal`, everything outside `inert`, scroll lock,
   * backdrop), `'contained'` (inert and lock inside the layout only) or
   * `'none'` (the page stays operable, no backdrop). Docked, the rail is a
   * `complementary` landmark in every modality.
   */
  readonly modality = input<CngxDrawerModality>('page');

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
   * Whether the full nav is shown: the overlay while `opened`, a
   * docked rail while not `collapsed` or while it peeks. What a trigger's
   * `aria-expanded` mirrors.
   */
  readonly expanded = computed(() => {
    if (this.isOverlay()) {
      return this.opened();
    }
    return this.sidebar.expanded();
  });

  /** @internal Drives the composed `CngxSidebar`: the collapsed state per presentation. */
  readonly sidebarCollapsed = computed(() => {
    if (this.railBase()) {
      return true;
    }
    return this.effectiveMode() === 'over' ? false : this.sidebar.collapsed();
  });

  /** @internal Drives the composed `CngxSidebar`: `medium` always rests as a rail. */
  readonly sidebarCollapsedAs = computed<CngxSidebarCollapsedAs>(() => {
    if (this.railBase()) {
      return 'rail';
    }
    return this.sidebar.collapsedAs();
  });

  /** @internal Drives the composed `CngxSidebar`: the `medium` overlay shows over the rail. */
  readonly sidebarPeek = computed(() => this.railBase() && this.opened());

  /** @internal Drives the composed `CngxSidebar`: a closed drawer leaves the a11y tree. */
  readonly sidebarConcealed = computed(
    () => this.effectiveMode() === 'over' && !this.opened(),
  );

  /** @internal Drives the composed `CngxSidebar`: the rail's accessible name. */
  readonly sidebarLabel = computed(() => this.resolvedAriaLabel());

  /** @internal Drives the composed `CngxDrawerSurface`: engaged while an open overlay. */
  readonly surfaceActive = this.overlayActive;
  /** @internal Drives the composed `CngxDrawerSurface`. */
  readonly surfaceModality = this.modality;
  /** @internal Drives the composed `CngxDrawerSurface`: one name in every state. */
  readonly surfaceLabel = this.sidebarLabel;
  /** @internal Escape, the back gesture or an outside press closes the overlay. */
  surfaceDismiss(): void {
    this.close();
  }

  /**
   * The rail as a {@link CngxPanelTarget}, for `[cngxPanelTrigger]="nav.panelTarget"`
   * (and `CNGX_PANEL_TARGET` inside the rail). One trigger works in every
   * width class: `toggle()` flips `collapsed` on the docked rail and opens or
   * closes the overlay over the `medium` rail and the `compact` drawer;
   * `expanded` is what the trigger's `aria-expanded` mirrors. `mode` reads
   * `over` while `opened` shows the rail as an overlay, else `inline`.
   */
  readonly panelTarget: CngxPanelTarget = {
    id: this.id,
    expanded: this.expanded,
    toggle: () => this.toggle(),
    peek: () => this.peek(),
    mode: computed<CngxPanelMode>(() => (this.isOverlay() ? 'over' : 'inline')),
    modal: computed(() => this.isOverlay() && this.modality() !== 'none'),
    side: this.position,
    label: this.sidebarLabel,
  };

  /** Peeks a collapsed docked rail without changing `collapsed`; elsewhere it toggles. */
  peek(): void {
    if (this.dockedRail()) {
      this.sidebar.peek();
      return;
    }
    this.toggle();
  }

  private readonly doc = inject(DOCUMENT);
  private readonly layoutCoordinator = inject(CNGX_SIDENAV_LAYOUT, { optional: true });
  private readonly announcer = inject(CNGX_SIDENAV_ANNOUNCER_FACTORY)();

  /**
   * Current/previous width-class pair for the open-flag reset. `null` until the
   * layout's first `ResizeObserver` entry resolves the class, so settling from
   * the unresolved first frame is not a class change.
   */
  private readonly classTransition = createTransitionTracker<SidenavWidthClass | null>(() =>
    this.rawWidthClass().trim() === '' ? null : this.widthClass(),
  );

  constructor() {
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

    // The toggle hotkey (`shortcut`, `withSidenavShortcut`) in the app's hotkey
    // registry, under the remap id `sidenav.toggle`. It sits in the rail's own
    // scope, so while another modal overlay holds focus it stays quiet. It runs
    // toggle() (never a raw opened flip) and announces the new state, since no
    // focused trigger conveys aria-expanded. An unset shortcut lists no
    // binding at all: an empty combo would warn CNGX1080 as unparseable.
    const runToggle = (): void => {
      this.toggle();
      this.announcer.announce(this.expanded());
    };
    injectHotkeys(
      computed(() => {
        const combo = this.shortcut();
        return combo ? [{ id: 'sidenav.toggle', combo, run: runToggle }] : [];
      }),
    );

    this.persistCollapsed();

    if (typeof ngDevMode !== 'undefined' && ngDevMode) {
      effect(() => {
        const raw = this.rawWidthClass().trim();
        if (raw !== '' && !WIDTH_CLASSES.has(raw)) {
          untracked(() => warnUnknownWidthClass(raw));
        }
      });
    }

    // Open-flag reset on a width-class change, the one write in an effect here
    // (sidenav-accepted-debt §1): opened is a consumer model(), which cannot be
    // a linkedSignal keyed on the class. In auto, every class change starts the
    // new presentation closed, so a drawer opened at one width never reopens
    // stale at another. Focus inside the rail keeps it open instead, so the
    // focused element is not orphaned behind inert. Pinned modes never reset.
    effect(() => {
      const current = this.classTransition.current();
      const previous = this.classTransition.previous();
      if (previous === null || current === previous) {
        return;
      }
      untracked(() => {
        if (this.mode() !== 'auto') {
          return;
        }
        const host = this.elementRef.nativeElement as HTMLElement;
        this.opened.set(host.contains(this.doc.activeElement));
      });
    });

    // A closing drawer moves focus out before it turns aria-hidden (blocked
    // and warned about on a focused element). Declared after the reset above,
    // so a class change that keeps the drawer open is seen first.
    effect(() => {
      if (!this.sidebarConcealed()) {
        return;
      }
      untracked(() => {
        const host = this.elementRef.nativeElement as HTMLElement;
        const active = this.doc.activeElement;
        if (active instanceof HTMLElement && host.contains(active)) {
          active.blur();
        }
      });
    });
  }

  /**
   * Shows the full nav: opens the overlay, expands a docked
   * rail (`collapsed = false`).
   */
  open(): void {
    if (this.dockedRail()) {
      this.sidebar.pin();
      return;
    }
    this.openOverlay();
  }

  /**
   * Hides the full nav: closes the overlay, collapses a docked
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
    if (this.opened()) {
      this.opened.set(false);
      return;
    }
    this.openOverlay();
  }

  // One open overlay per layout: the layout closes the other rail's overlay
  // in the same gesture, before this one engages its surface.
  private openOverlay(): void {
    if (!this.opened() && this.isOverlay()) {
      this.layoutCoordinator?.overlayOpening(this);
    }
    this.opened.set(true);
  }

  // withSidenavPersistence(): the stored value seeds an unbound collapsed now
  // (a bound [(collapsed)] overwrites it on the first check and stays the
  // consumer's); the storage write is the only effect, and skips its first
  // run so an untouched default is never written.
  private persistCollapsed(): void {
    const storageKey = this.cfg.persistence?.storageKey;
    const storage = storageKey ? inject(CNGX_SIDENAV_STORAGE) : null;
    if (!storageKey || !storage) {
      return;
    }
    const position = inject(new HostAttributeToken('position'), { optional: true }) ?? 'start';
    const key = `${storageKey}:${position}`;
    const stored = readStoredFlag(storage, key);
    if (stored !== null) {
      this.sidebar.collapsed.set(stored);
    }
    let first = true;
    effect(() => {
      const collapsed = this.sidebar.collapsed();
      if (first) {
        first = false;
        return;
      }
      untracked(() => writeStoredFlag(storage, key, collapsed));
    });
  }

  /** Whether `collapsed` (not `opened`) is the state `toggle()` and `close()` change. */
  private dockedRail(): boolean {
    return this.effectiveMode() === 'side' && !this.railBase();
  }

  /** @internal Numeric px of the current width, or null for non-px units. */
  protected readonly widthPx = computed(() => parsePx(this.width()));
  /** @internal Resize bounds in px; a non-px bound falls back to 120 / 600. */
  protected readonly minPx = computed(() => parsePx(this.minWidth()) ?? 120);
  protected readonly maxPx = computed(() => parsePx(this.maxWidth()) ?? 600);

  /**
   * Rect-measured width for non-px rails: seeded after first render (a
   * focusable separator must expose `aria-valuenow` before it is ever
   * focused) and refreshed each time the separator gains focus, so the value
   * AT reads at interaction time is current.
   */
  private readonly measuredWidthPx = signal<number | null>(null);

  /** @internal The handle's `size`: the px width, else the measured one. */
  protected readonly sizePx = computed(
    () => this.widthPx() ?? this.measuredWidthPx() ?? this.minPx(),
  );

  /**
   * @internal `aria-valuetext` of the handle: its position as a percent of the
   * min-max range, formatted in the locale, so AT speaks where the handle sits
   * instead of a bare pixel count.
   */
  protected readonly formatValueText = computed(() => {
    const min = this.minPx();
    const max = this.maxPx();
    const labels = this.labels();
    const formatter = numberFormatterFor(this.locale(), PERCENT_FORMAT);
    return (size: number): string => {
      const percent = max > min ? Math.round(clamp((size - min) / (max - min), 0, 1) * 100) : 0;
      return labels.resizeValueText(percent, formatter.format(percent / 100));
    };
  });

  /** @internal Refresh the measurement the moment AT is about to read it. */
  protected measureWidth(): void {
    const el = this.elementRef.nativeElement as HTMLElement;
    this.measuredWidthPx.set(Math.round(el.getBoundingClientRect().width) || null);
  }

  /** @internal The handle resized: the model takes the px width. */
  protected handleSizeChange(size: number): void {
    this.width.set(`${size}px`);
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

/** A stored `true` / `false`, `null` when absent, unreadable or anything else. */
function readStoredFlag(storage: Storage, key: string): boolean | null {
  try {
    const value = storage.getItem(key);
    return value === 'true' ? true : value === 'false' ? false : null;
  } catch {
    return null;
  }
}

// A full or blocked storage (private mode, quota) must not break the toggle.
function writeStoredFlag(storage: Storage, key: string, value: boolean): void {
  try {
    storage.setItem(key, String(value));
  } catch {
    // Persistence is best effort.
  }
}

/**
 * Numeric value of a px-unit (or unitless) CSS length, `null` for any other
 * unit. rem/ch widths cannot be resolved without layout.
 */
function parsePx(value: string): number | null {
  const match = /^\s*(\d+(?:\.\d+)?)(?:px)?\s*$/.exec(value);
  return match ? Number.parseFloat(match[1]) : null;
}
