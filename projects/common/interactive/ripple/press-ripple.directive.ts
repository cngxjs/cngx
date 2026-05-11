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
 * @usageNotes
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
 * @category interactive
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
