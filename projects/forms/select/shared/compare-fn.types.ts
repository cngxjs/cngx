/**
 * Value-to-option equality behind `[compareWith]`: returns `true` when `a` and
 * `b` denote the same option. Either side is `undefined` while nothing is
 * selected.
 */
export type CngxSelectCompareFn<T> = (a: T | undefined, b: T | undefined) => boolean;
