import { Directive, input } from '@angular/core';
import type { CngxTouchTargetValue } from './touch-target';

/**
 * Scopes the touch-target mode to a subtree by reflecting
 * `[cngxTouchTarget]` onto the host `[data-touch]` attribute. A section
 * so marked pins the hit-area floor on / off for its descendants,
 * overriding the media-derived default set by {@link provideTouchTargets}
 * - the escape hatch, not a per-component input.
 *
 * ```html
 * <section cngxTouchTarget="on"> ... </section>
 * ```
 *
 * The input accepts only `'on'` / `'off'`: pinning a subtree is the
 * directive's whole job. `'auto'` is a root-only concept (it means
 * "defer to the `(any-pointer: coarse)` media query", which never
 * targets a subtree) and lives on {@link provideTouchTargets} instead.
 *
 * The input is optional (a bare `cngxTouchTarget` attribute binds the
 * empty string, coerced to `undefined`), so it never asserts a required
 * binding; an unset value leaves `[data-touch]` off the host and the
 * inherited floor keeps control.
 *
 * @category core/theming
 * @relatedTo provideTouchTargets
 * @relatedTo CNGX_TOUCH_TARGET
 * @since 0.1.0
 */
@Directive({
  selector: '[cngxTouchTarget]',
  host: {
    '[attr.data-touch]': 'touchTarget()',
  },
})
export class CngxTouchTarget {
  readonly touchTarget = input<
    Exclude<CngxTouchTargetValue, 'auto'> | undefined,
    Exclude<CngxTouchTargetValue, 'auto'> | '' | undefined
  >(undefined, {
    alias: 'cngxTouchTarget',
    transform: (value) => (value === '' ? undefined : value),
  });
}
