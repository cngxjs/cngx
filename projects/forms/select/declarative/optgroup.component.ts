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
 * <example-url>http://localhost:4200/#/forms/select/select-shell/async-commit-pending-error-inline-glyphs</example-url>
 * <example-url>http://localhost:4200/#/forms/select/select-shell/basic-flat-declarative-options</example-url>
 * <example-url>http://localhost:4200/#/forms/select/select-shell/custom-glyphs-clearglyph-caretglyph</example-url>
 * <example-url>http://localhost:4200/#/forms/select/select-shell/empty-state-loading-flag</example-url>
 * <example-url>http://localhost:4200/#/forms/select/select-shell/grouped-divider-projected-hierarchy</example-url>
 * <example-url>http://localhost:4200/#/forms/select/select-shell/inside-cngx-form-field-reactive-forms</example-url>
 * <example-url>http://localhost:4200/#/forms/select/select-shell/rich-content-option-plain-text-trigger</example-url>
 * <example-url>http://localhost:4200/#/forms/select/select-shell/search-declarative-cngx-select-search</example-url>
 * <example-url>http://localhost:4200/#/forms/select/select-shell/showcase-every-feature-combined</example-url>
 * <example-url>http://localhost:4200/#/forms/select/single-select/assemble-it-yourself-atoms-element-components</example-url>
 * <example-url>http://localhost:4200/#/forms/select/single-select/async-state-consumer</example-url>
 * <example-url>http://localhost:4200/#/forms/select/single-select/autofocus-on-mount</example-url>
 * <example-url>http://localhost:4200/#/forms/select/single-select/clearable</example-url>
 * <example-url>http://localhost:4200/#/forms/select/single-select/commit-action-async-write</example-url>
 * <example-url>http://localhost:4200/#/forms/select/single-select/commiterrordisplay-variants-banner-inline-none</example-url>
 * <example-url>http://localhost:4200/#/forms/select/single-select/fixed-width-panel-number</example-url>
 * <example-url>http://localhost:4200/#/forms/select/single-select/keyboard-pageup-pagedown-on-a-long-list</example-url>
 * <example-url>http://localhost:4200/#/forms/select/single-select/loading-empty-templates</example-url>
 * <example-url>http://localhost:4200/#/forms/select/single-select/loading-variants</example-url>
 * <example-url>http://localhost:4200/#/forms/select/single-select/optgroups</example-url>
 * <example-url>http://localhost:4200/#/forms/select/single-select/reactive-forms-adaptformcontrol</example-url>
 * <example-url>http://localhost:4200/#/forms/select/single-select/refreshing-variants</example-url>
 * <example-url>http://localhost:4200/#/forms/select/single-select/rich-option-rendering</example-url>
 * <example-url>http://localhost:4200/#/forms/select/single-select/selection-indicator-variant-radio</example-url>
 * <example-url>http://localhost:4200/#/forms/select/single-select/signal-forms-required</example-url>
 * <example-url>http://localhost:4200/#/forms/select/single-select/slot-override-cngxselectcommiterror</example-url>
 * <example-url>http://localhost:4200/#/forms/select/single-select/slot-override-cngxselectloading</example-url>
 * <example-url>http://localhost:4200/#/forms/select/single-select/slot-override-cngxselectloadingglyph</example-url>
 * <example-url>http://localhost:4200/#/forms/select/single-select/slot-override-cngxselectoptgroup</example-url>
 * <example-url>http://localhost:4200/#/forms/select/single-select/slot-override-cngxselectplaceholder</example-url>
 * <example-url>http://localhost:4200/#/forms/select/single-select/slot-override-cngxselectrefreshing</example-url>
 * <example-url>http://localhost:4200/#/forms/select/single-select/slot-override-cngxselectretrybutton</example-url>
 * <example-url>http://localhost:4200/#/forms/select/single-select/slot-overrides-cngxselectoptionpending-cngxselectoptionerror</example-url>
 * <example-url>http://localhost:4200/#/forms/select/single-select/standalone</example-url>
 * <example-url>http://localhost:4200/#/forms/select/single-select/template-override-custom-caret</example-url>
 * <example-url>http://localhost:4200/#/forms/select/single-select/template-override-custom-check</example-url>
 * <example-url>http://localhost:4200/#/forms/select/single-select/template-override-rich-trigger-label</example-url>
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
  styleUrls: ['./optgroup.component.css'],
})
export class CngxSelectOptgroup {
  /** Header text. Mirrors the hostDirective input for template binding. */
  readonly label = input.required<string>();
}
