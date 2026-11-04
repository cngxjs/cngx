import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  InjectionToken,
  Injector,
  input,
  output,
  type Signal,
  signal,
  untracked,
} from '@angular/core';
import {
  CNGX_FOCUS_RESTORE_DRIVER,
  CNGX_FOCUS_TRAP_DRIVER,
  CngxFocusRestore,
  type CngxFocusRestoreDriver,
  CngxFocusTrap,
  type CngxFocusTrapDriver,
} from '@cngx/common/a11y';
import {
  CNGX_CLICK_OUTSIDE_DRIVER,
  CngxClickOutside,
  type CngxClickOutsideDriver,
} from '@cngx/common/interactive';
import { injectWindow } from '@cngx/core/tokens';
import { createCloseWatcher } from '@cngx/core/utils';

import { createScrollLock } from '../scroll/scroll-lock-core';
import { createInertSiblings } from './inert-siblings';

/**
 * @internal Lets a directive that composes `CngxDrawerSurface` as a host
 * directive drive it from its own state instead of `[active]` / `[modal]`.
 * Provided by the composer on the same element (`useExisting`); the surface
 * resolves it lazily with `self: true`, because the composer constructs after
 * its host directives.
 */
export interface CngxDrawerSurfaceDriver {
  /** Whether the surface is engaged; wins over `[active]`. */
  readonly surfaceActive: Signal<boolean>;
  /** Whether the engaged surface is modal; wins over `[modal]`. */
  readonly surfaceModal: Signal<boolean>;
  /**
   * Landmark role while the surface is not an engaged modal. Without it the
   * surface renders `complementary`.
   */
  readonly surfaceLandmarkRole?: Signal<string | null>;
  /** Whether a press outside the host asks for dismissal. Without it, it does. */
  readonly surfaceOutsideDismiss?: Signal<boolean>;
  /** Called for every dismissal request (Escape, back gesture, outside press). */
  surfaceDismiss(): void;
}

/** @internal See {@link CngxDrawerSurfaceDriver}. */
export const CNGX_DRAWER_SURFACE_DRIVER = new InjectionToken<CngxDrawerSurfaceDriver>(
  'CngxDrawerSurfaceDriver',
);

const SCROLLING_OVERFLOW = new Set(['auto', 'scroll']);

/**
 * The transient-surface behaviour of a drawer or an overlay rail, with an
 * explicit modality.
 *
 * While `active`, the surface asks to be dismissed on Escape (focus inside),
 * on the platform back gesture (`CloseWatcher`) and on a press outside the
 * host. A press on the element whose `aria-controls` names the host `id` is
 * not outside, so the trigger can toggle the surface itself. Focus returns
 * to the element focused at activation when the surface deactivates.
 *
 * Modal (`[modal]="true"`, the default) additionally traps focus, renders
 * `role="dialog"` + `aria-modal="true"`, makes everything outside the host
 * `inert` up to `<body>` (the siblings of the host and of every ancestor,
 * like a modal dialog; focus-trap anchors, live regions, the CDK overlay
 * container, the toast and banner outlets and a visible `CngxBackdrop` stay
 * live, and an `inert` set by someone else is kept on release) and locks
 * scrolling on the nearest scroll container above the host (the nearest
 * ancestor with a computed `overflow-y` of `auto` or `scroll`, else
 * the document root). Non-modal keeps the page around it operable: no trap,
 * no lock, no inert, `role="complementary"`.
 *
 * The surface does not own the open state: it reports `dismiss` and the
 * owner decides. It composes `CngxFocusTrap`, `CngxFocusRestore` and
 * `CngxClickOutside` and drives them; none of their inputs is re-exposed.
 *
 * ```html
 * <aside id="filters" cngxDrawerSurface [active]="open()" [modal]="false"
 *        (dismiss)="open.set(false)">…</aside>
 * <button aria-controls="filters" [attr.aria-expanded]="open()"
 *         (click)="open.set(!open())">Filters</button>
 * ```
 *
 * `CngxDrawerPanel` hosts the surface for drawers; consumers rarely bind it
 * directly.
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/layout/drawer/drawer-surface.directive.ts
 * @since 0.1.0
 * @relatedTo CngxDrawerPanel, CngxFocusTrap, CngxFocusRestore, CngxClickOutside, createScrollLock
 * @axis level molecule
 */
