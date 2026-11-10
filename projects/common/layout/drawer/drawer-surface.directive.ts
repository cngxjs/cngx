import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  HostAttributeToken,
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
  CNGX_HOTKEY_SCOPE,
  CngxClickOutside,
  type CngxClickOutsideDriver,
  type CngxHotkeyScopeNode,
  createHotkeyScope,
} from '@cngx/common/interactive';
import { injectWindow } from '@cngx/core/tokens';
import { createCloseWatcher } from '@cngx/core/utils';

import { injectLayoutI18n } from '../i18n/layout-i18n';
import { createScrollLock } from '../scroll/scroll-lock-core';
import { claimEscape, escapeOwnedAbove } from './escape-layer';
import { createInertSiblings } from './inert-siblings';

/**
 * How far an engaged `CngxDrawerSurface` takes over the page.
 *
 * - `'page'`: a modal dialog. Focus trap, `role="dialog"` + `aria-modal`,
 *   everything outside the host `inert` up to `<body>`, scroll lock on the
 *   nearest scroll container above the host.
 * - `'contained'`: modal only inside a boundary element (for a drawer, the
 *   `[cngxDrawer]` host). The host's siblings inside the boundary are
 *   `inert` and a scroll container inside the boundary is locked; everything
 *   outside the boundary (an app header above a clipped drawer) stays live.
 *   No trap and no `aria-modal`: focus moves into the host on activation
 *   and Tab can reach the live page around the boundary.
 * - `'none'`: the page stays operable. No trap, no inert, no lock.
 *
 * @since 0.1.0
 */
export type CngxDrawerModality = 'page' | 'contained' | 'none';

/**
 * @internal Lets a directive that composes `CngxDrawerSurface` as a host
 * directive drive it from its own state instead of `[active]` / `[modality]`.
 * Provided by the composer on the same element (`useExisting`); the surface
 * resolves it lazily with `self: true`, because the composer constructs after
 * its host directives.
 */
