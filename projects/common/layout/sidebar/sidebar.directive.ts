import { DOCUMENT } from '@angular/common';
import {
  computed,
  Directive,
  effect,
  ElementRef,
  HostAttributeToken,
  inject,
  InjectionToken,
  Injector,
  input,
  linkedSignal,
  model,
  type Signal,
  signal,
  untracked,
} from '@angular/core';
import {
  CNGX_HOVER_INTENT_DRIVER,
  CngxHoverIntent,
  type CngxHoverIntentDriver,
} from '@cngx/common/interactive';
import { nextUid } from '@cngx/core/utils';

import { injectLayoutI18n } from '../i18n/layout-i18n';
import {
  CNGX_PANEL_TARGET,
  type CngxPanelMode,
  type CngxPanelTarget,
} from '../panel-trigger/panel-target';

/**
 * How a collapsed `CngxSidebar` rests: as a narrow, operable `rail`, or
 * `hidden` (no reserved space, `inert`).
 *
 * @since 0.1.0
 */
export type CngxSidebarCollapsedAs = 'rail' | 'hidden';

/**
 * The edge a `CngxSidebar` sits on, in the writing direction: a `start`
 * sidebar peeks towards the end, an `end` sidebar towards the start.
 *
 * @since 0.1.0
 */
export type CngxSidebarSide = 'start' | 'end';

/**
 * The resting state a `CngxSidebar` renders as `data-sidebar-state`.
 *
 * @since 0.1.0
 */
export type CngxSidebarState = 'expanded' | 'rail' | 'hidden' | 'peek';

/**
 * @internal Lets a component that composes `CngxSidebar` as a host directive
 * decide what the sidebar renders from its own state (a sidenav maps its
 * width class onto the sidebar). Provided by the composer on the same
 * element (`useExisting`); the sidebar resolves it lazily with `self: true`,
 * because the composer constructs after its host directives. The consumer's
 * `[(collapsed)]` stays the persisted user decision; the driver only decides
 * what is rendered.
 */
export interface CngxSidebarDriver {
  /** The collapsed state the sidebar renders; wins over `[(collapsed)]`. */
  readonly sidebarCollapsed: Signal<boolean>;
  /** The collapsed rest the sidebar renders; wins over `[collapsedAs]`. */
  readonly sidebarCollapsedAs?: Signal<CngxSidebarCollapsedAs>;
  /** Shows a collapsed sidebar at full size over the content while `true`. */
  readonly sidebarPeek?: Signal<boolean>;
  /** Conceals the sidebar (`inert` + `aria-hidden`) while `true`, in any state. */
  readonly sidebarConcealed?: Signal<boolean>;
  /** Accessible name; wins over `[label]` and the i18n fallback. */
  readonly sidebarLabel?: Signal<string>;
}

/** @internal See {@link CngxSidebarDriver}. */
export const CNGX_SIDEBAR_DRIVER = new InjectionToken<CngxSidebarDriver>('CngxSidebarDriver');

