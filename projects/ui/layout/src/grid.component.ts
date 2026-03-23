import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Composable CSS grid layout component.
 *
 * @example
 * <cngx-grid columns="3" gap="md">
 *   <div>Cell 1</div>
 *   <div>Cell 2</div>
 * </cngx-grid>
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
  readonly columns = input<number | string>(1);
  readonly gap = input('16px');

  protected readonly gridTemplateColumns = computed(() => {
    const cols = this.columns();
    return typeof cols === 'number' ? `repeat(${cols}, 1fr)` : cols;
  });
}
