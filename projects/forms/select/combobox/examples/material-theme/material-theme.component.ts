import { ChangeDetectionStrategy, Component, ViewEncapsulation, signal } from '@angular/core';

import { CngxCombobox, type CngxSelectOptionDef } from '@cngx/forms/select';

/**
 * `CngxCombobox` rendered against a Material 3 palette via the published
 * `@cngx/themes/material/select-theme` bridge.
 *
 * The stylesheet builds a real M3 theme: `mat.theme` emits the `--mat-sys-*`
 * system tokens, then `select.theme($theme)` routes every `--cngx-select-*`
 * token onto its Material counterpart, so the tag-input trigger, chip strip,
 * and panel surface inherit the palette with no per-instance overrides.
 * `ViewEncapsulation.None` lets the global `html` theme and the
 * `:where(cngx-combobox)` bridge rules reach both the trigger and the
 * top-layer panel.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CngxCombobox],
  styleUrl: './material-theme.component.scss',
  template: `
    <div class="demo">
      <cngx-combobox
        [label]="'Favorite colors'"
        [options]="colors"
        [(values)]="values"
        placeholder="Type to filter…"
      />
      <p class="demo__readout">Selected: {{ values().length ? values().join(', ') : '—' }}</p>
    </div>
  `,
})
export class MaterialThemeExample {
  protected readonly values = signal<string[]>([]);

  protected readonly colors: CngxSelectOptionDef<string>[] = [
    { value: 'red', label: 'Red' },
    { value: 'green', label: 'Green' },
    { value: 'blue', label: 'Blue' },
    { value: 'amber', label: 'Amber' },
    { value: 'violet', label: 'Violet' },
  ];
}
