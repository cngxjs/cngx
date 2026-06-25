import { ChangeDetectionStrategy, Component, ViewEncapsulation, signal } from '@angular/core';

import { CngxReorderableMultiSelect, type CngxSelectOptionDef } from '@cngx/forms/select';

/**
 * `CngxReorderableMultiSelect` rendered against a Material 3 palette via
 * the published `@cngx/themes/material/select-theme` bridge.
 *
 * The stylesheet builds a real M3 theme: `mat.theme` emits the
 * `--mat-sys-*` system tokens, then `select.theme($theme)` routes every
 * `--cngx-select-*` token onto its Material counterpart, so the trigger,
 * chip strip, panel surface, and selected-option tones inherit the
 * palette with no per-instance overrides. `ViewEncapsulation.None` lets
 * the global `html` theme and the `:where(cngx-reorderable-multi-select)`
 * bridge rules reach both the trigger and the top-layer panel.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CngxReorderableMultiSelect],
  styleUrl: './material-theme.component.scss',
  template: `
    <div class="demo">
      <cngx-reorderable-multi-select
        [label]="'Workflow steps'"
        [options]="steps"
        [(values)]="values"
        placeholder="Pick steps…"
      />
      <p class="demo__readout">Order: {{ values().join(', ') || '—' }}</p>
    </div>
  `,
})
export class MaterialThemeExample {
  protected readonly values = signal<string[]>(['build', 'test', 'deploy']);

  protected readonly steps: CngxSelectOptionDef<string>[] = [
    { value: 'build', label: 'Build' },
    { value: 'test', label: 'Test' },
    { value: 'deploy', label: 'Deploy' },
    { value: 'lint', label: 'Lint' },
    { value: 'release', label: 'Release' },
  ];
}
