import {
  computed,
  Directive,
  effect,
  ElementRef,
  HostAttributeToken,
  inject,
  input,
  untracked,
} from '@angular/core';
import { cngxDevWarn } from '@cngx/utils';

import type { DrawerPosition } from './drawer.directive';
import {
  CNGX_DRAWER_HOST,
  type CngxDrawerHost,
  type CngxDrawerPanelPresentation,
} from './drawer-host';
import {
  CNGX_DRAWER_SURFACE_DRIVER,
  type CngxDrawerModality,
  CngxDrawerSurface,
  type CngxDrawerSurfaceDriver,
} from './drawer-surface.directive';

/**
 * How the drawer panel interacts with the content area.
 */
export type DrawerMode = 'over' | 'push';

/**
 * The sliding panel of a drawer. Reads its open state from an explicit
 * `[cngxDrawerPanel]` reference, or from the `CNGX_DRAWER_HOST` a
 * `CngxDrawer` on the same element provides when the attribute is bare - no
 * ancestor injection. Both go through the `CngxDrawerHost` contract, never
 * the concrete `CngxDrawer` class.
 *
 * The open panel is a transient surface (`CngxDrawerSurface`): Escape, the
 * Android back gesture and a press outside the panel close the drawer
 * (`closeOnClickOutside`, default `true`). A press on the trigger whose
 * `aria-controls` names the panel `id` is not outside, so the trigger
 * toggles the drawer itself. While closed the panel
 * is `aria-hidden` AND `inert`. On close, focus returns to the element that
 * was focused when the drawer opened - unless the user moved focus to
 * another element themselves.
 *
 * **Modality.** `modality` defaults to `'page'` for `over` and `'none'` for
 * `push`:
 *
 * - `'page'`: the open panel traps focus, renders `role="dialog"` +
 *   `aria-modal="true"` (named by `label`, else a static `aria-label` /
 *   `aria-labelledby`, else `CNGX_LAYOUT_I18N.drawerDialog`), makes
 *   everything outside it `inert` up to `<body>`
 *   (focus-trap anchors, live regions and a visible backdrop stay live) and
 *   locks scrolling on the nearest scroll container above it (else the
 *   document root). The full-height drawer that covers the app header.
 * - `'contained'`: the same inside the `[cngxDrawer]` host only. The
 *   panel's siblings inside the host are `inert` and a scroll container
 *   between the panel and the host is locked; everything outside the host
 *   stays live. No trap and no `aria-modal`: focus moves into the panel on
 *   open, returns to the opener on close, and Tab can reach the page
 *   around the host. The clipped drawer below a live app header: place the
 *   header outside `[cngxDrawer]`.
 * - `'none'`: the page around the panel stays operable.
 *
 * `push` is never modal: it lays the panel out next to the content, which
 * stays in use; `'page'` or `'contained'` with `push` resolve to `'none'`
 * and warn `CNGX1075` in development.
 *
 * **Scrim.** The panel renders `cngx-drawer-panel--modal` while its
 * resolved modality is `'page'` or `'contained'` (plus
 * `cngx-drawer-panel--contained` for the latter). The opt-in stylesheet
 * `cngx-drawer.css` paints the scrim from it: add the `cngx-drawer` class
 * to the `[cngxDrawer]` host and the host shows a scrim over itself while
 * a modal panel inside it is open (`--cngx-drawer-scrim-bg`, default
 * `--cngx-backdrop-bg`). A press on the scrim is a press outside the panel
 * and closes the drawer. The panel sits above the scrim when it is
 * positioned with a `z-index` above `--cngx-drawer-scrim-z-index` (`1`).
 *
 * The `role` input (landmark while not an open page modal) defaults to
 * `complementary`. On a `<nav>` host pass `[role]="null"` so the implicit
 * navigation landmark survives:
 *
 * ```html
 * <button aria-controls="nav-panel" [attr.aria-expanded]="drawer.opened()"
 *         (click)="drawer.toggle()">Menu</button>
 * <nav id="nav-panel" [cngxDrawerPanel]="drawer" position="left" mode="over" [role]="null">
 *   <a href="/home">Home</a>
 * </nav>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/layout/drawer/drawer-panel.directive.ts
 * @since 0.1.0
 * @relatedTo CngxDrawer, CngxDrawerContent, CngxFocusTrap
 * <example-url>/#/common/layout/drawer/basic-scroll-lock-backdrop</example-url>
 * <example-url>/#/common/layout/drawer/controlled-mode</example-url>
 * <example-url>/#/common/layout/drawer/direction-all-four-sides</example-url>
 * <example-url>/#/common/layout/drawer/events-openedchange-closed</example-url>
 * <example-url>/#/common/layout/drawer/app-header-clipped</example-url>
 * <example-url>/#/common/layout/drawer/full-height-modal</example-url>
 * <example-url>/#/common/layout/drawer/filter-panel-push</example-url>
 * <example-url>/#/common/layout/drawer/pattern-consumer-wiring</example-url>
 */
