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
} from '@cngx/common/interactive';

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
 * ```html
 * <cngx-context-menu-item value="copy" kbd="⌘C" (select)="copy()">Copy</cngx-context-menu-item>
 * <button cngxContextMenuItem value="delete" [disabled]="locked()" (select)="remove()">Delete</button>
 * ```
 *
 * @category ui/context-menu
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/context-menu/context-menu-item.component.ts
 * @since 0.1.0
 * @relatedTo CngxContextMenu, CngxContextMenuDivider, CngxMenuItem
 */
@Component({
  selector: 'cngx-context-menu-item, button[cngxContextMenuItem]',
  standalone: true,
  imports: [CngxMenuItemIcon, CngxMenuItemLabel, CngxMenuItemKbd],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'cngxContextMenuItem',
  hostDirectives: [{ directive: CngxMenuItem, inputs: ['disabled', 'value'] }],
  template: `
    @if (icon(); as glyph) {
      <span cngxMenuItemIcon>{{ glyph }}</span>
    }
    <span cngxMenuItemLabel><ng-content /></span>
    @if (kbd(); as shortcut) {
      <span cngxMenuItemKbd>{{ shortcut }}</span>
    }
  `,
  styleUrl: './context-menu-item.component.css',
})
export class CngxContextMenuItem {
  /** Leading glyph rendered in the icon slot (decorative, `aria-hidden`). */
  readonly icon = input<string>();
  /** Keyboard-shortcut hint rendered in the kbd slot (decorative). */
  readonly kbd = input<string>();

  /** Fires when this item is activated by click or Enter/Space. */
  readonly select = output<void>();

  constructor() {
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
}
