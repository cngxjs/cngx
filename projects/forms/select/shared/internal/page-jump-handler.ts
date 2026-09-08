import type { CngxListbox } from '@cngx/common/interactive';
import type { CngxPopover } from '@cngx/common/popover';

import type { CngxFlatNavStrategy } from '../flat-nav-strategy';
import { isOptionDisabled, type CngxSelectOptionDef } from '../option.model';
import { resolvePageJumpTarget, type TypeaheadController } from '../typeahead-controller';
import type { CngxSelectCompareFn } from './select-core';

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
  // Never hijack browser/app shortcuts: Ctrl/Cmd/Alt combos pass through
  // untouched - the same guard the nav strategies and CngxListboxTrigger
  // apply (Ctrl+PageDown stays a browser tab switch). Shift stays allowed.
  if (event.ctrlKey || event.metaKey || event.altKey) {
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
  const target = resolvePageJumpTarget(options, currentIdx, direction, (o) => isOptionDisabled(o));
  if (target !== null) {
    ad.highlightByIndex(target);
  }
  return true;
}

/**
 * Dependencies for {@link handleFlatNavPageJumpKey}.
 *
 * @internal
 */
export interface FlatNavPageJumpDeps<T> {
  readonly listbox: CngxListbox | undefined;
  readonly popover: CngxPopover | undefined;
  /** Injected `CNGX_FLAT_NAV_STRATEGY` - the consumer-overridable seam. */
  readonly strategy: CngxFlatNavStrategy;
  /** Accessors (signals qualify) - read only after the key check, so the keydown hot path stays free. */
  readonly flatOptions: () => readonly CngxSelectOptionDef<T>[];
  readonly compareWith: () => CngxSelectCompareFn<T>;
  readonly disabled: () => boolean;
  readonly typeaheadController: TypeaheadController<T>;
}

/**
 * Strategy-routed PageUp/PageDown handler for the flat-nav variants
 * (`CngxSelect`, `CngxMultiSelect`). Unlike {@link handlePageJumpKey}
 * (combobox/typeahead) the jump target resolves through the injected
 * {@link CngxFlatNavStrategy}, so a consumer `CNGX_FLAT_NAV_STRATEGY`
 * override keeps steering page jumps. Opens the popover when closed,
 * returns `true` when the key was a handled page-jump key. Guards
 * modifier combos itself, mirroring {@link handlePageJumpKey}.
 *
 * @internal
 */
export function handleFlatNavPageJumpKey<T>(
  event: KeyboardEvent,
  deps: FlatNavPageJumpDeps<T>,
): boolean {
  if (event.key !== 'PageDown' && event.key !== 'PageUp') {
    return false;
  }
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return false;
  }
  event.preventDefault();
  const pop = deps.popover;
  const lb = deps.listbox;
  if (!pop || !lb) {
    return true;
  }
  if (!pop.isVisible()) {
    pop.show();
  }
  const items = lb.options();
  const ad = lb.ad;
  const currentId = ad.activeId();
  const currentListboxIndex = items.findIndex((o) => o.id === currentId);
  const direction: 1 | -1 = event.key === 'PageDown' ? 1 : -1;
  const action = deps.strategy.onPageJump(
    {
      options: deps.flatOptions(),
      listboxItems: items,
      currentFlatIndex: -1,
      currentListboxIndex,
      compareWith: deps.compareWith(),
      disabled: deps.disabled(),
      typeaheadController: deps.typeaheadController,
    },
    direction,
  );
  if (action.kind === 'highlight') {
    ad.highlightByIndex(action.index);
  }
  return true;
}