@Directive({
  selector: '[cngxDrawerPanel]',
  exportAs: 'cngxDrawerPanel',
  standalone: true,
  hostDirectives: [{ directive: CngxDrawerSurface, inputs: ['label'], outputs: [] }],
  providers: [{ provide: CNGX_DRAWER_SURFACE_DRIVER, useExisting: CngxDrawerPanel }],
  host: {
    '[class.cngx-drawer-panel]': 'true',
    '[class.cngx-drawer-panel--open]': 'isOpen()',
    '[class.cngx-drawer-panel--left]': "position() === 'left'",
    '[class.cngx-drawer-panel--right]': "position() === 'right'",
    '[class.cngx-drawer-panel--top]': "position() === 'top'",
    '[class.cngx-drawer-panel--bottom]': "position() === 'bottom'",
    '[class.cngx-drawer-panel--over]': "mode() === 'over'",
    '[class.cngx-drawer-panel--push]': "mode() === 'push'",
    '[class.cngx-drawer-panel--modal]': "surfaceModality() !== 'none'",
    '[class.cngx-drawer-panel--contained]': "surfaceModality() === 'contained'",
    '[attr.id]': 'panelId()',
    '[attr.aria-hidden]': 'isOpen() ? null : true',
    '[attr.inert]': "isOpen() ? null : ''",
  },
})
export class CngxDrawerPanel implements CngxDrawerSurfaceDriver {
  /**
   * The drawer state owner (a `CngxDrawer`, or anything implementing
   * `CngxDrawerHost`). Bind it explicitly (`[cngxDrawerPanel]="drawer"`), or
   * leave the attribute bare on an element that also carries `cngxDrawer`.
   */
  readonly drawerInput = input<CngxDrawerHost | undefined, CngxDrawerHost | '' | undefined>(
    undefined,
    {
      alias: 'cngxDrawerPanel',
      transform: (v) => (typeof v === 'string' ? undefined : v),
    },
  );

  /** Direction the panel slides from. */
  readonly position = input<DrawerPosition>('left');

  /**
   * How the panel interacts with the content area:
   * - `'over'` (default) - overlays content (absolute positioned)
   * - `'push'` - pushes content aside (content gets margin)
   */
  readonly mode = input<DrawerMode>('over');

  /**
   * How much of the page the open panel blocks:
   *
   * - `'page'`: the whole page is blocked. The panel is a modal dialog,
   *   focus is trapped in it and everything outside it is `inert` up to
   *   `<body>`.
   * - `'contained'`: only the `[cngxDrawer]` host is blocked. The content
   *   beside the panel is `inert` and scroll-locked, everything outside the
   *   host (an app header above it) stays clickable, and focus moves into
   *   the panel without being trapped.
   * - `'none'`: nothing is blocked. No `inert`, no lock, no trap.
   *
   * With the `cngx-drawer` stylesheet, `'page'` and `'contained'` show a
   * scrim over the `[cngxDrawer]` host. Unbound, it follows the mode: `over`
   * is `'page'`, `push` is `'none'`. `push` never blocks: `'page'` or
   * `'contained'` with `push` resolve to `'none'` and warn `CNGX1075` in
   * development. See {@link CngxDrawerModality}.
   */
  readonly modality = input<CngxDrawerModality | undefined>(undefined);

