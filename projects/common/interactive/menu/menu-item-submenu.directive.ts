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
  signal,
  untracked,
} from '@angular/core';

import { nextUid } from '@cngx/core/utils';

import { CNGX_MENU_ANNOUNCER_FACTORY } from './menu-announcer';
import { injectMenuConfig } from './menu-config';
import type { CngxMenuHost } from './menu-host.token';
import { CngxMenuItem } from './menu-item.directive';
import { CNGX_MENU_SUBMENU_ITEM, type CngxMenuSubmenuLike } from './menu-submenu.token';

/** See `CngxListboxTrigger` - same structural contract. */
interface PopoverController {
  readonly isVisible: () => boolean;
  show(): void;
  hide(): void;
  readonly anchorElement: { set(el: HTMLElement | null): void };
  /**
   * Popover unique id signal - used to compose the `anchor-name` CSS value
   * the browser's CSS Anchor Positioning expects on the anchor element.
   */
  readonly id: () => string;
  /**
   * Popover host element - the submenu directive attaches hover listeners to
   * it so the submenu stays open while the user mouses over its items.
   */
  readonly elementRef: ElementRef<HTMLElement>;
}

/**
 * Companion directive applied to a `[cngxMenuItem]` that opens a nested
 * submenu. The directive itself does NOT render `role="menuitem"` - that
 * stays on `CngxMenuItem`. Adds `aria-haspopup="menu"` and reactive
 * `aria-expanded`, registers itself with the surrounding menu as a
 * submenu source so the menu trigger can drive arrow-right / arrow-left
 * focus-stack semantics.
 *
 * Two inputs:
 * - `cngxMenuItemSubmenu`: the popover wrapping the submenu.
 * - `submenuMenu`: the inner `CngxMenu` (or any `CngxMenuHost`) the
 *   trigger transfers focus to when the submenu opens.
 *
 * The submenu's `<div cngxPopover>` MUST set `[exclusive]="false"` so that
 * opening it does not light-dismiss the parent popover. This is the only
 * extra wiring the consumer needs beyond the two inputs.
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
  providers: [{ provide: CNGX_MENU_SUBMENU_ITEM, useExisting: CngxMenuItemSubmenu }],
  host: {
    '[id]': 'id',
    '[attr.aria-haspopup]': '"menu"',
    '[attr.aria-expanded]': 'isOpen()',
    '[style.anchor-name]': 'cssAnchorName()',
    '(pointerenter)': 'handleParentEnter()',
    '(pointerleave)': 'handleParentLeave()',
  },
})
export class CngxMenuItemSubmenu implements CngxMenuSubmenuLike {
  /** Popover wrapping the submenu. Required. */
  readonly popover = input.required<PopoverController>({ alias: 'cngxMenuItemSubmenu' });

  /** Inner `CngxMenuHost` (the submenu's own `CngxMenu`). Required. */
  readonly submenuMenu = input.required<CngxMenuHost>();

  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly menuItem = inject(CngxMenuItem, { optional: true, self: true });
  private readonly ownId = nextUid('cngx-menu-submenu');

  /**
   * Effective id used by `CngxMenuTrigger.submenuItems().find(s => s.id ===
   * activeId)`. When applied alongside `[cngxMenuItem]` the directive
   * mirrors the sibling's id so the trigger's lookup matches the AD's
   * `activeId`. When applied alone (no sibling), falls back to a fresh
   * `nextUid` - the AD will never highlight this element so the trigger
   * lookup is moot, but the host element still receives a valid id.
   */
  get id(): string {
    return this.menuItem?.id ?? this.ownId;
  }

  readonly isOpen = computed<boolean>(() => this.popover().isVisible());

  /** CSS Anchor Positioning name - matches the popover's `position-anchor`. */
  protected readonly cssAnchorName = computed(() => `--cngx-pop-${this.popover().id()}`);

  get inner(): CngxMenuHost {
    return this.submenuMenu();
  }

  open(): void {
    this.popover().anchorElement.set(this.elementRef.nativeElement as HTMLElement);
    if (!this.popover().isVisible()) {
      this.popover().show();
    }
  }

  close(): void {
    if (this.popover().isVisible()) {
      this.popover().hide();
    }
  }

  // Submenu opens on parent hover; stays open while the pointer is over the
  // parent OR the popover. Closes `submenuCloseDelay` ms after leaving both.

  private readonly parentHovered = signal(false);
  private readonly popoverHovered = signal(false);
  private readonly anyHovered = computed(() => this.parentHovered() || this.popoverHovered());

  private closeTimer: ReturnType<typeof setTimeout> | null = null;

  protected handleParentEnter(): void {
    this.parentHovered.set(true);
  }

  protected handleParentLeave(): void {
    this.parentHovered.set(false);
  }

  private cancelCloseTimer(): void {
    if (this.closeTimer !== null) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  }

  private scheduleClose(): void {
    this.cancelCloseTimer();
    const delay = this.menuConfig.submenuCloseDelay;
    if (delay <= 0) {
      this.close();
      return;
    }
    this.closeTimer = setTimeout(() => {
      this.closeTimer = null;
      this.close();
    }, delay);
  }

  private readonly announcer = inject(CNGX_MENU_ANNOUNCER_FACTORY)();
  private readonly menuConfig = injectMenuConfig();
  private readonly destroyRef = inject(DestroyRef);

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

    effect(() => {
      const hovered = this.anyHovered();
      untracked(() => {
        if (hovered) {
          this.cancelCloseTimer();
          this.open();
        } else if (this.popover().isVisible()) {
          this.scheduleClose();
        }
      });
    });

    afterNextRender(() => {
      const popoverEl = this.popover().elementRef.nativeElement;
      const onEnter = (): void => this.popoverHovered.set(true);
      const onLeave = (): void => this.popoverHovered.set(false);
      popoverEl.addEventListener('pointerenter', onEnter);
      popoverEl.addEventListener('pointerleave', onLeave);
      this.destroyRef.onDestroy(() => {
        popoverEl.removeEventListener('pointerenter', onEnter);
        popoverEl.removeEventListener('pointerleave', onLeave);
        this.cancelCloseTimer();
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
        warnMissingSubmenuFallbacks(this.popover().elementRef.nativeElement);
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
