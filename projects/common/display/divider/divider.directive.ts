import { Directive, input } from '@angular/core';

/**
 * Thin presentational separator with proper ARIA semantics.
 *
 * Renders `role="separator"` + `aria-orientation` - required for assistive
 * technologies to announce the divider correctly. Visual style is driven by
 * CSS custom properties (`--cngx-divider-color`, `--cngx-divider-thickness`,
 * `--cngx-divider-inset`). Consumers apply their own styles through
 * `.cngx-divider` or override the variables.
 *
 * @category common/display
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/display/divider/divider.directive.ts
 * @selector cngx-divider
 * @since 0.1.0
 * <example-url>http://localhost:4200/#/common/display/divider/horizontal-vs-vertical</example-url>
 * <example-url>http://localhost:4200/#/common/display/divider/inset</example-url>
 */
@Directive({
  selector: 'cngx-divider, [cngxDivider]',
  exportAs: 'cngxDivider',
  standalone: true,
  host: {
    role: 'separator',
    class: 'cngx-divider',
    '[attr.aria-orientation]': 'orientation()',
    '[class.cngx-divider--vertical]': 'orientation() === "vertical"',
    '[class.cngx-divider--inset]': 'inset()',
  },
})
export class CngxDivider {
  /** Layout axis. Horizontal dividers sit between rows; vertical between columns. */
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  /** Whether start/end padding is applied inside the separator. */
  readonly inset = input<boolean>(false);
}
