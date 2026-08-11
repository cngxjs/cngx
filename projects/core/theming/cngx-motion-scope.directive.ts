import { Directive, input } from '@angular/core';
import type { CngxMotionPreference } from './motion';

/**
 * Scopes the motion preference to a subtree by reflecting
 * `[cngxMotionScope]` onto the host `[data-motion]` attribute. A section
 * so marked overrides the root preference set by {@link provideMotion}
 * for its descendants - the escape hatch, not a per-component input.
 *
 * ```html
 * <section cngxMotionScope="reduced"> ... </section>
 * ```
 *
 * The safety net (`motion-tokens.css`) is unanchored, so a subtree
 * `reduced` collapses motion for just that section. A subtree `full` does
 * **not** re-enable motion against an OS `prefers-reduced-motion` reduce
 * preference (a documented limit - subtree scoping is for reducing, the
 * accessibility-critical direction); root `data-motion='full'` is what
 * escapes the OS reset app-wide.
 *
 * The input is optional (a bare `cngxMotionScope` attribute binds the
 * empty string, coerced to `undefined`), so it never asserts a required
 * binding; an unset value leaves `[data-motion]` off the host. Named
 * `CngxMotionScope` (not `CngxMotion`) to stay clear of the OS-preference
 * reader `CngxReducedMotion` in `@cngx/common/a11y`.
 *
 * @category core/theming
 * @relatedTo provideMotion
 * @relatedTo CNGX_MOTION
 * @since 0.1.0
 */
@Directive({
  selector: '[cngxMotionScope]',
  host: {
    '[attr.data-motion]': 'motion()',
  },
})
export class CngxMotionScope {
  readonly motion = input<CngxMotionPreference | undefined, CngxMotionPreference | '' | undefined>(
    undefined,
    {
      alias: 'cngxMotionScope',
      transform: (value) => (value === '' ? undefined : value),
    },
  );
}
