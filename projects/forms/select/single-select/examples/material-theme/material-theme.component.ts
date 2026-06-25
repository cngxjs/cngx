import { ChangeDetectionStrategy, Component, ViewEncapsulation, signal } from '@angular/core';

import { CngxSelect, type CngxSelectOptionDef } from '@cngx/forms/select';

/**
 * `CngxSelect` rendered against a Material 3 palette via the published
 * `@cngx/themes/material/select-theme` bridge.
 *
 * The stylesheet builds a real M3 theme: `mat.theme` emits the `--mat-sys-*`
 * system tokens, then `select.theme($theme)` routes every `--cngx-select-*`
 * token onto its Material counterpart, so the trigger, panel surface, and
 * selected-option tones inherit the palette with no per-instance overrides.
 * `ViewEncapsulation.None` lets the global `html` theme and the
 * `:where(cngx-select)` bridge rules reach both the trigger and the
 * top-layer panel.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CngxSelect],
  styleUrl: './material-theme.component.scss',
  template: `
    <div class="demo">
      <cngx-select
        [label]="'Favorite color'"
        [options]="colors"
        [(value)]="value"
        [clearable]="true"
        placeholder="Pick a color…"
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
}
