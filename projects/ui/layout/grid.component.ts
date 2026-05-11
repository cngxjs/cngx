import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Composable CSS grid layout component.
 *
 * @example
 * <cngx-grid columns="3" gap="16px">
 *   <div>Cell 1</div>
 *   <div>Cell 2</div>
 * </cngx-grid>
 *
 * @category layout
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
  readonly columns = input<number | string>(1);
  /** CSS gap between cells. */
  readonly gap = input('16px');

  /** @internal */
  protected readonly gridTemplateColumns = computed(() => {
    const cols = this.columns();
    return typeof cols === 'number' ? `repeat(${cols}, 1fr)` : cols;
  });
}
