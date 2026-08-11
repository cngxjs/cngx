import { Directive, input } from '@angular/core';
import type { CngxContrastPreference } from './contrast';

/**
 * Scopes the contrast preference to a subtree by reflecting
 * `[cngxContrast]` onto the host `[data-contrast]` attribute. A section so
 * marked overrides the root preference set by {@link provideContrast} for
 * its descendants - the escape hatch, not a per-component input.
 *
 * ```html
 * <section cngxContrast="more"> ... </section>
 * ```
 *
 * The input is optional (a bare `cngxContrast` attribute binds the empty
 * string, coerced to `undefined`), so it never asserts a required binding;
 * an unset value leaves `[data-contrast]` off the host.
 *
 * @category core/theming
 * @relatedTo provideContrast
 * @relatedTo CNGX_CONTRAST
 * @since 0.1.0
 */
@Directive({
  selector: '[cngxContrast]',
  host: {
    '[attr.data-contrast]': 'contrast()',
  },
})
export class CngxContrast {
  readonly contrast = input<
    CngxContrastPreference | undefined,
    CngxContrastPreference | '' | undefined
  >(undefined, {
    alias: 'cngxContrast',
    transform: (value) => (value === '' ? undefined : value),
  });
}
