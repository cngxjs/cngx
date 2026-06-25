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
 * ```html
 * <div cngxListbox>
 *   <cngx-option [value]="'a'">A</cngx-option>
 *   <cngx-select-divider />
 *   <cngx-option [value]="'b'">B</cngx-option>
 * </div>
 * ```
 *
 * @category forms/select/declarative
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/declarative/divider.component.ts
 * @since 0.1.0
 * @relatedTo CngxSelectShell, CngxSelectOption, CngxSelectOptgroup
 * <example-url>http://localhost:4200/#/forms/select/declarative/divider</example-url>
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
  styleUrls: ['./divider.component.css'],
})
export class CngxSelectDivider {}
