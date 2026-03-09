import { Component, HostBinding, Input } from '@angular/core';

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
  template: '<ng-content />',
  styles: [
    `
      :host {
        display: grid;
      }
    `,
  ],
})
export class GridComponent {
  @Input() columns: number | string = 1;
  @Input() gap = '16px';

  @HostBinding('style.grid-template-columns') get gridTemplateColumns() {
    return typeof this.columns === 'number'
      ? `repeat(${this.columns}, 1fr)`
      : this.columns;
  }

  @HostBinding('style.gap') get gapValue() {
    return this.gap;
  }
}
