import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Visual separator between groups / options inside a consumer-assembled
 * listbox. Native `<select>` allows `<hr>` as a child for the same purpose —
 * we ship a dedicated element so CSS ownership stays clean and ATs ignore
 * it (role="presentation", aria-hidden).
 *
 * **Intended usage:** inside a consumer-assembled listbox (the "compose
 * yourself" path) OR as a direct child of `<cngx-select-shell>`. Direct
 * use inside the data-mode `<cngx-select>` is still unsupported — that
 * variant consumes options through `[options]`.
 *
 * @example
 * ```html
 * <div cngxListbox>
 *   <cngx-option [value]="'a'">A</cngx-option>
 *   <cngx-select-divider />
 *   <cngx-option [value]="'b'">B</cngx-option>
 * </div>
 * ```
 *
 * @category interactive
 */
@Component({
  selector: 'cngx-select-divider',
  exportAs: 'cngxSelectDivider',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'presentation',
    'aria-hidden': 'true',
  },
  template: ``,
  styles: `
    :host {
      display: block;
      block-size: 1px;
      margin: var(--cngx-select-divider-margin, 0.25rem 0);
      background: var(--cngx-select-divider-color, var(--cngx-border, #e0e0e0));
    }
  `,
})
export class CngxSelectDivider {}
