import { Component, HostBinding, Input } from '@angular/core';

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
})
export class StackComponent {
  @Input() direction: StackDirection = 'column';
  @Input() gap: StackGap = 'md';
  @Input() align: StackAlign = 'stretch';

  @HostBinding('style.flex-direction') get flexDirection() {
    return this.direction;
  }

  @HostBinding('style.align-items') get alignItems() {
    return this.align === 'stretch' ? 'stretch' : `flex-${this.align}`;
  }

  @HostBinding('style.gap') get gapValue() {
    const map: Record<StackGap, string> = {
      none: '0',
      xs: '4px',
      sm: '8px',
      md: '16px',
      lg: '24px',
      xl: '32px',
    };
    return map[this.gap];
  }
}
