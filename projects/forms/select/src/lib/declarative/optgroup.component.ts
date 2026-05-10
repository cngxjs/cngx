import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { CngxOptionGroup } from '@cngx/common/interactive';

/**
 * Declarative-mode group element. Renders a non-focusable header and
 * projects `<cngx-option>` children under WAI-ARIA `role="group"`.
 *
 * **Usage:** inside a consumer-assembled listbox or as a direct child
 * of `<cngx-select-shell>`. Not supported inside data-mode
 * `<cngx-select>` (consumes via `[options]`).
 *
 * @example
 * ```html
 * <div cngxListbox #lb="cngxListbox" [label]="'Color'" [(value)]="color">
 *   <cngx-optgroup label="Warm">
 *     <cngx-option [value]="'red'">Rot</cngx-option>
 *     <cngx-option [value]="'orange'">Orange</cngx-option>
 *   </cngx-optgroup>
 *
 *   <cngx-select-divider />
 *
 *   <cngx-optgroup label="Cold">
 *     <cngx-option [value]="'blue'">Blau</cngx-option>
 *   </cngx-optgroup>
 * </div>
 * ```
 *
 * @category interactive
 */
@Component({
  selector: 'cngx-optgroup',
  exportAs: 'cngxSelectOptgroup',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: CngxOptionGroup, inputs: ['label'] }],
  template: `
    <div class="cngx-select__group-header" aria-hidden="true">{{ label() }}</div>
    <ng-content />
  `,
  styles: `
    :host {
      display: block;
    }
    .cngx-select__group-header {
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      opacity: 0.7;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
  `,
})
export class CngxSelectOptgroup {
  /** Header text. Mirrors the hostDirective input for template binding. */
  readonly label = input.required<string>();
}
