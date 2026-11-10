import { computed, type Signal } from '@angular/core';

import type { CngxSelectOptionDef } from '../option.model';
import { unresolvedOptionLabel } from './select-core';

/**
 * The formatter an input-led host writes its value through: a bound
 * `displayWith`, else the label of the selected option, else `String(value)`.
 * Tracks the host's equal-guarded `selected`, so a refetch that keeps the same
 * option builds no new formatter, while an option that arrives after the value
 * does and the display binding rewrites the unfocused input.
 *
 * @internal
 */
export function createOptionLabelFormatter<T>(
  displayWith: Signal<((value: T) => string) | undefined>,
  selected: Signal<CngxSelectOptionDef<T> | null>,
): Signal<(value: T) => string> {
  return computed<(value: T) => string>(() => {
    const bound = displayWith();
    if (bound) {
      return bound;
    }
    const option = selected();
    return (value) => option?.label ?? unresolvedOptionLabel(value);
  });
}
