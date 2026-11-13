/**
 * Emphasis axis of a cngx button. `solid` is a filled surface, `secondary` a
 * tonal fill, `outline` a border on a transparent surface, `ghost` no chrome
 * until hover, `link` an inline text link without control height.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button.types.ts
 * @since 0.1.0
 */
export type CngxButtonVariant = 'solid' | 'secondary' | 'outline' | 'ghost' | 'link';

/**
 * Intent axis of a cngx button, orthogonal to the variant.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button.types.ts
 * @since 0.1.0
 */
export type CngxButtonTone = 'neutral' | 'primary' | 'danger';

/**
 * Size axis of a cngx button. `md` equals the form-control row height.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button.types.ts
 * @since 0.1.0
 */
export type CngxButtonSize = 'xs' | 'sm' | 'md' | 'lg';

/**
 * Value of the `type` input. Applies to `<button>` hosts only; an `<a>` host
 * renders no `type` attribute.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button.types.ts
 * @since 0.1.0
 */
export type CngxButtonType = 'button' | 'submit' | 'reset';
