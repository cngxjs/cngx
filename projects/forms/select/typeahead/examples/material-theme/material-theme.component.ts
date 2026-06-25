import { ChangeDetectionStrategy, Component, ViewEncapsulation, signal } from '@angular/core';

import { CngxTypeahead, type CngxSelectOptionDef } from '@cngx/forms/select';

/**
 * `CngxTypeahead` rendered against a Material 3 palette via the published
 * `@cngx/themes/material/select-theme` bridge.
 *
 * The stylesheet builds a real M3 theme: `mat.theme` emits the `--mat-sys-*`
 * system tokens, then `select.theme($theme)` routes every `--cngx-select-*`
 * token onto its Material counterpart, so the inline combobox input, panel
 * surface, and selected-option tones inherit the palette with no per-instance
 * overrides. `ViewEncapsulation.None` lets the global `html` theme and the
 * `:where(cngx-typeahead)` bridge rules reach both the input and the
 * top-layer panel.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CngxTypeahead],
  styleUrl: './material-theme.component.scss',
  template: `
    <div class="demo">
      <cngx-typeahead
        [label]="'Favorite color'"
        [options]="colors"
        [(value)]="value"
        [displayWith]="displayWith"
        [selectionIndicatorPosition]="'after'"
        placeholder="Type to filter…"
      />
      <p class="demo__readout">Selected: {{ value() ?? '—' }}</p>
    </div>
  `,
})
export class MaterialThemeExample {
  protected readonly value = signal<string | undefined>(undefined);

  protected readonly colors: CngxSelectOptionDef<string>[] = [
    { value: 'red', label: 'Red' },
    { value: 'green', label: 'Green' },
    { value: 'blue', label: 'Blue' },
    { value: 'amber', label: 'Amber' },
    { value: 'violet', label: 'Violet' },
  ];

  protected readonly displayWith = (value: string): string =>
    this.colors.find((c) => c.value === value)?.label ?? value;
}
