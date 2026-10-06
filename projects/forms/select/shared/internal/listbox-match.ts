import type { ListboxMatchFn } from '@cngx/common/interactive';

import type { CngxSelectMatchFn } from '../config';

/**
 * Views a typed select matcher as the `ListboxMatchFn` a `cngxListboxSearch`
 * input takes. The listbox hands the matcher `ActiveDescendantItem`s whose
 * `value` is the projected option's value, which in a select host is always
 * a `T` (the same narrowing `ad-activation-dispatcher` applies to activated
 * values). Returns the same function reference, so the listbox input only
 * changes when the matcher does and a per-object fold cache keeps hitting.
 *
 * @internal
 */
export function toListboxMatchFn<T>(match: CngxSelectMatchFn<T>): ListboxMatchFn {
  return match as unknown as ListboxMatchFn;
}
