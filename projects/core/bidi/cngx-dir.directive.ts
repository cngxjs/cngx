import { Directive, input } from '@angular/core';
import type { CngxDirection } from './direction';

/**
 * Scopes the writing direction of a subtree by reflecting `[cngxDir]` onto
 * the host `[attr.dir]` - the escape hatch for a directional island (an LTR
 * code block inside an RTL document, or vice versa), not a per-component
 * input.
 *
 * ```html
 * <section cngxDir="rtl"> ... </section>
 * ```
 *
 * This scopes **DOM/CSS** direction only: CSS logical properties and native
 * bidi flip correctly for the subtree. It does **not** fork the
 * {@link injectDirection} DI signal - that reader stays document-root
 * scoped (registered debt: subtree/re-parenting is untracked). A composite
 * whose keyboard-nav logic must honour a forced subtree direction supplies
 * {@link provideDirectionAt} in its `viewProviders`; `CngxDir` alone changes
 * what the browser lays out, not what `injectDirection()` reports.
 *
 * The input is optional (a bare `cngxDir` attribute binds the empty string,
 * coerced to `undefined`), so it never asserts a required binding; an unset
 * value leaves `[dir]` off the host.
 *
 * @category core/bidi
 * @docsKind primary
 * @relatedTo provideDirection
 * @relatedTo provideDirectionAt
 * @relatedTo CNGX_DIRECTION
 * @since 0.1.0
 * <example-url>http://localhost:4200/#/common/bidi/rtl/direction-sensitive-surfaces</example-url>
 */
@Directive({
  selector: '[cngxDir]',
  host: {
    '[attr.dir]': 'direction()',
  },
})
export class CngxDir {
  readonly direction = input<CngxDirection | undefined, CngxDirection | '' | undefined>(undefined, {
    alias: 'cngxDir',
    transform: (value) => (value === '' ? undefined : value),
  });
}