/**
 * The brain of a persistent side region: a sidebar that stays in the layout
 * and reserves inline space, unlike a drawer, which is transient.
 *
 * `collapsed` (two-way) switches between the expanded size and the
 * collapsed rest, `collapsedAs` picks the rest: a `rail` stays operable at
 * `--cngx-sidebar-rail-size`, `hidden` reserves nothing and becomes `inert`
 * + `aria-hidden`. A collapsed sidebar can **peek**: it shows at full size
 * over the content without reflowing it (the reserved space stays at the
 * rest size). Peek comes from the pointer resting on the host
 * (`CngxHoverIntent`, gated by `expandOnHover`) or from `peek()`, and ends
 * on Escape (wherever focus is, so a hover peek over the page is
 * dismissible without moving focus, WCAG 1.4.13), on a press outside the
 * host (a press on the trigger whose `aria-controls` names the sidebar is
 * left to the trigger), when focus leaves the host, or when the pointer
 * leaves the host after resting on it. A `peek()` from a trigger outside the
 * host therefore stays until one of these happens, even if the pointer never
 * enters.
 * `pin()` turns a peek into the expanded state.
 *
 * `side` names the edge the sidebar sits on (`start`, default, or `end` for
 * an inspector after the content); a peek grows away from it.
 *
 * Sizes are tokens with fallbacks: `--cngx-sidebar-size` (expanded, default
 * `16rem`) and `--cngx-sidebar-rail-size` (default `3.5rem`), plus
 * `--cngx-sidebar-peek-z-index`. The host renders `data-sidebar-state`
 * (`expanded | rail | hidden | peek`) for skins.
 *
 * The sidebar is a `CngxPanelTarget` and provides `CNGX_PANEL_TARGET`: a
 * `[cngxPanelTrigger]="sidebar"` mirrors `expanded` and toggles `collapsed`;
 * `action="peek"` peeks. It knows neither a nav model nor a rail
 * representation; what the rail shows is the consumer's.
 *
 * ```html
 * <button type="button" [cngxPanelTrigger]="sidebar"></button>
 * <div style="display: flex">
 *   <nav cngxSidebar #sidebar="cngxSidebar" [(collapsed)]="collapsed" [role]="null">…</nav>
 *   <main>…</main>
 * </div>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/layout/sidebar/sidebar.directive.ts
 * @since 0.1.0
 * @relatedTo CngxPanelTrigger, CngxDrawer, CngxHoverIntent, CngxResizable
 * <example-url>/#/common/layout/sidebar/clipped-below-header</example-url>
 * <example-url>/#/common/layout/sidebar/collapsible-rail</example-url>
 * <example-url>/#/common/layout/sidebar/inset-app-sidebar</example-url>
 * <example-url>/#/common/layout/sidebar/projected-toggle-glyph</example-url>
 * @axis level molecule
 */
@Directive({
  selector: '[cngxSidebar]',
  exportAs: 'cngxSidebar',
  standalone: true,
  hostDirectives: [CngxHoverIntent],
  providers: [
    { provide: CNGX_PANEL_TARGET, useExisting: CngxSidebar },
    { provide: CNGX_HOVER_INTENT_DRIVER, useExisting: CngxSidebar },
  ],
  host: {
    '[attr.id]': 'id()',
    '[attr.role]': 'role()',
    '[attr.aria-label]': 'label()',
    '[attr.inert]': "concealed() ? '' : null",
    '[attr.aria-hidden]': "concealed() ? 'true' : null",
    '[attr.data-sidebar-state]': 'state()',
    '[style.inline-size]': 'inlineSize()',
    '[style.margin-inline-end]': "side() === 'start' ? peekOffset() : null",
    '[style.margin-inline-start]': "side() === 'end' ? peekOffset() : null",
    '[style.z-index]': "peeked() ? 'var(--cngx-sidebar-peek-z-index, 2)' : null",
    '(keydown.escape)': 'handleEscape()',
    '(focusout)': 'handleFocusOut($event)',
  },
})
export class CngxSidebar implements CngxPanelTarget, CngxHoverIntentDriver {
  /** Whether the sidebar rests collapsed. Two-way: `[(collapsed)]`. */
  readonly collapsed = model<boolean>(false);
  /** How a collapsed sidebar rests: an operable `rail` or `hidden`. */
  readonly collapsedAs = input<CngxSidebarCollapsedAs>('rail');
  /**
   * {@link CngxPanelTarget}: the edge the sidebar sits on, in the writing
   * direction. A peek grows away from it.
   */
  readonly side = input<CngxSidebarSide>('start');
  /** Whether the pointer resting on a collapsed sidebar peeks it. */
  readonly expandOnHover = input<boolean>(true);
  /**
   * ms the pointer rests on a collapsed sidebar before it peeks. Unbound,
   * `CNGX_HOVER_INTENT_DEFAULTS` applies, then 120.
   */
  readonly expandDelay = input<number | undefined>(undefined);
  /**
   * ms after the pointer leaves before a hover peek ends. Unbound,
   * `CNGX_HOVER_INTENT_DEFAULTS` applies, then 0.
   */
  readonly collapseDelay = input<number | undefined>(undefined);
  /** @internal Drives the composed `CngxHoverIntent`. */
  readonly hoverEnterDelay = this.expandDelay;
  /** @internal Drives the composed `CngxHoverIntent`. */
  readonly hoverLeaveDelay = this.collapseDelay;
  /**
   * Landmark role. Defaults to `complementary`; pass `navigation` for a nav
   * sidebar, or `null` on a `<nav>` / `<aside>` host to keep its implicit role.
   */
  readonly role = input<string | null>('complementary');
  /** Accessible name of the region. Falls back to `CNGX_LAYOUT_I18N.sidebarRegion`. */
  readonly labelInput = input<string | undefined>(undefined, { alias: 'label' });

