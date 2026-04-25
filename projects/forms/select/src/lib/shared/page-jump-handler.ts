import type { CngxListbox } from '@cngx/common/interactive';
import type { CngxPopover } from '@cngx/common/popover';

import { isOptionDisabled } from './option.model';
import { resolvePageJumpTarget } from './typeahead-controller';

/**
 * Shared PageUp / PageDown keydown handler for every select-family
 * variant that renders a flat listbox panel. Semantics:
 *
 *   - PageUp / PageDown → `event.preventDefault()`
 *   - If the popover is closed → open it
 *   - Jump ±10 options from the current AD-highlighted index,
 *     clamping at the ends + skipping disabled via
 *     {@link resolvePageJumpTarget}
 *   - Disabled-aware target resolution reuses the family's shared
 *     `isOptionDisabled` helper (which handles both plain-boolean
 *     and InputSignal-disabled shapes)
 *
 * Non-PageUp/Down keys are ignored (return `false`), so consumers
 * can chain this before their own keydown logic without guard
 * duplication.
 *
 * @category interactive
 */
export function handlePageJumpKey(
  event: KeyboardEvent,
  opts: {
    readonly listbox: CngxListbox<unknown> | undefined;
    readonly popover: CngxPopover | undefined;
  },
): boolean {
  if (event.key !== 'PageDown' && event.key !== 'PageUp') {
    return false;
  }
  const { listbox, popover } = opts;
  if (!listbox || !popover) {
    return false;
  }
  event.preventDefault();
  if (!popover.isVisible()) {
    popover.show();
  }
  const options = listbox.options();
  const ad = listbox.ad;
  const currentId = ad.activeId();
  const currentIdx = options.findIndex((o) => o.id === currentId);
  const direction: 1 | -1 = event.key === 'PageDown' ? 1 : -1;
  const target = resolvePageJumpTarget(options, currentIdx, direction, (o) =>
    isOptionDisabled(o),
  );
  if (target !== null) {
    ad.highlightByIndex(target);
  }
  return true;
}
