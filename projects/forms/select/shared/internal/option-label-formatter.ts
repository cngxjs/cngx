import { computed, linkedSignal, untracked, type Signal } from '@angular/core';

import type { CngxSelectOptionDef } from '../option.model';
import { isEmptyScalar } from './compare';
import { unresolvedOptionLabel, type CngxSelectCompareFn } from './select-core';

/**
 * The formatter an input-led host writes its value through: a bound
 * `displayWith`, else the label of the option for the value, else
 * `String(value)`.
 *
 * The label is the last one resolved for the committed value: a refetch that
 * renames the option updates it, a result set that drops the option keeps it.
 * The formatter changes identity only when that label string changes, so the
 * display binding does not rewrite the unfocused input on a refetch that
 * keeps the label. An argument other than the committed value is looked up
 * on its own.
 *
 * @internal
 */
export function createOptionLabelFormatter<T>(
  displayWith: Signal<((value: T) => string) | undefined>,
  value: Signal<T | undefined>,
  findOption: (value: T) => CngxSelectOptionDef<T> | null,
  compareWith: Signal<CngxSelectCompareFn<T>>,
): Signal<(value: T) => string> {
  const label = linkedSignal<
    { readonly value: T | undefined; readonly label: string | null },
    string | null
  >({
    source: () => {
      const current = value();
      const option = isEmptyScalar(current) ? null : findOption(current as T);
      return { value: current, label: option?.label ?? null };
    },
    computation: (source, previous) => {
      if (source.label !== null) {
        return source.label;
      }
      const sameValue =
        previous !== undefined &&
        !isEmptyScalar(source.value) &&
        untracked(compareWith)(previous.source.value, source.value);
      return sameValue ? previous.value : null;
    },
  });

  return computed<(value: T) => string>(() => {
    const bound = displayWith();
    if (bound) {
      return bound;
    }
    const resolved = label();
    return (arg) => {
      if (resolved !== null && untracked(compareWith)(arg, untracked(value))) {
        return resolved;
      }
      return untracked(() => findOption(arg))?.label ?? unresolvedOptionLabel(arg);
    };
  });
}
