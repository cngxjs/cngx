/**
 * Data-level option descriptor for the Select family. Pass an array of these
 * to `[options]` for the data-driven composition mode.
 *
 * Element-level composition uses the `<cngx-option>` component (class name
 * `CngxSelectOption`) — the two are independent; consumers pick one per
 * instance.
 *
 * @category interactive
 */
export interface CngxSelectOptionDef<T = unknown> {
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
 * Data-level optgroup descriptor for the Select family.
 *
 * @category interactive
 */
export interface CngxSelectOptionGroupDef<T = unknown> {
  readonly label: string;
  readonly disabled?: boolean;
  readonly children: readonly CngxSelectOptionDef<T>[];
}

/**
 * Union of flat options and grouped options. Accepted by every select-family
 * component's `[options]` input in data-driven mode.
 *
 * @category interactive
 */
export type CngxSelectOptionsInput<T = unknown> = readonly (
  | CngxSelectOptionDef<T>
  | CngxSelectOptionGroupDef<T>
)[];

/**
 * Type guard discriminating a group from a flat option.
 *
 * @category interactive
 */
export function isCngxSelectOptionGroupDef<T>(
  item: CngxSelectOptionDef<T> | CngxSelectOptionGroupDef<T>,
): item is CngxSelectOptionGroupDef<T> {
  return (
    item != null &&
    typeof (item as { children?: unknown }).children !== 'undefined' &&
    Array.isArray((item as CngxSelectOptionGroupDef<T>).children)
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
): CngxSelectOptionDef<T>[] {
  const flat: CngxSelectOptionDef<T>[] = [];
  for (const item of input) {
    if (isCngxSelectOptionGroupDef(item)) {
      for (const child of item.children) {
        flat.push(child);
      }
    } else {
      flat.push(item);
    }
  }
  return flat;
}
