import {
  afterNextRender,
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  isDevMode,
  linkedSignal,
  untracked,
} from '@angular/core';

import { nextUid } from '@cngx/core/utils';

import {
  CNGX_HOVER_INTENT_DEFAULTS,
  CngxHoverIntent,
} from '../hover-intent/hover-intent.directive';
import { CNGX_MENU_ANNOUNCER_FACTORY } from './menu-announcer';
import { injectMenuConfig } from './menu-config';
import { CNGX_MENU_HOST, type CngxMenuHost } from './menu-host.token';
import { CngxMenuItem } from './menu-item.directive';
import {
  CNGX_MENU_SUBMENU_ITEM,
  CNGX_MENU_SUBMENU_WIRING,
  type CngxMenuSubmenuLike,
  type CngxMenuSubmenuPopoverRef,
} from './menu-submenu.token';

/**
 * Companion directive applied to a `[cngxMenuItem]` that opens a nested
 * submenu. The directive itself does NOT render `role="menuitem"` - that
 * stays on `CngxMenuItem`. Adds `aria-haspopup="menu"` and reactive
 * `aria-expanded`, registers itself with the surrounding menu as a
 * submenu source so the menu trigger can drive arrow-right / arrow-left
 * focus-stack semantics.
 *
 * Wiring, two ways (Bridge-Input-Regel):
 * - `cngxMenuItemSubmenu` + `submenuMenu` inputs bind the popover and the
 *   inner `CngxMenu` directly, or
 * - a component shell provides `CNGX_MENU_SUBMENU_WIRING` and omits both
 *   inputs, so the brain resolves them from DI.
 *
 * Until one source is present the brain stays inert: it renders neither
 * `aria-haspopup` nor `aria-expanded` and opens nothing.
 *
 * The submenu popover needs no `[exclusive]` binding: a popover nested
 * inside another never evicts its ancestor, so opening the submenu leaves
 * the parent popover open by default. An explicit `[exclusive]="false"`
 * remains valid (it additionally opts the submenu out of evicting
 * unrelated sibling popovers) but is no longer required for nesting.
 *
 * @category common/interactive/menu
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/menu/menu-item-submenu.directive.ts
 * @since 0.1.0
 * @relatedTo CngxMenuItem, CngxMenu, CngxMenuTrigger
 * <example-url>http://localhost:4200/#/common/interactive/menu/submenu/two-level-submenu</example-url>
 */
@Directive({
  selector: '[cngxMenuItemSubmenu]',
  exportAs: 'cngxMenuItemSubmenu',
  standalone: true,
  // Debounced hover intent over the parent item: CngxHoverIntent's own
  // pointerenter/pointerleave listeners replace hand-rolled ones; the popover
  // panel is fed in as a satellite surface (see the constructor effect), so
  // ONE debounce covers parent + panel and crossing the gap never flickers.
  hostDirectives: [CngxHoverIntent],
  // Element-injector provider: the composed CngxHoverIntent resolves its dwell
  // defaults from here, so the menu config's submenuOpenDelay/submenuCloseDelay
  // reach the atom without per-instance inputs (mirrors CngxSidenav).
  providers: [
    { provide: CNGX_MENU_SUBMENU_ITEM, useExisting: CngxMenuItemSubmenu },
    {
      provide: CNGX_HOVER_INTENT_DEFAULTS,
      useFactory: () => {
        const cfg = injectMenuConfig();
        return { enterDelay: cfg.submenuOpenDelay, leaveDelay: cfg.submenuCloseDelay };
      },
    },
  ],
  host: {
    '[id]': 'id',
    '[attr.aria-haspopup]': 'ariaHaspopup()',
    '[attr.aria-expanded]': 'ariaExpanded()',
    '[style.anchor-name]': 'cssAnchorName()',
  },
})
export class CngxMenuItemSubmenu implements CngxMenuSubmenuLike {
  /**
   * Popover wrapping the submenu. Optional - a component shell can instead
   * provide `CNGX_MENU_SUBMENU_WIRING` (Bridge-Input-Regel: an optional DI
   * fallback forbids `input.required`; the empty-string transform keeps a
   * bare `cngxMenuItemSubmenu` attribute from binding `''`).
   */
  readonly popover = input<
    CngxMenuSubmenuPopoverRef | undefined,
    CngxMenuSubmenuPopoverRef | '' | undefined
  >(undefined, {
    alias: 'cngxMenuItemSubmenu',
    transform: (v) => (typeof v === 'string' ? undefined : v),
  });

