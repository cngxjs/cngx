import {
  computed,
  Directive,
  effect,
  HostAttributeToken,
  inject,
  input,
  untracked,
} from '@angular/core';
import { cngxDevWarn } from '@cngx/utils';

import { CngxDrawer, type DrawerPosition } from './drawer.directive';
import {
  CNGX_DRAWER_SURFACE_DRIVER,
  CngxDrawerSurface,
  type CngxDrawerSurfaceDriver,
} from './drawer-surface.directive';

/**
 * How the drawer panel interacts with the content area.
 */
export type DrawerMode = 'over' | 'push';

/**
 * The sliding panel of a drawer. Reads its open state from an explicit
 * `[cngxDrawerPanel]` reference, or from a `CngxDrawer` on the same element
 * when the attribute is bare - no ancestor injection.
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
 * **Modality.** `modal` defaults to `mode === 'over'`. A modal open panel
 * traps focus, renders `role="dialog"` + `aria-modal="true"`, makes
 * everything outside it `inert` up to `<body>` (focus-trap anchors, live
 * regions and a visible backdrop stay live) and locks scrolling on the
 * nearest scroll container above it (else the document root). A non-modal panel keeps the page around it
 * operable and renders its landmark `role`. `push` is never modal: it lays
 * the panel out next to the content, which stays in use.
 *
 * The `role` input (landmark while not an open modal) defaults to
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
 * <example-url>/#/common/layout/drawer/mode-over-push</example-url>
 * <example-url>/#/common/layout/drawer/pattern-consumer-wiring</example-url>
 */
@Directive({
  selector: '[cngxDrawerPanel]',
  exportAs: 'cngxDrawerPanel',
  standalone: true,
  hostDirectives: [{ directive: CngxDrawerSurface, inputs: [], outputs: [] }],
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
    '[class.cngx-drawer-panel--modal]': 'surfaceModal()',
    '[attr.id]': 'panelId()',
    '[attr.aria-hidden]': 'isOpen() ? null : true',
    '[attr.inert]': "isOpen() ? null : ''",
  },
})
export class CngxDrawerPanel implements CngxDrawerSurfaceDriver {
  /**
   * The `CngxDrawer` state owner. Bind it explicitly
   * (`[cngxDrawerPanel]="drawer"`), or leave the attribute bare on an element
   * that also carries `cngxDrawer`.
   */
  readonly drawerInput = input<CngxDrawer | undefined, CngxDrawer | '' | undefined>(undefined, {
    alias: 'cngxDrawerPanel',
    transform: (v) => (typeof v === 'string' ? undefined : v),
  });

  /** Direction the panel slides from. */
  readonly position = input<DrawerPosition>('left');

  /**
   * How the panel interacts with the content area:
   * - `'over'` (default) - overlays content (absolute positioned)
   * - `'push'` - pushes content aside (content gets margin)
   */
  readonly mode = input<DrawerMode>('over');

  /**
   * Whether the open panel is modal (focus trap, `aria-modal`, inert
   * siblings, scroll lock). Unbound, it follows the mode: `over` is modal,
   * `push` is not. `push` is never modal; `[modal]="true"` with `push`
   * resolves to non-modal and warns `CNGX1075` in development.
   */
  readonly modal = input<boolean | undefined>(undefined);

  /** Whether a press outside the panel closes the drawer. */
  readonly closeOnClickOutside = input<boolean>(true);

  /**
   * Landmark role rendered on the panel while it is not an open modal (an
   * open modal panel is a `dialog`). Defaults to `complementary`; pass
   * `navigation` for nav drawers or `null` to keep the element's implicit
   * role (e.g. on a `<nav>` host).
   */
  readonly role = input<string | null>('complementary');

  private readonly hostDrawer = inject(CngxDrawer, { self: true, optional: true });

  /** The resolved drawer: the explicit reference wins over a `CngxDrawer` on the host. */
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
  readonly surfaceModal = computed(() => this.mode() === 'over' && (this.modal() ?? true));
  /** @internal Drives the composed `CngxDrawerSurface`. */
  readonly surfaceLandmarkRole = this.role;
  /** @internal Drives the composed `CngxDrawerSurface`. */
  readonly surfaceOutsideDismiss = this.closeOnClickOutside;

  constructor() {
    if (typeof ngDevMode !== 'undefined' && ngDevMode) {
      effect(() => {
        if (this.mode() !== 'push' || this.modal() !== true) {
          return;
        }
        untracked(() =>
          cngxDevWarn(
            'CNGX1075',
            '[cngxDrawerPanel] mode="push" is never modal; [modal]="true" is ignored. ' +
              'A push drawer lays out next to the content, which stays in use. ' +
              'Use mode="over" for a modal drawer.',
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
