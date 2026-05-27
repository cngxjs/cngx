import { Directive } from '@angular/core';

import { CngxDivider } from '@cngx/common/display';

/**
 * Separator for use inside `cngx-popover-panel` (or a bare `[cngxPopover]`).
 *
 * Composes `CngxDivider` via `hostDirectives` so the popover-context
 * separator carries proper `role="separator"` + `aria-orientation`
 * semantics without the consumer having to remember the ARIA wiring.
 * The `orientation` and `inset` inputs forward to the underlying
 * `CngxDivider` host directive.
 *
 * Project anywhere inside the panel content - typically between menu
 * item groups (destructive vs non-destructive), between body sections,
 * or between footer action groups.
 *
 * ### Menu item group separator (horizontal)
 * ```html
 * <menu>
 *   <li><button (click)="pop.hide()">Edit</button></li>
 *   <li><button (click)="pop.hide()">Duplicate</button></li>
 *   <li cngxPopoverDivider></li>
 *   <li><button (click)="pop.hide()">Delete</button></li>
 * </menu>
 * ```
 *
 * ### Vertical separator between footer action groups
 * ```html
 * <div cngxPopoverFooter>
 *   <cngx-popover-action role="dismiss">Cancel</cngx-popover-action>
 *   <span cngxPopoverDivider orientation="vertical"></span>
 *   <cngx-popover-action role="confirm" [action]="save">Save</cngx-popover-action>
 * </div>
 * ```
 *
 * @category common/popover
 */
@Directive({
  selector: '[cngxPopoverDivider]',
  exportAs: 'cngxPopoverDivider',
  standalone: true,
  hostDirectives: [
    {
      directive: CngxDivider,
      inputs: ['orientation', 'inset'],
    },
  ],
  host: {
    class: 'cngx-popover-divider',
  },
})
export class CngxPopoverDivider {}
