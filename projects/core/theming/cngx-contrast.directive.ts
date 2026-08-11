import { Directive, input } from '@angular/core';
import type { CngxContrastPreference } from './contrast';

/**
 * Scopes the contrast preference to a subtree by reflecting
 * `[cngxContrast]` onto the host `[data-contrast]` attribute - the escape
 * hatch, not a per-component input.
 *
 * ```html
 * <section cngxContrast="more"> ... </section>
 * ```
 *
 * The override block (`contrast-tokens.css`) is unanchored, so a subtree
 * `more` strengthens borders and muted text for just that section. A
 * subtree `normal` or `auto` does **not** un-boost against a root
 * `data-contrast='more'` or an OS `prefers-contrast: more` context (a
 * documented limit - a pure-CSS ancestor selector cannot restore the
 * scheme-correct default token on a descendant without re-hardcoding a
 * colour, and subtree scoping is for the accessibility-critical *raising*
 * direction). Root `data-contrast='normal'` is what opts the document out,
 * via the `:root:not([data-contrast='normal'])` escape on the OS rule.
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
