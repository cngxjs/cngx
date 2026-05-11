import { Directive, input } from '@angular/core';

/**
 * Manages `aria-expanded` and optionally `aria-controls` on the host element.
 *
 * Pairs a disclosure trigger (button) with its controlled region via standard
 * WAI-ARIA attributes. Supports accordions, dropdowns, tree items, and any
 * disclosure pattern where a control toggles visibility of another element.
 *
 * Unlike manual `[attr.aria-expanded]` binding, this directive couples both
 * attributes (`aria-expanded` + `aria-controls`) in a single declaration,
 * preventing mismatches where one is set without the other.
 *
 * @category a11y
 *
 * @usageNotes
 *
 * ### Simple disclosure
 * ```html
 * <button [cngxAriaExpanded]="open()" [controls]="'panel-id'" (click)="open.set(!open())">
 *   Toggle
 * </button>
 * <div id="panel-id" role="region" [hidden]="!open()">Panel content</div>
 * ```
 *
 * ### Accordion with multiple panels
 * ```html
 * @for (panel of panels(); track panel.id) {
 *   <button [cngxAriaExpanded]="panel.open" [controls]="panel.id" (click)="toggle(panel)">
 *     {{ panel.label }}
 *   </button>
 *   @if (panel.open) {
 *     <div [id]="panel.id" role="region">{{ panel.content }}</div>
 *   }
 * }
 * ```
 */
@Directive({
  selector: '[cngxAriaExpanded]',
  exportAs: 'cngxAriaExpanded',
  standalone: true,
  host: {
    '[attr.aria-expanded]': 'expanded()',
    '[attr.aria-controls]': 'controls() ?? null',
  },
})
export class CngxAriaExpanded {
  /** Whether the controlled element is currently expanded. Sets `aria-expanded`. */
  readonly expanded = input<boolean>(false, { alias: 'cngxAriaExpanded' });
  /** The `id` of the controlled element. Sets `aria-controls`. */
  readonly controls = input<string | undefined>(undefined);
}