export interface CngxDrawerSurfaceDriver {
  /** Whether the surface is engaged; wins over `[active]`. */
  readonly surfaceActive: Signal<boolean>;
  /** The modality of the engaged surface; wins over `[modality]`. */
  readonly surfaceModality: Signal<CngxDrawerModality>;
  /**
   * The boundary of a `contained` surface. Without it, or when it does not
   * contain the host, the host's parent element is the boundary.
   */
  readonly surfaceBoundary?: Signal<HTMLElement | null>;
  /**
   * Landmark role while the surface is not an engaged page modal. Without it
   * the surface renders its own `[role]`.
   */
  readonly surfaceLandmarkRole?: Signal<string | null>;
  /** Whether a press outside the host asks for dismissal. Without it, it does. */
  readonly surfaceOutsideDismiss?: Signal<boolean>;
  /**
   * Accessible name of the host in every state; wins over `[label]`, the
   * static `aria-label` and the dialog fallback. For a composer that names
   * the host itself, so the surface never writes a different name.
   */
  readonly surfaceLabel?: Signal<string>;
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
 * While `active`, the surface asks to be dismissed on Escape with focus
 * inside (in every browser: the close Chromium derives from an Escape
 * keypress is not a back gesture and is dropped), on the platform back
 * gesture (`CloseWatcher`) and on a press outside the
 * host. A press on the element whose `aria-controls` names the host `id` is
 * not outside, so the trigger can toggle the surface itself. One Escape
 * dismisses one layer: an inner surface or an open popover inside the host
 * (a menu, a select panel) takes the keypress first. Focus returns
 * to the element focused at activation when the surface deactivates.
 *
 * `modality` decides how far the engaged surface takes over the page:
 *
 * - `'page'` (default) additionally traps focus, renders `role="dialog"` +
 *   `aria-modal="true"`, makes everything outside the host `inert` up to
 *   `<body>` (the siblings of the host and of every ancestor, like a modal
 *   dialog) and locks scrolling on the nearest scroll container above the
 *   host (the nearest ancestor with a computed `overflow-y` of `auto` or
 *   `scroll`, else the document root).
 * - `'contained'` does the same inside a boundary only: the host's siblings
 *   inside the boundary are `inert`, the nearest scroll container between
 *   the host and the boundary (inclusive) is locked if there is one, and
 *   nothing outside the boundary is touched. The element whose `aria-controls`
 *   names the host stays live wherever it sits. No trap and no
 *   `aria-modal` (the page around the boundary is operable, so the surface
 *   must not claim it is not); the landmark role stays and focus moves to
 *   the first tabbable element inside the host on activation. The
 *   boundary is the host's parent element unless a composer names one
 *   (`CngxDrawerPanel` names its `[cngxDrawer]` host).
 * - `'none'` keeps the page around it operable: no trap, no lock, no
 *   inert, the landmark `role` (default `complementary`, `null` keeps the
 *   host's implicit role).
 *
 * In every modality focus-trap anchors, live regions, the CDK overlay
 * container, the toast and banner outlets and a visible `CngxBackdrop` stay
 * live, and an `inert` set by someone else is kept on release. Escape, the
 * back gesture and an outside press ask for dismissal in all three.
 *
 * The surface does not own the open state: it reports `dismiss` and the
 * owner decides. It composes `CngxFocusTrap`, `CngxFocusRestore` and
 * `CngxClickOutside` and drives them; none of their inputs is re-exposed.
 *
 * ```html
 * <aside id="filters" cngxDrawerSurface [active]="open()" modality="none"
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
 * <example-url>/#/common/layout/drawer/standalone-surface</example-url>
 * @axis level molecule
 */
@Directive({
  selector: '[cngxDrawerSurface]',
  exportAs: 'cngxDrawerSurface',
  standalone: true,
  hostDirectives: [
    { directive: CngxFocusTrap, inputs: [], outputs: [] },
    { directive: CngxFocusRestore, inputs: [], outputs: [] },
    { directive: CngxClickOutside, inputs: [], outputs: [] },
  ],
  providers: [
    { provide: CNGX_FOCUS_TRAP_DRIVER, useExisting: CngxDrawerSurface },
    { provide: CNGX_FOCUS_RESTORE_DRIVER, useExisting: CngxDrawerSurface },
    { provide: CNGX_CLICK_OUTSIDE_DRIVER, useExisting: CngxDrawerSurface },
    { provide: CNGX_HOTKEY_SCOPE, useFactory: () => inject(CngxDrawerSurface).hotkeyScope },
  ],
  host: {
    '[attr.role]': 'surfaceRole()',
    '[attr.aria-modal]': "engagedPage() ? 'true' : null",
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.tabindex]': 'hostTabindex()',
    '(keydown.escape)': 'handleEscape($event)',
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
   * How far the engaged surface takes over the page: `'page'` (modal dialog,
   * inert up to `<body>`), `'contained'` (inert and scroll lock inside the
   * boundary only, no trap) or `'none'`. See {@link CngxDrawerModality}.
   */
  readonly modality = input<CngxDrawerModality>('page');
  /**
   * Landmark role while the surface is not an engaged page modal. Defaults
   * to `complementary`; pass `navigation` for a nav surface, or `null` on a
   * `<nav>` / `<aside>` host to keep its implicit role. A composer's driver
   * wins over it.
   */
  readonly role = input<string | null>('complementary');
  /**
   * Accessible name of the surface. An engaged page modal (a `dialog`)
   * without one falls back to a static `aria-label` on the host, then to
   * `CNGX_LAYOUT_I18N.drawerDialog`; a host with a static `aria-labelledby`
   * keeps that name. Outside an engaged page modal only a bound label or a
   * static `aria-label` names the landmark.
   */
  readonly labelInput = input<string | undefined>(undefined, { alias: 'label' });
  /**
   * Emitted when the user asks to dismiss the engaged surface: Escape, the
   * back gesture, or a press outside the host. The owner closes it.
   */
  readonly dismiss = output<void>();

  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly doc = inject(DOCUMENT);
  private readonly domReady = signal(false);
  private readonly focusTrap = inject(CngxFocusTrap, { self: true });
  private readonly i18n = injectLayoutI18n();
  private readonly staticLabel = inject(new HostAttributeToken('aria-label'), { optional: true });
  private readonly staticLabelledBy = inject(new HostAttributeToken('aria-labelledby'), {
    optional: true,
  });
  private readonly staticTabindex = inject(new HostAttributeToken('tabindex'), { optional: true });
  private destroyed = false;
  // Chromium also turns an unhandled Escape keydown, wherever focus is, into
  // a CloseWatcher close. Escape belongs to the keydown path (focus inside
  // the host, the drawer for its content), so a watcher close from the same
  // keypress is not a back gesture. The flag lives for the keydown task only.
  private escapeKeyTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly escapeKeydown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape') {
      return;
    }
    this.clearEscapeKey();
    this.escapeKeyTimer = setTimeout(() => {
      this.escapeKeyTimer = null;
    });
  };

  private resolvedDriver: CngxDrawerSurfaceDriver | null | undefined = undefined;
  private driver(): CngxDrawerSurfaceDriver | null {
    if (this.resolvedDriver === undefined) {
      this.resolvedDriver = this.injector.get(CNGX_DRAWER_SURFACE_DRIVER, null, { self: true });
    }
    return this.resolvedDriver;
  }

  /** Whether the surface is engaged, after the driver. */
  readonly isActive = computed(() => this.driver()?.surfaceActive() ?? this.active());
  /** The modality of the surface, after the driver. */
  readonly resolvedModality = computed<CngxDrawerModality>(
    () => this.driver()?.surfaceModality() ?? this.modality(),
  );

  /** The modality while engaged; `'none'` while the surface is not active. */
  protected readonly engagedModality = computed<CngxDrawerModality>(() =>
    this.isActive() ? this.resolvedModality() : 'none',
  );
  protected readonly engagedPage = computed(() => this.engagedModality() === 'page');

  /**
   * @internal Hotkey scope of the surface subtree: modal while engaged as
   * `'page'` or `'contained'`, so app bindings outside stay quiet while focus
   * is inside. Always active: the drawer's own bindings (toggle, close) must
   * fire whether the surface is engaged or not.
   */
  readonly hotkeyScope: CngxHotkeyScopeNode = createHotkeyScope({
    element: this.host,
    modal: computed(() => this.engagedModality() !== 'none'),
    parent: inject(CNGX_HOTKEY_SCOPE, { optional: true, skipSelf: true }),
    destroyRef: inject(DestroyRef),
  });
  protected readonly surfaceRole = computed(() => {
    if (this.engagedPage()) {
      return 'dialog';
    }
    const landmark = this.driver()?.surfaceLandmarkRole;
    return landmark ? landmark() : this.role();
  });

  // A static aria-label or aria-labelledby names the host already; the
  // fallback only fills a nameless engaged dialog.
  private readonly namesWithFallback = computed(
    () => this.engagedPage() && this.staticLabel === null && this.staticLabelledBy === null,
  );
  /**
   * The resolved accessible name: the bound `label`, else a static
   * `aria-label`, else (engaged page modal without a static name)
   * `CNGX_LAYOUT_I18N.drawerDialog`.
   */
  readonly label = computed<string | undefined>(() => {
    const driven = this.driver()?.surfaceLabel;
    if (driven) {
      return driven();
    }
    return this.namesWithFallback()
      ? (this.labelInput() ?? this.i18n().drawerDialog)
      : (this.labelInput() ?? this.staticLabel ?? undefined);
  });
  protected readonly ariaLabel = computed(() => this.label() ?? null);

  /** @internal Drives the composed `CngxFocusTrap`. */
  readonly focusTrapEnabled = this.engagedPage;
  /** @internal Drives the composed `CngxFocusTrap`. */
  readonly focusTrapAutoFocus = true;
  /**
   * @internal Drives the composed `CngxFocusRestore`. The restore edge can
   * run before the scope effect below releases `inert` around the host; the
   * restore then focuses the opener after the render, once it is live.
   */
  readonly focusRestoreActive = this.isActive;

  /**
   * @internal Drives the composed `CngxFocusRestore`: when the surface was
   * engaged with focus already inside it (a docked rail that turned into a
   * drawer), there is no opener to return to, so focus goes to the element
   * whose `aria-controls` names the host, the same relation an outside press
   * is exempted by.
   */
  focusRestoreFallback(): HTMLElement | null {
    const id = this.host.id;
    if (!id) {
      return null;
    }
    const trigger = this.doc.querySelector(`[aria-controls~="${id.replace(/["\\]/g, '\\$&')}"]`);
    return trigger instanceof HTMLElement && !this.host.contains(trigger) ? trigger : null;
  }
  // A press on a non-focusable spot inside an engaged surface would drop
  // focus to <body>, out of reach of the host Escape listener (and of the
  // page modal's own boundary). tabindex="-1" keeps focus on the host there,
  // like a native <dialog>; it adds no Tab stop. A consumer tabindex wins.
  protected readonly hostTabindex = computed(
    () => this.staticTabindex ?? (this.isActive() ? '-1' : null),
  );
  /** @internal Drives the composed `CngxClickOutside`. */
  readonly clickOutsideEnabled = computed(
    () => this.isActive() && (this.driver()?.surfaceOutsideDismiss?.() ?? true),
  );

  private readonly closeWatcher = createCloseWatcher(
    () => this.handleCloseRequest(),
    injectWindow(),
  );

  constructor() {
    afterNextRender(() => this.domReady.set(true));
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      this.clearEscapeKey();
      this.closeWatcher.disarm();
    });

    inject(CngxClickOutside, { self: true }).clickOutside.subscribe(() => this.requestDismiss());

    effect((onCleanup) => {
      if (!this.isActive()) {
        return;
      }
      untracked(() => {
        this.doc.addEventListener('keydown', this.escapeKeydown, true);
        this.closeWatcher.arm();
      });
      onCleanup(() => {
        this.doc.removeEventListener('keydown', this.escapeKeydown, true);
        this.clearEscapeKey();
        this.closeWatcher.disarm();
      });
    });

    effect((onCleanup) => {
      const modality = this.engagedModality();
      if (!this.domReady() || modality === 'none') {
        return;
      }
      const release = untracked(() =>
        modality === 'page' ? this.holdPageScope() : this.holdContainedScope(),
      );
      onCleanup(release);
    });
  }

  private holdPageScope(): () => void {
    const releaseInert = createInertSiblings(this.host, { scope: 'outside' });
    const releaseLock = createScrollLock(this.scrollScope(this.doc.documentElement));
    return () => {
      releaseInert();
      releaseLock();
    };
  }

  // No trap: focus moves in once, Tab may leave for the live page around
  // the boundary. The trap's focusFirst() waits for the render that drops
  // the closed panel's inert.
  private holdContainedScope(): () => void {
    const boundary = this.containedBoundary();
    const id = this.host.id;
    const releaseInert = createInertSiblings(this.host, {
      scope: 'outside',
      within: boundary,
      keepLive: id ? `[aria-controls~="${id.replace(/["\\]/g, '\\$&')}"]` : undefined,
    });
    const scroller = this.scrollScope(null, boundary);
    const releaseLock = scroller ? createScrollLock(scroller) : null;
    this.focusTrap.focusFirst();
    return () => {
      releaseInert();
      releaseLock?.();
    };
  }

  private containedBoundary(): HTMLElement {
    const named = this.driver()?.surfaceBoundary?.();
    if (named && named !== this.host && named.contains(this.host)) {
      return named;
    }
    return this.host.parentElement ?? this.doc.body;
  }

  // An inner surface or an open popover inside the host takes the keypress
  // first; one Escape dismisses one layer.
  protected handleEscape(event: Event): void {
    if (!this.isActive() || escapeOwnedAbove(event, this.host)) {
      return;
    }
    claimEscape(event);
    this.emitDismiss();
  }

  private clearEscapeKey(): void {
    if (this.escapeKeyTimer !== null) {
      clearTimeout(this.escapeKeyTimer);
      this.escapeKeyTimer = null;
    }
  }

  private handleCloseRequest(): void {
    if (this.escapeKeyTimer === null) {
      this.emitDismiss();
    }
    this.rearmIfEngaged();
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

  // The nearest ancestor with a scrolling overflow-y, searched up to `stop`
  // (inclusive) or to the document root.
  private scrollScope<T extends HTMLElement | null>(
    fallback: T,
    stop?: HTMLElement,
  ): HTMLElement | T {
    const view = this.doc.defaultView;
    let node = this.host.parentElement;
    while (node && node !== this.doc.body && node !== this.doc.documentElement) {
      const overflowY = view?.getComputedStyle(node).overflowY ?? '';
      if (SCROLLING_OVERFLOW.has(overflowY)) {
        return node;
      }
      if (node === stop) {
        break;
      }
      node = node.parentElement;
    }
    return fallback;
  }
}