  /** Inner `CngxMenuHost` (the submenu's own `CngxMenu`). Optional; resolved from DI wiring when omitted. */
  readonly submenuMenu = input<CngxMenuHost | undefined, CngxMenuHost | '' | undefined>(undefined, {
    transform: (v) => (typeof v === 'string' ? undefined : v),
  });

  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly menuItem = inject(CngxMenuItem, { optional: true, self: true });
  private readonly menuHost = inject(CNGX_MENU_HOST, { optional: true });
  private readonly wiring = inject(CNGX_MENU_SUBMENU_WIRING, { optional: true });
  private readonly announcer = inject(CNGX_MENU_ANNOUNCER_FACTORY)();
  private readonly menuConfig = injectMenuConfig();
  private readonly destroyRef = inject(DestroyRef);
  private readonly ownId = nextUid('cngx-menu-submenu');

  /** Popover resolved from the input, else the DI wiring fallback. */
  private readonly resolvedPopover = computed<CngxMenuSubmenuPopoverRef | null>(
    () => this.popover() ?? this.wiring?.popover() ?? null,
  );
  /** Inner menu resolved from the input, else the DI wiring fallback. */
  private readonly resolvedMenu = computed<CngxMenuHost | null>(
    () => this.submenuMenu() ?? this.wiring?.menu() ?? null,
  );
  /** True once both the popover and inner menu are wired (input or DI). */
  private readonly wired = computed<boolean>(
    () => this.resolvedPopover() !== null && this.resolvedMenu() !== null,
  );

  /**
   * Effective id used by `CngxMenuHost.submenuItems().find(s => s.id ===
   * activeId)`. When applied alongside `[cngxMenuItem]` the directive
   * mirrors the sibling's id so the trigger's lookup matches the AD's
   * `activeId`. When applied alone (no sibling), falls back to a fresh
   * `nextUid`.
   */
  get id(): string {
    return this.menuItem?.id ?? this.ownId;
  }

  readonly isOpen = computed<boolean>(() => this.resolvedPopover()?.isVisible() ?? false);

  /** `aria-haspopup="menu"` only while wired; `null` keeps the brain inert. */
  protected readonly ariaHaspopup = computed<string | null>(() => (this.wired() ? 'menu' : null));
  /** `aria-expanded` mirrors open state while wired; `null` otherwise. */
  protected readonly ariaExpanded = computed<boolean | null>(() =>
    this.wired() ? this.isOpen() : null,
  );
  /** CSS Anchor Positioning name - `null` while unwired. */
  protected readonly cssAnchorName = computed<string | null>(() => {
    const popover = this.resolvedPopover();
    return popover ? `--cngx-pop-${popover.id()}` : null;
  });

  get inner(): CngxMenuHost {
    // Typed non-null for the wired contract, but resolves null while unwired -
    // the context-menu organism applies this directive to every item, so leaf
    // items register an inert brain whose inner never resolves. The stack
    // primitives read it defensively (cast to `CngxMenuHost | null`) and treat
    // null as inert.
    return this.resolvedMenu()!;
  }

  open(): void {
    const popover = this.resolvedPopover();
    if (!popover) {
      return;
    }
    popover.anchorElement.set(this.elementRef.nativeElement as HTMLElement);
    if (!popover.isVisible()) {
      popover.show();
    }
  }

  close(): void {
    const popover = this.resolvedPopover();
    if (popover?.isVisible()) {
      popover.hide();
    }
  }

  /**
   * Composed hover-intent atom (hostDirective). Its own host listeners cover
   * the parent item; the constructor effect feeds the popover panel in as a
   * satellite surface, so `active()` settles `true` after `submenuOpenDelay`
   * ms over either element and back `false` after `submenuCloseDelay` ms off
   * both. The atom owns every timer (and its destroy cleanup).
   */
  private readonly intent = inject(CngxHoverIntent, { host: true });

  /**
   * `CngxMenuSubmenuLike.hoverIntent` - the debounced combined-surface hover
   * state. Derivation only: the brain never opens or closes anything off it.
   * The surrounding trigger routes the edges through its focus stack
   * (`connectSubmenuHoverToFocusStack`), so a hover-opened submenu is
   * stack-tracked and keyboard-visible exactly like a keyboard-opened one.
   */
  readonly hoverIntent = this.intent.active;

