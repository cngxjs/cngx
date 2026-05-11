import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Visual separator between groups / options. Native `<select>` allows
 * `<hr>`; we ship a dedicated element for clean CSS ownership and AT
 * ignores it via `role="presentation"` + `aria-hidden`.
 *
 * **Usage:** inside a consumer-assembled listbox (compose-yourself
 * path) or as a direct child of `<cngx-select-shell>`. Not supported
 * inside data-mode `<cngx-select>` (consumes via `[options]`).
 *
 * @example
 * ```html
 * <div cngxListbox>
 *   <cngx-option [value]="'a'">A</cngx-option>
 *   <cngx-select-divider />
 *   <cngx-option [value]="'b'">B</cngx-option>
 * </div>
 * ```
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
