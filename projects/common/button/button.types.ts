/**
 * Emphasis. `secondary` is a tonal fill, `ghost` has no chrome until hover, `link` is inline text
 * without control height.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button.types.ts
 * @since 0.1.0
 */
export type CngxButtonVariant = 'solid' | 'secondary' | 'outline' | 'ghost' | 'link';

/**
 * Intent, orthogonal to the variant.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button.types.ts
 * @since 0.1.0
 */
export type CngxButtonTone = 'neutral' | 'primary' | 'danger';

/**
 * `md` equals the form-control row height.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button.types.ts
 * @since 0.1.0
 */
export type CngxButtonSize = 'xs' | 'sm' | 'md' | 'lg';

/**
 * Native `type`; an `<a>` host renders none.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button.types.ts
 * @since 0.1.0
 */
export type CngxButtonType = 'button' | 'submit' | 'reset';
