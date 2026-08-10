import { Directive, input } from '@angular/core';
import type { CngxTextScaleValue } from './text-scale';

/**
 * Scopes the text-scale preference to a subtree by reflecting
 * `[cngxTextScale]` onto the host `[data-text-size]` attribute. A
 * section so marked overrides the root scale set by
 * {@link provideTextScale} for its descendants - the escape hatch, not
 * a per-component input.
 *
 * ```html
 * <section cngxTextScale="lg"> ... </section>
 * ```
 *
 * The input is optional (a bare `cngxTextScale` attribute binds the
 * empty string, coerced to `undefined`), so it never asserts a required
 * binding; an unset value leaves `[data-text-size]` off the host.
 *
 * @category core/theming
 * @relatedTo provideTextScale
 * @relatedTo CNGX_TEXT_SCALE
 * @since 0.1.0
 */
@Directive({
  selector: '[cngxTextScale]',
  host: {
    '[attr.data-text-size]': 'textScale()',
  },
})
export class CngxTextScale {
  readonly textScale = input<CngxTextScaleValue | undefined, CngxTextScaleValue | '' | undefined>(
    undefined,
    {
      alias: 'cngxTextScale',
      transform: (value) => (value === '' ? undefined : value),
    },
  );
}
