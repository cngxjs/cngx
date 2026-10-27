/**
 * Emphasis axis of a cngx button. `solid` is a filled surface, `secondary` a
 * tonal fill, `outline` a border on a transparent surface, `ghost` no chrome
 * until hover, `link` an inline text link without control height.
 */
export type CngxButtonVariant = 'solid' | 'secondary' | 'outline' | 'ghost' | 'link';

/**
 * Intent axis of a cngx button, orthogonal to the variant.
 */
export type CngxButtonTone = 'neutral' | 'primary' | 'danger';

/**
 * Size axis of a cngx button. `md` equals the form-control row height.
 */
export type CngxButtonSize = 'xs' | 'sm' | 'md' | 'lg';

/**
 * Value of the `type` input. Applies to `<button>` hosts only; an `<a>` host
 * renders no `type` attribute.
 */
export type CngxButtonType = 'button' | 'submit' | 'reset';
