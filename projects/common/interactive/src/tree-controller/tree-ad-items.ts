import { computed, type Signal } from '@angular/core';
import { type ActiveDescendantItem } from '@cngx/common/a11y';
import { type CngxTreeController } from './tree-controller';

function adEq(
  a: readonly ActiveDescendantItem[],
  b: readonly ActiveDescendantItem[],
): boolean {
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    const ai = a[i];
    const bi = b[i];
    if (
      ai.id !== bi.id ||
      !Object.is(ai.value, bi.value) ||
      ai.disabled !== bi.disabled ||
      ai.label !== bi.label
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Projects a tree controller's `visibleNodes` into the
 * `ActiveDescendantItem[]` shape consumed by `CngxActiveDescendant.items`.
 * Kept as a helper (not a method on the controller) so
 * `CngxTreeController` stays free of the `@cngx/common/a11y` import and
 * can be reused from contexts that do not render through AD.
 *
 * Returns a structurally-equal memoized computed — consumers can pass the
 * signal straight into `[items]="adItems()"` without worrying about cascade
 * re-renders on irrelevant tree re-emissions.
 *
 * @category interactive
 */
export function createTreeAdItems<T>(
  ctrl: CngxTreeController<T>,
): Signal<readonly ActiveDescendantItem[]> {
  return computed(
    () =>
      ctrl.visibleNodes().map<ActiveDescendantItem>((n) => ({
        id: n.id,
        value: n.value,
        label: n.label,
        disabled: n.disabled,
      })),
    { equal: adEq },
  );
}
