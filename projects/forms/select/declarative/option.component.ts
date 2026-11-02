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
 *     <cngx-option [value]="'red'">Red</cngx-option>
 *     <cngx-option [value]="'green'">Green</cngx-option>
 *   </div>
 * </div>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/declarative/option.component.ts
 * @since 0.1.0
 * @relatedTo CngxSelectShell, CngxSelectOptgroup, CngxSelectDivider, CngxSelectSearch
 * <example-url>/#/forms/select/declarative/option</example-url>
 * @axis level organism
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
  // `data-cngx-option-chrome` must equal CNGX_OPTION_CHROME_ATTR: a template
  // cannot take an attribute name from a constant, so the select-shell spec
  // asserts the status span by the constant instead.
  template: `
    <ng-content />
    @let s = option.statusSignal();
    @if (s !== null && s.tpl !== null) {
      <span class="cngx-option__status" [attr.data-state]="s.kind" data-cngx-option-chrome>
        <ng-container *ngTemplateOutlet="s.tpl" />
      </span>
    }
  `,
  styleUrls: ['./option.component.css'],
})
export class CngxSelectOption {
  protected readonly option = inject(CngxOption, { self: true });
}
