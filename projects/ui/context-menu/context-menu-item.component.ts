import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  ViewEncapsulation,
} from '@angular/core';
import { outputToObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { CngxActiveDescendant } from '@cngx/common/a11y';
import {
  CngxMenuItem,
  CngxMenuItemIcon,
  CngxMenuItemKbd,
  CngxMenuItemLabel,
  CngxMenuItemSubmenu,
  CngxMenuItemSuffix,
  CNGX_MENU_SUBMENU_WIRING,
  type CngxMenuHost,
  type CngxMenuSubmenuPopoverRef,
  type CngxMenuSubmenuWiring,
} from '@cngx/common/interactive';

import type { CngxContextMenu } from './context-menu.component';
import { CNGX_CONTEXT_MENU_PANEL } from './context-menu-panel';

/** @internal Default caret glyph for an item that opens a submenu (decorative). */
const CONTEXT_MENU_SUBMENU_CARET = '▸';

/**
 * A single actionable context-menu item. Thin shell over `CngxMenuItem`: the
 * brain owns `role="menuitem"`, the active-descendant registration, the
 * keyboard/pointer activation and the disabled semantics. Dual selector, so it
 * works both as an element and as an attribute on a native `<button>` (the
 * `button[mat-menu-item]` precedent).
 *
 * Emits `select` when this item is activated by click or Enter/Space. Give
 * each item a distinct `[value]` (forwarded to the brain) so pointer
 * activation targets the right row - matching the base `CngxMenuItem`
 * convention; a value-less item still works when it is the only item.
 *
 * ### Submenu
 * Bind `[submenu]` to a sibling `<cngx-context-menu>` to open a nested menu.
 * The `CngxMenuItemSubmenu` brain (a host directive here) is wired internally
 * through `CNGX_MENU_SUBMENU_WIRING`, so the consumer needs no `[exclusive]`
 * handgrip and no popover plumbing - just the sibling reference. The nested
 * panel opens non-exclusively (the parent stays open) and inherits the parent
 * panel's row context.
 *
 * ```html
 * <cngx-context-menu-item value="copy" kbd="⌘C" (select)="copy()">Copy</cngx-context-menu-item>
 * <button cngxContextMenuItem value="delete" [disabled]="locked()" (select)="remove()">Delete</button>
 *
 * <cngx-context-menu-item [submenu]="exportMenu">Export</cngx-context-menu-item>
 * <cngx-context-menu #exportMenu ariaLabel="Export as">
 *   <cngx-context-menu-item (select)="export('pdf')">PDF</cngx-context-menu-item>
 * </cngx-context-menu>
 * ```
 *
 * @category ui/context-menu
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/context-menu/context-menu-item.component.ts
 * @since 0.1.0
 * @relatedTo CngxContextMenu, CngxContextMenuDivider, CngxMenuItem, CngxMenuItemSubmenu
 */
@Component({
  selector: 'cngx-context-menu-item, button[cngxContextMenuItem]',
  standalone: true,
  imports: [CngxMenuItemIcon, CngxMenuItemLabel, CngxMenuItemKbd, CngxMenuItemSuffix],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'cngxContextMenuItem',
  providers: [{ provide: CNGX_MENU_SUBMENU_WIRING, useExisting: CngxContextMenuItem }],
  hostDirectives: [
    { directive: CngxMenuItem, inputs: ['disabled', 'value'] },
    CngxMenuItemSubmenu,
  ],
  template: `
    @if (icon(); as glyph) {
      <span cngxMenuItemIcon>{{ glyph }}</span>
    }
    <span cngxMenuItemLabel><ng-content /></span>
    @if (kbd(); as shortcut) {
      <span cngxMenuItemKbd>{{ shortcut }}</span>
    }
    @if (submenu()) {
      <span cngxMenuItemSuffix>{{ caret }}</span>
    }
  `,
  styleUrl: './context-menu-item.component.css',
})
export class CngxContextMenuItem implements CngxMenuSubmenuWiring {
  /** Leading glyph rendered in the icon slot (decorative, `aria-hidden`). */
  readonly icon = input<string>();
  /** Keyboard-shortcut hint rendered in the kbd slot (decorative). */
  readonly kbd = input<string>();
  /**
   * Sibling `<cngx-context-menu>` opened as a nested submenu. When set, the
   * item renders a caret, gains `aria-haspopup="menu"` (from the submenu
   * brain) and routes ArrowRight/ArrowLeft into the nested panel.
   */
  readonly submenu = input<CngxContextMenu<unknown>>();

  /** Fires when this item is activated by click or Enter/Space. */
  readonly select = output<void>();

  /** @internal Decorative caret rendered while `submenu` is set. */
  protected readonly caret = CONTEXT_MENU_SUBMENU_CARET;

  private readonly parentPanel = inject(CNGX_CONTEXT_MENU_PANEL, { optional: true });

  /**
   * Facade the submenu brain drives instead of a `[cngxMenuItemSubmenu]`
   * input. `show()` opens the target panel non-exclusively and mirrors the
   * parent panel's row context in first; every other member delegates to the
   * target's `CngxPopover`. Built once, reads `submenu()` lazily so it stays
   * valid across target changes.
   */
  private readonly submenuPopoverFacade: CngxMenuSubmenuPopoverRef;

  constructor() {
    const target = this.submenu;
    this.submenuPopoverFacade = {
      isVisible: () => target()?.popover.isVisible() ?? false,
      show: () => this.openSubmenu(),
      hide: () => target()?.popover.hide(),
      anchorElement: { set: (el) => target()?.popover.anchorElement.set(el) },
      id: () => target()?.popover.id() ?? '',
      elementRef: {
        get nativeElement(): HTMLElement {
          return target()!.popover.elementRef.nativeElement;
        },
      },
    };

    const brain = inject(CngxMenuItem);
    const ad = inject(CngxActiveDescendant, { optional: true });
    if (!ad) {
      return;
    }
    // Activation flows through the surrounding CngxActiveDescendant (click and
    // keyboard both funnel into activateCurrent). Filter to this item's brain
    // id so only the activated row emits - the same identity CngxMenu uses.
    outputToObservable(ad.activated)
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        if (ad.activeId() === brain.id) {
          this.select.emit();
        }
      });
  }

  /** @internal `CngxMenuSubmenuWiring` - the nested panel's menu brain, or
   * `undefined` while no `[submenu]` is bound so the brain stays inert. */
  menu(): CngxMenuHost {
    return this.submenu()?.menuHost as CngxMenuHost;
  }

  /** @internal `CngxMenuSubmenuWiring` - the popover facade the brain drives,
   * or `undefined` while no `[submenu]` is bound so the brain stays inert. */
  popover(): CngxMenuSubmenuPopoverRef {
    return this.submenu()
      ? this.submenuPopoverFacade
      : (undefined as unknown as CngxMenuSubmenuPopoverRef);
  }

  private openSubmenu(): void {
    const target = this.submenu();
    if (!target) {
      return;
    }
    // Open non-exclusively so the parent panel survives, and mirror its row
    // context once, in the event path - closing stays derived from the
    // popover's own visibility (Pillar 1).
    target.popover.exclusiveOverride.set(false);
    target.setContext(this.parentPanel?.context() ?? null);
    target.popover.show();
  }
}
