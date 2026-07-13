import { Directive, input } from '@angular/core';
import type { CngxDensityValue } from './density';

/**
 * Scopes the density preference to a subtree by reflecting
 * `[cngxDensity]` onto the host `[data-density]` attribute. A section
 * so marked overrides the root density set by {@link provideDensity}
 * for its descendants - the escape hatch, not a per-component input.
 *
 * ```html
 * <section cngxDensity="spacious"> ... </section>
 * ```
 *
 * The input is optional (a bare `cngxDensity` attribute binds the empty
 * string, coerced to `undefined`), so it never asserts a required
 * binding; an unset value leaves `[data-density]` off the host.
 *
 * @category core/theming
 * @relatedTo provideDensity
 * @relatedTo CNGX_DENSITY
 * @since 0.1.0
 */
@Directive({
  selector: '[cngxDensity]',
  host: {
    '[attr.data-density]': 'density()',
  },
})
export class CngxDensity {
  readonly density = input<CngxDensityValue | undefined, CngxDensityValue | '' | undefined>(
    undefined,
    {
      alias: 'cngxDensity',
      transform: (value) => (value === '' ? undefined : value),
    },
  );
}
