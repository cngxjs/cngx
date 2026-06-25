import { ChangeDetectionStrategy, Component, ViewEncapsulation, signal } from '@angular/core';

import { CngxTreeSelect } from '@cngx/forms/select';
import type { CngxTreeNode } from '@cngx/utils';

/**
 * `CngxTreeSelect` rendered against a Material 3 palette via the published
 * `@cngx/themes/material/select-theme` bridge.
 *
 * The stylesheet builds a real M3 theme: `mat.theme` emits the `--mat-sys-*`
 * system tokens, then `select.theme($theme)` routes every `--cngx-select-*`
 * token onto its Material counterpart, so the trigger, panel surface, and
 * selected-node tones inherit the palette with no per-instance overrides.
 * `ViewEncapsulation.None` lets the global `html` theme and the
 * `:where(cngx-tree-select)` bridge rules reach both the trigger and the
 * top-layer panel.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CngxTreeSelect],
  styleUrl: './material-theme.component.scss',
  template: `
    <div class="demo">
      <cngx-tree-select
        [label]="'Regions'"
        [nodes]="nodes"
        [nodeIdFn]="nodeIdFn"
        [(values)]="values"
        [cascadeChildren]="true"
        placeholder="Pick regions…"
      />
      <p class="demo__readout">Selected: {{ values().join(', ') || '—' }}</p>
    </div>
  `,
})
export class MaterialThemeExample {
  protected readonly values = signal<string[]>([]);

  protected readonly nodeIdFn = (value: string): string => value;

  protected readonly nodes: CngxTreeNode<string>[] = [
    {
      value: 'europe',
      label: 'Europe',
      children: [
        { value: 'austria', label: 'Austria' },
        { value: 'germany', label: 'Germany' },
        { value: 'france', label: 'France' },
      ],
    },
    {
      value: 'americas',
      label: 'Americas',
      children: [
        { value: 'usa', label: 'United States' },
        { value: 'canada', label: 'Canada' },
        { value: 'brazil', label: 'Brazil' },
      ],
    },
  ];
}
