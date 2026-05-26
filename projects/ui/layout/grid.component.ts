import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Composable CSS grid layout component.
 ``` html
 <cngx-grid columns="3" gap="16px">
   <div>Cell 1</div>
   <div>Cell 2</div>
 </cngx-grid>
  ```
 * `columns` accepts either a positive integer for the
 * `repeat(N, 1fr)` shortcut or any `grid-template-columns` value
 * (`"200px 1fr"`, `"repeat(auto-fit, minmax(120px, 1fr))"`).
 * Bare attribute syntax works for both forms: `columns="3"` and
 * `[columns]="3"` produce identical output.
 */
@Component({
  selector: 'cngx-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  styles: [
    `
      :host {
        display: grid;
      }
    `,
  ],
  host: {
    '[style.grid-template-columns]': 'gridTemplateColumns()',
    '[style.gap]': 'gap()',
  },
})
export class CngxGrid {
  /** Number of equal columns, or a custom `grid-template-columns` value. */
  readonly columns = input<number | string, number | string>(1, {
    transform: coerceColumns,
  });
  /** CSS gap between cells. */
  readonly gap = input('16px');

  /** @internal */
  protected readonly gridTemplateColumns = computed(() => {
    const cols = this.columns();
    return typeof cols === 'number' ? `repeat(${cols}, 1fr)` : cols;
  });
}

// Bare integer attribute (`columns="3"`) coerces to a number so the
// `repeat(N, 1fr)` branch fires; anything else is a track-list string
// (`"200px 1fr"`) and passes through to `grid-template-columns`.
function coerceColumns(value: number | string): number | string {
  if (typeof value === 'number') {
    return value;
  }
  return /^\d+$/.test(value) ? Number(value) : value;
}