  /**
   * Transition tracker for `isOpen`. `linkedSignal` carries an explicit
   * structural `equal` so the effect below only fires on a real
   * boolean transition, not on every parent re-eval.
   */
  private readonly transition = linkedSignal<boolean, { current: boolean; previous: boolean }>({
    source: this.isOpen,
    computation: (current, prev) => ({
      current,
      previous: prev?.value.current ?? false,
    }),
    equal: (a, b) => a.current === b.current && a.previous === b.previous,
  });

  constructor() {
    // Register with the surrounding menu via DI (not a content query) so this
    // submenu is discovered even when declared inside a wrapper component's
    // template. The menu reads `id` / `inner` / `isOpen` lazily at routing
    // time, by which point the wiring (input or DI) is resolved.
    const deregister = this.menuHost?.registerSubmenuItem(this);
    if (deregister) {
      this.destroyRef.onDestroy(deregister);
    }

    effect(() => {
      const { current, previous } = this.transition();
      if (current === previous) {
        return;
      }
      untracked(() => {
        if (current) {
          this.announcer.announce(this.menuConfig.ariaLabels.submenuOpened);
        } else {
          this.announcer.announce(this.menuConfig.ariaLabels.submenuClosed);
        }
      });
    });

    // Feed the popover panel into the composed hover intent as a satellite
    // surface. An effect (not a one-shot afterNextRender) so a popover that
    // resolves late - DI wiring bound after first render - still gets its
    // listeners, and `onCleanup` removes them unconditionally on destroy.
    effect((onCleanup) => {
      const popover = this.resolvedPopover();
      if (!popover) {
        return;
      }
      const popoverEl = popover.elementRef.nativeElement;
      const onEnter = (): void => this.intent.notifyEnter();
      const onLeave = (): void => this.intent.notifyLeave();
      popoverEl.addEventListener('pointerenter', onEnter);
      popoverEl.addEventListener('pointerleave', onLeave);
      onCleanup(() => {
        popoverEl.removeEventListener('pointerenter', onEnter);
        popoverEl.removeEventListener('pointerleave', onLeave);
      });
    });

    if (isDevMode()) {
      afterNextRender(() => {
        if (this.menuItem === null) {
          console.warn(
            '[cngxMenuItemSubmenu] applied without a sibling [cngxMenuItem] on the same host element. ' +
              'The surrounding CngxMenuTrigger cannot route ArrowRight / activation to this submenu ' +
              'because CngxActiveDescendant only highlights CngxMenuItem nodes. ' +
              'Add [cngxMenuItem] alongside [cngxMenuItemSubmenu] on the same element.',
          );
        }
        if (!this.wired() && !this.wiring) {
          console.warn(
            '[cngxMenuItemSubmenu] has no popover/menu source. Bind [cngxMenuItemSubmenu] and ' +
              '[submenuMenu], or provide CNGX_MENU_SUBMENU_WIRING from a wrapping component. ' +
              'The brain stays inert (no aria-haspopup / aria-expanded) until one is present.',
          );
        }
        const popover = this.resolvedPopover();
        if (popover) {
          warnMissingSubmenuFallbacks(popover.elementRef.nativeElement);
        }
      });
    }
  }
}

/**
 * @internal
 * Tracks which Documents have already warned about a submenu popover missing position-try-fallbacks.
 */
const submenuFallbackWarnedDocs = new WeakSet<Document>();

/**
 * @internal - test hook. Resets the per-Document warning suppression so
 * specs can exercise the warning path against a shared jsdom Document.
 * Do not call from production code.
 */
export function __resetSubmenuFallbackWarnings(doc: Document): void {
  submenuFallbackWarnedDocs.delete(doc);
}
/** @internal */
function warnMissingSubmenuFallbacks(popoverEl: HTMLElement): void {
  const doc = popoverEl.ownerDocument;
  if (submenuFallbackWarnedDocs.has(doc)) {
    return;
  }
  const resolved = getComputedStyle(popoverEl).getPropertyValue('position-try-fallbacks').trim();
  if (resolved !== '') {
    return;
  }
  submenuFallbackWarnedDocs.add(doc);
  console.warn(
    'CngxMenuItemSubmenu: the companion popover ships without [positionTryFallbacks]. ' +
      'Submenus that clip the viewport edge will not flip without a try-fallback chain. ' +
      'Wire the recommended default:\n\n' +
      "  import { CNGX_SUBMENU_TRY_FALLBACKS } from '@cngx/common/interactive';\n\n" +
      '  <div cngxPopover [positionTryFallbacks]="CNGX_SUBMENU_TRY_FALLBACKS">\n' +
      '    <!-- submenu items -->\n' +
      '  </div>\n',
  );
}