  private readonly hover = inject(CngxHoverIntent, { self: true });
  private readonly injector = inject(Injector);
  private resolvedDriver: CngxSidebarDriver | null | undefined = undefined;
  private driver(): CngxSidebarDriver | null {
    if (this.resolvedDriver === undefined) {
      this.resolvedDriver = this.injector.get(CNGX_SIDEBAR_DRIVER, null, { self: true });
    }
    return this.resolvedDriver;
  }
  // What the sidebar renders: the driver wins over the inputs.
  private readonly restCollapsed = computed(
    () => this.driver()?.sidebarCollapsed() ?? this.collapsed(),
  );
  private readonly restAs = computed(
    () => this.driver()?.sidebarCollapsedAs?.() ?? this.collapsedAs(),
  );
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly doc = inject(DOCUMENT);
  private readonly i18n = injectLayoutI18n();
  // An explicit peek ends when the pointer leaves the host after resting on
  // it; a pointer that never entered (a peek from an outside trigger) keeps
  // it until a press outside, Escape or focus leaving.
  private readonly peekState = linkedSignal<boolean, boolean>({
    source: this.hover.active,
    computation: (active, previous) => active && (previous?.value ?? false),
  });
  // Escape ends a hover peek while the pointer still rests on the host; the
  // next hover edge lifts the suppression.
  private readonly hoverSuppressed = linkedSignal({
    source: this.hover.active,
    computation: () => false,
  });

  /**
   * The host `id` (a static `id` attribute, else a generated one); the
   * trigger's `aria-controls`.
   */
  readonly id = signal(
    inject(new HostAttributeToken('id'), { optional: true }) ?? nextUid('cngx-sidebar'),
  ).asReadonly();

  /** {@link CngxPanelTarget}: a sidebar reserves inline space, it is never an overlay. */
  readonly mode = signal<CngxPanelMode>('inline').asReadonly();

  /** Whether a collapsed sidebar currently shows at full size over the content. */
  readonly peeked = computed(() => {
    if (!this.restCollapsed()) {
      return false;
    }
    if (this.peekState() || (this.driver()?.sidebarPeek?.() ?? false)) {
      return true;
    }
    return this.expandOnHover() && this.hover.active() && !this.hoverSuppressed();
  });

  /** Whether the sidebar shows at full size: expanded, or collapsed and peeked. */
  readonly expanded = computed(() => !this.restCollapsed() || this.peeked());

  /** The rendered state: `expanded`, `peek`, or the collapsed rest. */
  readonly state = computed<CngxSidebarState>(() => {
    if (!this.restCollapsed()) {
      return 'expanded';
    }
    return this.peeked() ? 'peek' : this.restAs();
  });

  protected readonly concealed = computed(
    () => this.state() === 'hidden' || (this.driver()?.sidebarConcealed?.() ?? false),
  );
  /**
   * {@link CngxPanelTarget}: the region's resolved accessible name, the bound
   * `label` or `CNGX_LAYOUT_I18N.sidebarRegion`. An icon-only trigger takes
   * it as its name.
   */
  readonly label = computed(
    () => this.driver()?.sidebarLabel?.() ?? this.labelInput() ?? this.i18n().sidebarRegion,
  );

