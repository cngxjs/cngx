import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

import {
  CngxCombobox,
  provideSelectConfigAt,
  withVirtualization,
  type CngxSelectOptionDef,
} from '@cngx/forms/select';

/**
 * Second demo wrapper — proves the virtualisation wire-up is
 * variant-agnostic. Identical `provideSelectConfigAt` incantation,
 * different select variant (`<cngx-combobox>` here). Works the same
 * way for `<cngx-multi-select>`, `<cngx-typeahead>`,
 * `<cngx-reorderable-multi-select>`, `<cngx-action-select>`, and
 * `<cngx-action-multi-select>`.
 */
@Component({
  selector: 'cngx-demo-virtual-combo',
  standalone: true,
  imports: [CngxCombobox],
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [
    ...provideSelectConfigAt(
      withVirtualization({ estimateSize: 32, overscan: 6 }),
    ),
  ],
  template: `
    <cngx-combobox
      [label]="label()"
      [options]="options()"
      [(values)]="values"
      [placeholder]="placeholder()"
    />
  `,
})
export class SelectVirtualComboDemoWrapper {
  readonly label = input<string>('Combobox');
  readonly placeholder = input<string>('Filter…');
  readonly options = input<CngxSelectOptionDef<string>[]>([]);
  readonly values = model<string[]>([]);
}
