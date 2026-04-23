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

/**
 * Filter a `CngxSelectOptionsInput<T>` by a search term using a listbox
 * matcher. Preserves the input's group/flat shape: grouped entries stay
 * grouped; empty groups (no surviving children) are dropped.
 *
 * The synthetic `id: ''` on the matcher payload is deliberate — every
 * in-tree matcher (including {@link ListboxMatchFn}'s default
 * label-substring) ignores the id field. Real options get their DOM id
 * from `CngxOption`, not from this data-level scan.
 *
 * @category interactive
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
 * Merge a persistent local-items buffer on top of server-provided
 * options, deduped by value via `compareWith`. The input's shape is
 * preserved — grouped entries stay grouped, locals are appended flat
 * after every group. Local items that match any provided option
 * (including group children) are dropped from the local side; the
 * server's version wins the collision.
 *
 * **Why this exists.** The action-select organisms (`CngxActionSelect`
 * / `CngxActionMultiSelect`) support an inline quick-create workflow:
 * the consumer presses a button in the panel's action slot, the
 * committed item is inserted locally (optimistic), then stays visible
 * across subsequent server refetches until the server catches up —
 * at which point the dedup drops the local copy silently.
 *
 * **Identity guarantee.** When `localItems` is empty the `provided`
 * array is returned unchanged (reference-stable). Downstream
 * `effectiveOptions` consumers keep their identity-based equality
 * short-circuits intact.
 *
 * @category interactive
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
 * Uniform "is this option disabled?" check that handles both option shapes
 * transparently.
 *
 * **Why this helper exists.**
 * The select family operates on two distinct option types that share the
 * same property name but use different shapes:
 *
 * - `CngxSelectOptionDef.disabled` — plain `boolean` (data-driven mode)
 * - `CngxOption.disabled` — `InputSignal<boolean>`, i.e. a callable function
 *   (element-component mode)
 *
 * In places that iterate over a mixed or unknown-variant array (PageUp/Down
 * navigation, typeahead-while-closed, focus scanning), accessing `.disabled`
 * directly silently evaluates to `true` for the signal variant (functions
 * are truthy), which previously flagged a `TS2774` warning in strict mode
 * and would cause navigation logic to treat every option as disabled at
 * runtime if the compiler didn't catch it. Centralising the branching here
 * prevents every future call-site from having to remember the distinction.
 *
 * @category interactive
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