@Directive({
  selector: '[cngxDrawerSurface]',
  exportAs: 'cngxDrawerSurface',
  standalone: true,
  hostDirectives: [CngxFocusTrap, CngxFocusRestore, CngxClickOutside],
  providers: [
    { provide: CNGX_FOCUS_TRAP_DRIVER, useExisting: CngxDrawerSurface },
    { provide: CNGX_FOCUS_RESTORE_DRIVER, useExisting: CngxDrawerSurface },
    { provide: CNGX_CLICK_OUTSIDE_DRIVER, useExisting: CngxDrawerSurface },
  ],
  host: {
    '[attr.role]': 'surfaceRole()',
    '[attr.aria-modal]': "engagedModal() ? 'true' : null",
    '(keydown.escape)': 'handleEscape()',
  },
})
export class CngxDrawerSurface
  implements CngxFocusTrapDriver, CngxFocusRestoreDriver, CngxClickOutsideDriver
{
  /**
   * Whether the surface is engaged (the drawer or overlay is open). Bind it
   * to the owner's open state.
   */
  readonly active = input<boolean>(false);
  /**
   * Whether the engaged surface is modal: focus trap, `aria-modal`, inert
   * outside the host up to `<body>` and scroll lock. `false` keeps the page around it operable.
   */
  readonly modal = input<boolean>(true);
  /**
   * Emitted when the user asks to dismiss the engaged surface: Escape, the
   * back gesture, or a press outside the host. The owner closes it.
   */
  readonly dismiss = output<void>();

  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly doc = inject(DOCUMENT);
  private readonly domReady = signal(false);
  private destroyed = false;

  private resolvedDriver: CngxDrawerSurfaceDriver | null | undefined = undefined;
  private driver(): CngxDrawerSurfaceDriver | null {
    if (this.resolvedDriver === undefined) {
      this.resolvedDriver = this.injector.get(CNGX_DRAWER_SURFACE_DRIVER, null, { self: true });
    }
    return this.resolvedDriver;
  }

  /** Whether the surface is engaged, after the driver. */
  readonly isActive = computed(() => this.driver()?.surfaceActive() ?? this.active());
  /** Whether the surface is modal, after the driver. */
  readonly isModal = computed(() => this.driver()?.surfaceModal() ?? this.modal());

  protected readonly engagedModal = computed(() => this.isActive() && this.isModal());
  protected readonly surfaceRole = computed(() => {
    if (this.engagedModal()) {
      return 'dialog';
    }
    const landmark = this.driver()?.surfaceLandmarkRole;
    return landmark ? landmark() : 'complementary';
  });

  /** @internal Drives the composed `CngxFocusTrap`. */
  readonly focusTrapEnabled = this.engagedModal;
  /** @internal Drives the composed `CngxFocusTrap`. */
  readonly focusTrapAutoFocus = true;
  /** @internal Drives the composed `CngxFocusRestore`. */
  readonly focusRestoreActive = this.isActive;
  /** @internal Drives the composed `CngxClickOutside`. */
  readonly clickOutsideEnabled = computed(
    () => this.isActive() && (this.driver()?.surfaceOutsideDismiss?.() ?? true),
  );

  private readonly closeWatcher = createCloseWatcher(() => this.requestDismiss(), injectWindow());

  constructor() {
    afterNextRender(() => this.domReady.set(true));
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      this.closeWatcher.disarm();
    });

    inject(CngxClickOutside, { self: true }).clickOutside.subscribe(() => this.requestDismiss());

    effect((onCleanup) => {
      if (!this.isActive()) {
        return;
      }
      untracked(() => this.closeWatcher.arm());
      onCleanup(() => this.closeWatcher.disarm());
    });

    effect((onCleanup) => {
      if (!this.domReady() || !this.engagedModal()) {
        return;
      }
      const releaseInert = createInertSiblings(this.host, { scope: 'outside' });
      const releaseLock = createScrollLock(this.scrollScope());
      onCleanup(() => {
        releaseInert();
        releaseLock();
      });
    });
  }

  protected handleEscape(): void {
    if (!this.isActive()) {
      return;
    }
    // Chromium also turns an unhandled Escape into a CloseWatcher close; one
    // keypress must reach the owner once, so no watcher exists until the
    // keydown task is over.
    this.closeWatcher.disarm();
    this.emitDismiss();
    setTimeout(() => this.rearmIfEngaged());
  }

  private requestDismiss(): void {
    this.emitDismiss();
    this.rearmIfEngaged();
  }

  private emitDismiss(): void {
    this.dismiss.emit();
    this.driver()?.surfaceDismiss();
  }

  // A blocked dismissal leaves the surface engaged; the spent watcher would
  // let the next back gesture leave the page.
  private rearmIfEngaged(): void {
    if (!this.destroyed && untracked(this.isActive)) {
      this.closeWatcher.arm();
    }
  }

  private scrollScope(): HTMLElement {
    const view = this.doc.defaultView;
    let node = this.host.parentElement;
    while (node && node !== this.doc.body && node !== this.doc.documentElement) {
      const overflowY = view?.getComputedStyle(node).overflowY ?? '';
      if (SCROLLING_OVERFLOW.has(overflowY)) {
        return node;
      }
      node = node.parentElement;
    }
    return this.doc.documentElement;
  }
}
