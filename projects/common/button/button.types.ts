/**
 * Emphasis axis of a cngx button. `solid` is a filled surface, `secondary` a
 * tonal fill, `outline` a border on a transparent surface, `ghost` no chrome
 * until hover, `link` an inline text link without control height.
 *
 * @category common/button
 */
export type CngxButtonVariant = 'solid' | 'secondary' | 'outline' | 'ghost' | 'link';

/**
 * Intent axis of a cngx button, orthogonal to the variant.
 *
 * @category common/button
 */
export type CngxButtonTone = 'neutral' | 'primary' | 'danger';

/**
 * Size axis of a cngx button. `md` equals the form-control row height.
 *
 * @category common/button
 */
export type CngxButtonSize = 'xs' | 'sm' | 'md' | 'lg';

/**
 * Value of the `type` input. Applies to `<button>` hosts only; an `<a>` host
 * renders no `type` attribute.
 *
 * @category common/button
 */
export type CngxButtonType = 'button' | 'submit' | 'reset';
