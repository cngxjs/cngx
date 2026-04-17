/**
 * Option descriptor for the Select family.
 *
 * @category interactive
 */
export interface CngxSelectOption<T = unknown> {
  readonly value: T;
  readonly label: string;
  readonly disabled?: boolean;
  /**
   * Optional arbitrary payload forwarded to option / trigger label templates.
   * Useful for icons, badges, or category metadata on a per-option basis.
   */
  readonly meta?: unknown;
}

/**
 * Optgroup descriptor for the Select family. Groups render a non-focusable
 * header and nested options.
 *
 * @category interactive
 */
export interface CngxSelectOptionGroup<T = unknown> {
  readonly label: string;
  readonly disabled?: boolean;
  readonly children: readonly CngxSelectOption<T>[];
}

/**
 * Union of flat options and grouped options. Accepted by every select-family
 * component's `[options]` input.
 *
 * @category interactive
 */
export type CngxSelectOptionsInput<T = unknown> = readonly (CngxSelectOption<T> | CngxSelectOptionGroup<T>)[];

/**
 * Type guard discriminating a group from a flat option.
 *
 * @category interactive
 */
export function isCngxSelectOptionGroup<T>(
  item: CngxSelectOption<T> | CngxSelectOptionGroup<T>,
): item is CngxSelectOptionGroup<T> {
  return (
    item != null &&
    typeof (item as { children?: unknown }).children !== 'undefined' &&
    Array.isArray((item as CngxSelectOptionGroup<T>).children)
  );
}

/**
 * Flatten a mixed `CngxSelectOptionsInput<T>` into a single array of options.
 * Used for keyboard navigation and compare lookups.
 *
 * @category interactive
 */
export function flattenSelectOptions<T>(
  input: CngxSelectOptionsInput<T>,
): CngxSelectOption<T>[] {
  const flat: CngxSelectOption<T>[] = [];
  for (const item of input) {
    if (isCngxSelectOptionGroup(item)) {
      for (const child of item.children) {
        flat.push(child);
      }
    } else {
      flat.push(item);
    }
  }
  return flat;
}
