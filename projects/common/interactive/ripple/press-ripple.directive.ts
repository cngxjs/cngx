import { Directive } from '@angular/core';

import { CngxPressable } from './pressable.directive';
import { CngxRipple } from './ripple.directive';

/**
 * Molecule combining press feedback + ripple in a single directive.
 *
 * Composes `CngxPressable` and `CngxRipple` as `hostDirectives` so the consumer
 * gets both behaviors with one attribute. The `cngx-pressed` class and ripple wave
 * both activate on pointer contact.
 *
 * ### Button with press + ripple
 * ```html
 * <button cngxPressRipple>Click me</button>
 * ```
 *
 * ### With custom ripple color
 * ```html
 * <button cngxPressRipple [rippleColor]="'rgba(0,0,0,0.2)'">Click</button>
 * ```
 *
 * @category common/interactive
 * @docsKind primary
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/ripple/press-ripple.directive.ts
 * @since 0.1.0
 * @relatedTo CngxPressable, CngxRipple
 * <example-url>http://localhost:4200/#/common/interactive/ripple/press/buttons-with-press-ripple</example-url>
 */
@Directive({
  selector: '[cngxPressRipple]',
  exportAs: 'cngxPressRipple',
  standalone: true,
  hostDirectives: [
    {
      directive: CngxPressable,
      inputs: ['pressableReleaseDelay'],
    },
    {
      directive: CngxRipple,
      inputs: ['rippleColor', 'rippleCentered', 'rippleDisabled'],
    },
  ],
})
export class CngxPressRipple {}
