import { ChangeDetectionStrategy, Component, ViewEncapsulation, signal } from '@angular/core';

import { CngxMultiSelect, type CngxSelectOptionDef } from '@cngx/forms/select';

/**
 * `CngxMultiSelect` rendered against a Material 3 palette via the published
 * `@cngx/themes/material/select-theme` bridge.
 *
 * The stylesheet builds a real M3 theme: `mat.theme` emits the `--mat-sys-*`
 * system tokens, then `select.theme($theme)` routes every `--cngx-select-*`
 * token onto its Material counterpart, so the trigger, chip strip, panel
 * surface, and selected-option tones inherit the palette with no per-instance
 * overrides. `ViewEncapsulation.None` lets the global `html` theme and the
 * `:where(cngx-multi-select)` bridge rules reach both the trigger and the
 * top-layer panel.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CngxMultiSelect],
  styleUrl: './material-theme.component.scss',
  template: `
    <div class="demo">
      <cngx-multi-select
        [label]="'Favorite colors'"
        [options]="colors"
        [(values)]="values"
        [clearable]="true"
        [chipOverflow]="'truncate'"
        placeholder="Pick a few colors…"
      />
      <p class="demo__readout">Selected: {{ values().join(', ') || '—' }}</p>
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