  /** Whether a press outside the panel closes the drawer. */
  readonly closeOnClickOutside = input<boolean>(true);

  /**
   * Landmark role rendered on the panel while it is not an open page modal
   * (an open `'page'` panel is a `dialog`; a `'contained'` one keeps this
   * role). Defaults to `complementary`; pass `navigation` for nav drawers or
   * `null` to keep the element's implicit role (e.g. on a `<nav>` host).
   */
  readonly role = input<string | null>('complementary');

  private readonly hostDrawer = inject(CNGX_DRAWER_HOST, { self: true, optional: true });

  /** The resolved drawer: the explicit reference wins over a drawer host on the element. */
  readonly drawerRef = computed(() => this.drawerInput() ?? this.hostDrawer);

  private readonly staticId = inject(new HostAttributeToken('id'), { optional: true });

  /** The panel's `id`: a static `id` attribute wins over the drawer's `panelId`. */
  protected readonly panelId = computed(() => {
    const fromDrawer = this.drawerRef()?.panelId();
    if (this.staticId !== null) {
      return this.staticId;
    }
    return fromDrawer === undefined || fromDrawer === '' ? null : fromDrawer;
  });

  /** Whether the drawer is currently open (derived from the drawer ref). */
  readonly isOpen = computed(() => this.drawerRef()?.opened() ?? false);

  /** @internal Drives the composed `CngxDrawerSurface`. */
  readonly surfaceActive = this.isOpen;
  /** @internal Drives the composed `CngxDrawerSurface`. */
  readonly surfaceModality = computed<CngxDrawerModality>(() =>
    this.mode() === 'push' ? 'none' : (this.modality() ?? 'page'),
  );
  /** @internal Drives the composed `CngxDrawerSurface`: the `[cngxDrawer]` host. */
  readonly surfaceBoundary = computed<HTMLElement | null>(
    () => this.drawerRef()?.elementRef.nativeElement ?? null,
  );
  /** @internal Drives the composed `CngxDrawerSurface`. */
  readonly surfaceLandmarkRole = this.role;

  private readonly presentation: CngxDrawerPanelPresentation = {
    mode: this.mode,
    modal: computed(() => this.surfaceModality() !== 'none'),
    position: this.position,
    element: inject<ElementRef<HTMLElement>>(ElementRef).nativeElement,
  };
  /** @internal Drives the composed `CngxDrawerSurface`. */
  readonly surfaceOutsideDismiss = this.closeOnClickOutside;

  constructor() {
    // The drawer's panel target reads the presentation from here; follow a
    // rebound drawer reference and leave the old drawer on the way out.
    effect((onCleanup) => {
      const drawer = this.drawerRef();
      if (!drawer) {
        return;
      }
      onCleanup(untracked(() => drawer.connectPanel(this.presentation)));
    });

    if (typeof ngDevMode !== 'undefined' && ngDevMode) {
      effect(() => {
        const requested = this.modality();
        if (this.mode() !== 'push' || requested === undefined || requested === 'none') {
          return;
        }
        untracked(() =>
          cngxDevWarn(
            'CNGX1075',
            '[cngxDrawerPanel] mode="push" is never modal; a page or contained modality resolves to "none". ' +
              'A push drawer lays out next to the content, which stays in use. ' +
              'Use mode="over" for a modal drawer.',
            { modality: requested },
          ),
        );
      });
    }
  }

  /** @internal Drives the composed `CngxDrawerSurface`. */
  surfaceDismiss(): void {
    this.drawerRef()?.close();
  }
}
