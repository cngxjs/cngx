import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Main-axis direction for {@link CngxStack}.
 *
 * @category ui/layout
 */
export type StackDirection = 'row' | 'column';
/**
 * Cross-axis alignment for {@link CngxStack}.
 *
 * @category ui/layout
 */
export type StackAlign = 'start' | 'center' | 'end' | 'stretch';
/**
 * Spacing scale for {@link CngxStack}. Maps to `--cngx-gap-*` tokens.
 *
 * @category ui/layout
 */
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
 * <cngx-stack direction="row" gap="md" align="center">
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 * </cngx-stack>
 *
 * @category ui/layout
 * @docsKind primary
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/layout/stack.component.ts
 * @since 0.1.0
 * @relatedTo CngxGrid
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
  /** Flex direction of the stack. */
  readonly direction = input<StackDirection>('column');
  /** Named spacing token between stack items. Resolves via `--cngx-gap-*` CSS custom properties. */
  readonly gap = input<StackGap>('md');
  /** Cross-axis alignment of stack items. */
  readonly align = input<StackAlign>('stretch');

  /** @internal */
  protected readonly alignItems = computed(() => {
    const alignValue = this.align();
    return alignValue === 'stretch' ? 'stretch' : `flex-${alignValue}`;
  });

  /** @internal */
  protected readonly gapValue = computed(() => GAP_DEFAULTS[this.gap()]);
}
