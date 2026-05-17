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
 * <example-url>http://localhost:4200/#/forms/select/select-shell/async-commit-pending-error-inline-glyphs</example-url>
 * <example-url>http://localhost:4200/#/forms/select/select-shell/basic-flat-declarative-options</example-url>
 * <example-url>http://localhost:4200/#/forms/select/select-shell/custom-glyphs-clearglyph-caretglyph</example-url>
 * <example-url>http://localhost:4200/#/forms/select/select-shell/empty-state-loading-flag</example-url>
 * <example-url>http://localhost:4200/#/forms/select/select-shell/grouped-divider-projected-hierarchy</example-url>
 * <example-url>http://localhost:4200/#/forms/select/select-shell/inside-cngx-form-field-reactive-forms</example-url>
 * <example-url>http://localhost:4200/#/forms/select/select-shell/rich-content-option-plain-text-trigger</example-url>
 * <example-url>http://localhost:4200/#/forms/select/select-shell/search-declarative-cngx-select-search</example-url>
 * <example-url>http://localhost:4200/#/forms/select/select-shell/showcase-every-feature-combined</example-url>
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
  styleUrl: './divider.component.css',
})
export class CngxSelectDivider {}
