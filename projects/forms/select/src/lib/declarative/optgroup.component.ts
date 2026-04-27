import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { CngxOptionGroup } from '@cngx/common/interactive';

/**
 * Declarative-mode group element — renders a non-focusable header and
 * projects `<cngx-option>` children inside a WAI-ARIA `role="group"`.
 *
 * **Intended usage:** inside a consumer-assembled listbox (the "compose
 * yourself" path) OR as a direct child of `<cngx-select-shell>`. Direct
 * use inside the data-mode `<cngx-select>` is still unsupported — that
 * variant consumes options through `[options]`.
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
  /** Header text. Mirrors the hostDirective input so the template can render it. */
  readonly label = input.required<string>();
}