  protected readonly inlineSize = computed(() => {
    switch (this.state()) {
      case 'rail':
        return 'var(--cngx-sidebar-rail-size, 3.5rem)';
      case 'hidden':
        return '0px';
      default:
        return 'var(--cngx-sidebar-size, 16rem)';
    }
  });

  // A peek keeps the rest footprint: a negative margin on the edge facing
  // the content cancels the growth, so the content does not reflow.
  protected readonly peekOffset = computed(() => {
    if (!this.peeked()) {
      return null;
    }
    const rest = this.restAs() === 'rail' ? 'var(--cngx-sidebar-rail-size, 3.5rem)' : '0px';
    return `calc(${rest} - var(--cngx-sidebar-size, 16rem))`;
  });

  constructor() {
    // The hidden rest moves focus out first: aria-hidden on an element that
    // holds focus is blocked (and warned about) by the browser, and inert
    // alone would only drop focus on the next rendering step. A composer that
    // conceals through the driver owns that move, since it may keep focus
    // inside by changing its own state in the same pass.
    effect(() => {
      if (this.state() !== 'hidden') {
        return;
      }
      untracked(() => {
        const active = this.doc.activeElement;
        if (active instanceof HTMLElement && this.host.contains(active)) {
          active.blur();
        }
      });
    });

    // A peek is content shown on hover: Escape must dismiss it even while
    // focus sits elsewhere on the page. Listen on the document only while
    // peeked; an Escape inside the host is the host binding's.
    effect((onCleanup) => {
      if (!this.peeked()) {
        return;
      }
      const onKeydown = (event: KeyboardEvent): void => {
        if (event.key !== 'Escape') {
          return;
        }
        if (event.target instanceof Node && this.host.contains(event.target)) {
          return;
        }
        this.unpeek();
      };
      // A press on the page beside the peek ends it; the trigger that names
      // the sidebar in aria-controls handles its own press.
      const onPointerDown = (event: PointerEvent): void => {
        const target = event.target;
        if (!(target instanceof Element) || this.host.contains(target)) {
          return;
        }
        if (this.isController(target)) {
          return;
        }
        this.unpeek();
      };
      this.doc.addEventListener('keydown', onKeydown);
      this.doc.addEventListener('pointerdown', onPointerDown, true);
      onCleanup(() => {
        this.doc.removeEventListener('keydown', onKeydown);
        this.doc.removeEventListener('pointerdown', onPointerDown, true);
      });
    });
  }

  /** Collapses an expanded sidebar, expands a collapsed one. Ends a peek. */
  toggle(): void {
    this.peekState.set(false);
    this.collapsed.update((collapsed) => !collapsed);
  }

  /** Shows a collapsed sidebar at full size over the content until dismissed. */
  peek(): void {
    if (this.restCollapsed()) {
      this.peekState.set(true);
    }
  }

  /** Ends a peek without changing `collapsed`. */
  unpeek(): void {
    this.peekState.set(false);
    if (this.hover.active()) {
      this.hoverSuppressed.set(true);
    }
  }

  /** Keeps the sidebar expanded: `collapsed = false`, any peek ends. */
  pin(): void {
    this.peekState.set(false);
    this.collapsed.set(false);
  }

  private isController(target: Element): boolean {
    const controller = target.closest('[aria-controls]');
    const ids = controller?.getAttribute('aria-controls')?.split(/\s+/) ?? [];
    return ids.includes(this.id());
  }

  protected handleEscape(): void {
    if (this.peeked()) {
      this.unpeek();
    }
  }

  protected handleFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget;
    if (next instanceof Node && this.host.contains(next)) {
      return;
    }
    this.peekState.set(false);
  }
}
