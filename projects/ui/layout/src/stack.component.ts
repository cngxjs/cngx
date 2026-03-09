import { Component, computed, input } from '@angular/core';

export type StackDirection = 'row' | 'column';
export type StackAlign = 'start' | 'center' | 'end' | 'stretch';
export type StackGap = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Composable flex-based stack layout component.
 *
 * @example
 * <cngx-stack direction="row" gap="md" align="center">
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 * </cngx-stack>
 */
@Component({
  selector: 'cngx-stack',
  standalone: true,
  template: '<ng-content />',
  styles: [
    `
      :host {
        display: flex;
      }
    `,
  ],
  host: {
    '[style.flex-direction]': 'direction()',
    '[style.align-items]': 'alignItems()',
    '[style.gap]': 'gapValue()',
  },
})
export class CngxStack {
  readonly direction = input<StackDirection>('column');
  readonly gap = input<StackGap>('md');
  readonly align = input<StackAlign>('stretch');

  protected readonly alignItems = computed(() => {
    const alignValue = this.align();
    return alignValue === 'stretch' ? 'stretch' : `flex-${alignValue}`;
  });

  protected readonly gapValue = computed(() => {
    const map: Record<StackGap, string> = {
      none: '0',
      xs: '4px',
      sm: '8px',
      md: '16px',
      lg: '24px',
      xl: '32px',
    };
    return map[this.gap()];
  });
}
