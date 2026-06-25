import { ChangeDetectionStrategy, Component, ViewEncapsulation, signal } from '@angular/core';

import { CngxSelectShell, CngxSelectOption } from '@cngx/forms/select';

/**
 * `CngxSelectShell` rendered against a Material 3 palette via the published
 * `@cngx/themes/material/select-theme` bridge.
 *
 * The stylesheet builds a real M3 theme: `mat.theme` emits the `--mat-sys-*`
 * system tokens, then `select.theme($theme)` routes every `--cngx-select-*`
 * token onto its Material counterpart, so the trigger, panel surface, and
 * selected-option tones inherit the palette with no per-instance overrides.
 * `ViewEncapsulation.None` lets the global `html` theme and the
 * `:where(cngx-select-shell)` bridge rules reach both the trigger and the
 * top-layer panel.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CngxSelectShell, CngxSelectOption],
  styleUrl: './material-theme.component.scss',
  template: `
    <div class="demo">
      <cngx-select-shell
        [label]="'Favorite color'"
        [(value)]="value"
        [selectionIndicatorPosition]="'after'"
        placeholder="Pick a color…"
      >
        <cngx-option [value]="'red'">Red</cngx-option>
        <cngx-option [value]="'green'">Green</cngx-option>
        <cngx-option [value]="'blue'">Blue</cngx-option>
        <cngx-option [value]="'amber'">Amber</cngx-option>
        <cngx-option [value]="'violet'">Violet</cngx-option>
      </cngx-select-shell>
      <p class="demo__readout">Selected: {{ value() ?? '—' }}</p>
    </div>
  `,
})
export class MaterialThemeExample {
  protected readonly value = signal<string | undefined>(undefined);
}
