import type { CngxListbox } from '@cngx/common/interactive';
import type { CngxPopover } from '@cngx/common/popover';

import { isOptionDisabled } from '../option.model';
import { resolvePageJumpTarget } from '../typeahead-controller';

/**
 * PageUp/PageDown handler for flat-panel select variants. Opens the
 * popover when closed, jumps ±10 from the AD-highlighted index via
 * {@link resolvePageJumpTarget}, returns `true` when handled. Other keys
 * return `false`.
 *
 * @internal
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
