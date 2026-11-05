import { DOCUMENT } from '@angular/common';
import {
  computed,
  Directive,
  effect,
  ElementRef,
  HostAttributeToken,
  inject,
  input,
  linkedSignal,
  model,
  signal,
} from '@angular/core';
import { CngxHoverIntent } from '@cngx/common/interactive';
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
 * dismissible without moving focus, WCAG 1.4.13), when focus leaves the
 * host, or when the pointer leaves.
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
 * @axis level molecule
 */
@Directive({
  selector: '[cngxSidebar]',
  exportAs: 'cngxSidebar',
  standalone: true,
  hostDirectives: [
    {
      directive: CngxHoverIntent,
      inputs: ['enterDelay: expandDelay', 'leaveDelay: collapseDelay'],
    },
  ],
  providers: [{ provide: CNGX_PANEL_TARGET, useExisting: CngxSidebar }],
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
export class CngxSidebar implements CngxPanelTarget {
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
   * Landmark role. Defaults to `complementary`; pass `navigation` for a nav
   * sidebar, or `null` on a `<nav>` / `<aside>` host to keep its implicit role.
   */
  readonly role = input<string | null>('complementary');
  /** Accessible name of the region. Falls back to `CNGX_LAYOUT_I18N.sidebarRegion`. */
  readonly labelInput = input<string | undefined>(undefined, { alias: 'label' });

  private readonly hover = inject(CngxHoverIntent, { self: true });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly doc = inject(DOCUMENT);
  private readonly i18n = injectLayoutI18n();
  private readonly peekState = signal(false);
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
    if (!this.collapsed()) {
      return false;
    }
    if (this.peekState()) {
      return true;
    }
    return this.expandOnHover() && this.hover.active() && !this.hoverSuppressed();
  });

  /** Whether the sidebar shows at full size: expanded, or collapsed and peeked. */
  readonly expanded = computed(() => !this.collapsed() || this.peeked());

  /** The rendered state: `expanded`, `peek`, or the collapsed rest. */
  readonly state = computed<CngxSidebarState>(() => {
    if (!this.collapsed()) {
      return 'expanded';
    }
    return this.peeked() ? 'peek' : this.collapsedAs();
  });

  protected readonly concealed = computed(() => this.state() === 'hidden');
  /**
   * {@link CngxPanelTarget}: the region's resolved accessible name, the bound
   * `label` or `CNGX_LAYOUT_I18N.sidebarRegion`. An icon-only trigger takes
   * it as its name.
   */
  readonly label = computed(() => this.labelInput() ?? this.i18n().sidebarRegion);

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
    const rest = this.collapsedAs() === 'rail' ? 'var(--cngx-sidebar-rail-size, 3.5rem)' : '0px';
    return `calc(${rest} - var(--cngx-sidebar-size, 16rem))`;
  });

  constructor() {
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
      this.doc.addEventListener('keydown', onKeydown);
      onCleanup(() => this.doc.removeEventListener('keydown', onKeydown));
    });
  }

  /** Collapses an expanded sidebar, expands a collapsed one. Ends a peek. */
  toggle(): void {
    this.peekState.set(false);
    this.collapsed.update((collapsed) => !collapsed);
  }

  /** Shows a collapsed sidebar at full size over the content until dismissed. */
  peek(): void {
    if (this.collapsed()) {
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
