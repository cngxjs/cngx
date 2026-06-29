/**
 * Data-driven option for the Select family. Pass an array to `[options]`.
 * Element-driven composition uses `<cngx-option>` (`CngxSelectOption`) -
 * pick one mode per instance.
 *
 * @category forms/select/state
 */
export interface CngxSelectOptionDef<T = unknown> {
  readonly value: T;
  readonly label: string;
  readonly disabled?: boolean;
  /** Forwarded to label templates - icons, badges, category metadata. */
  readonly meta?: unknown;
}

/**
 * Data-driven optgroup descriptor.
 *
 * @category forms/select/state
 */
export interface CngxSelectOptionGroupDef<T = unknown> {
  readonly label: string;
  readonly disabled?: boolean;
  readonly children: readonly CngxSelectOptionDef<T>[];
}

/**
 * Mixed flat-or-grouped options accepted by `[options]` in data-driven mode.
 *
 * @category forms/select/state
 */
export type CngxSelectOptionsInput<T = unknown> = readonly (
  | CngxSelectOptionDef<T>
  | CngxSelectOptionGroupDef<T>
)[];

/**
 * Group / flat-option type guard.
 *
 * @category forms/select/state
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
 * Flattens grouped + flat input. Used by keyboard nav and compare lookups.
 *
 * @category forms/select/state
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

/**
 * Filters by `term` using a listbox `match` fn. Preserves group shape;
 * empty groups dropped. The matcher payload's `id: ''` is synthetic; real
 * DOM ids come from `CngxOption`, and in-tree matchers ignore the field.
 *
 * @category forms/select/state
 */
export function filterSelectOptions<T>(
  input: CngxSelectOptionsInput<T>,
  term: string,
  match: (
    option: { readonly id: string; readonly value: T; readonly label: string; readonly disabled: boolean },
    term: string,
  ) => boolean,
): CngxSelectOptionsInput<T> {
  if (term === '') {
    return input;
  }
  const out: (CngxSelectOptionDef<T> | CngxSelectOptionGroupDef<T>)[] = [];
  for (const item of input) {
    if (isCngxSelectOptionGroupDef(item)) {
      const kept = item.children.filter((opt) =>
        match(
          { id: '', value: opt.value, label: opt.label, disabled: !!opt.disabled },
          term,
        ),
      );
      if (kept.length > 0) {
        out.push({ ...item, children: kept });
      }
    } else {
      if (
        match(
          { id: '', value: item.value, label: item.label, disabled: !!item.disabled },
          term,
        )
      ) {
        out.push(item);
      }
    }
  }
  return out;
}

/**
 * Folds a local-items buffer onto server-provided options, deduped by
 * value via `compareWith`. Group shape preserved; locals appended flat
 * after groups. Server wins on collision - locals matching a provided
 * value drop silently.
 *
 * Identity-stable when `localItems` is empty (returns `provided`).
 *
 * @category forms/select/state
 */
export function mergeLocalItems<T>(
  provided: CngxSelectOptionsInput<T>,
  localItems: readonly CngxSelectOptionDef<T>[],
  compareWith: (a: T | undefined, b: T | undefined) => boolean,
): CngxSelectOptionsInput<T> {
  if (localItems.length === 0) {
    return provided;
  }
  const providedFlat = flattenSelectOptions(provided);
  const surviving: CngxSelectOptionDef<T>[] = [];
  for (const local of localItems) {
    const alreadyInProvided = providedFlat.some((opt) =>
      compareWith(opt.value, local.value),
    );
    if (!alreadyInProvided) {
      surviving.push(local);
    }
  }
  if (surviving.length === 0) {
    return provided;
  }
  return [...provided, ...surviving];
}

/**
 * Disabled-check across both option shapes:
 * - `CngxSelectOptionDef.disabled` - plain `boolean` (data-driven)
 * - `CngxOption.disabled` - `InputSignal<boolean>` (element-driven, callable)
 *
 * Direct `.disabled` access would treat every signal as truthy (TS2774).
 */
export function isOptionDisabled(option: {
  readonly disabled?: boolean | (() => boolean) | null;
}): boolean {
  const d = option.disabled;
  if (d == null) {
    return false;
  }
  return typeof d === 'function' ? d() : d;
}
