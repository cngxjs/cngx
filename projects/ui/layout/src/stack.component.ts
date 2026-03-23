import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type StackDirection = 'row' | 'column';
export type StackAlign = 'start' | 'center' | 'end' | 'stretch';
export type StackGap = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const GAP_DEFAULTS: Record<StackGap, string> = {
  none: '0',
  xs: 'var(--cngx-gap-xs, 4px)',
  sm: 'var(--cngx-gap-sm, 8px)',
  md: 'var(--cngx-gap-md, 16px)',
  lg: 'var(--cngx-gap-lg, 24px)',
  xl: 'var(--cngx-gap-xl, 32px)',
};

/**
 * Composable flex-based stack layout component.
 *
 * Gap tokens use CSS custom properties (`--cngx-gap-xs` through `--cngx-gap-xl`)
 * with sensible fallback defaults. Override them at any scope to match your
 * application's spacing scale.
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
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  protected readonly gapValue = computed(() => GAP_DEFAULTS[this.gap()]);
}
