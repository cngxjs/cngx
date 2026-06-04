import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { CNGX_AD_ITEM } from '@cngx/common/a11y';
import { CngxOption } from '@cngx/common/interactive';

/**
 * Declarative-mode option element. Wraps the `[cngxOption]` atom in a
 * native-feeling `<cngx-option>` tag with the same `[value]` /
 * `[disabled]` / `[label]` inputs.
 *
 * **Usage:** inside a consumer-assembled listbox or as a direct child
 * of `<cngx-select-shell>` - the shell builds the option list from
 * projected DOM via `CNGX_OPTION_CONTAINER`, sidestepping the
 * content-projection scoping issue that prevents direct use inside
 * data-mode `<cngx-select>` (which requires `[options]`).
 *
 * ```html
 * <button type="button" [cngxPopoverTrigger]="pop" [cngxListboxTrigger]="lb"
 *         [popover]="pop" (click)="pop.toggle()">Choose…</button>
 * <div cngxPopover #pop="cngxPopover" placement="bottom">
 *   <div cngxListbox #lb="cngxListbox" [label]="'Color'" [(value)]="color">
 *     <cngx-option [value]="'red'">Rot</cngx-option>
 *     <cngx-option [value]="'green'">Grün</cngx-option>
 *   </div>
 * </div>
 * ```
 *
 * @category forms/select/declarative
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/declarative/option.component.ts
 * @since 0.1.0
 * @relatedTo CngxSelectShell, CngxSelectOptgroup, CngxSelectDivider, CngxSelectSearch
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
  selector: 'cngx-option',
  exportAs: 'cngxSelectOption',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: CngxOption,
      inputs: ['value', 'disabled', 'label'],
    },
  ],
  // hostDirective providers don't propagate - re-expose CNGX_AD_ITEM
  // so the enclosing listbox / AD discovers it.
  providers: [{ provide: CNGX_AD_ITEM, useExisting: CngxOption }],
  imports: [NgTemplateOutlet],
  template: `
    <ng-content />
    @let s = option.statusSignal();
    @if (s !== null && s.tpl !== null) {
      <span class="cngx-option__status" [attr.data-state]="s.kind">
        <ng-container *ngTemplateOutlet="s.tpl" />
      </span>
    }
  `,
  styleUrls: ['./option.component.css'],
})
export class CngxSelectOption {
  protected readonly option = inject(CngxOption, { self: true });
}
