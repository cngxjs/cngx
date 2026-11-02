import type { CngxListbox } from '@cngx/common/interactive';
import type { CngxPopover } from '@cngx/common/popover';

import type { CngxFlatNavListboxItem, CngxFlatNavStrategy } from '../flat-nav-strategy';
import { isOptionDisabled, type CngxSelectOptionDef } from '../option.model';
import { resolvePageJumpTarget, type TypeaheadController } from '../typeahead-controller';
import type { CngxSelectCompareFn } from './select-core';

/**
 * Item list and current index a page jump resolves in, in the index space
 * `ad.highlightByIndex` addresses. A virtual panel renders only a window,
 * so `listbox.options()` and the active id would yield a window-relative
 * index; there the full flat list and `ad.activeIndex()` (absolute) are
 * used instead. Without virtualisation the rendered options are the space.
 *
 * @internal
 */
export function resolvePageJumpSpace(
  listbox: CngxListbox<unknown>,
  flatOptions: (() => readonly CngxFlatNavListboxItem[]) | undefined,
): { readonly items: readonly CngxFlatNavListboxItem[]; readonly currentIndex: number } {
  const ad = listbox.ad;
  if (flatOptions && ad.virtualCount() != null) {
    return { items: flatOptions(), currentIndex: ad.activeIndex() };
  }
  const items = listbox.options();
  const currentId = ad.activeId();
  return { items, currentIndex: items.findIndex((o) => o.id === currentId) };
}

/**
 * PageUp/PageDown handler for flat-panel select variants. Opens the
 * popover when closed, jumps ±10 from the AD-highlighted index via
 * {@link resolvePageJumpTarget}, returns `true` when handled. Other keys,
 * and every key while `disabled()` reports `true`, return `false`.
 *
 * @internal
 */
export function handlePageJumpKey(
  event: KeyboardEvent,
  opts: {
    readonly listbox: CngxListbox<unknown> | undefined;
    readonly popover: CngxPopover | undefined;
    /**
     * Full flat option list in AD order. Read only when the panel is
     * virtual, where it is the absolute index space of the AD.
     */
    readonly flatOptions?: () => readonly CngxFlatNavListboxItem[];
    /**
     * The control is disabled: the key is left alone and the panel stays
     * shut. The input variants disable their `<input>` natively, so they
     * never see the key; a focusable `aria-disabled` host passes this.
     */
    readonly disabled?: () => boolean;
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
  if (!listbox || !popover || opts.disabled?.()) {
    return false;
  }
  event.preventDefault();
  if (!popover.isVisible()) {
    popover.show();
  }
  const { items, currentIndex } = resolvePageJumpSpace(listbox, opts.flatOptions);
  const direction: 1 | -1 = event.key === 'PageDown' ? 1 : -1;
  const target = resolvePageJumpTarget(items, currentIndex, direction, (o) => isOptionDisabled(o));
  if (target !== null) {
    listbox.ad.highlightByIndex(target);
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
  /**
   * Absolute index space of a virtual panel when it differs from
   * `flatOptions`; `CngxSelectShell` passes its visible projected options.
   * Defaults to `flatOptions`.
   */
  readonly virtualSpace?: () => readonly CngxFlatNavListboxItem[];
  readonly compareWith: () => CngxSelectCompareFn<T>;
  readonly disabled: () => boolean;
  readonly typeaheadController: TypeaheadController<T>;
}

/**
 * Strategy-routed PageUp/PageDown handler for the button-trigger flat-nav
 * variants (`CngxSelect`, `CngxMultiSelect`, `CngxReorderableMultiSelect`,
 * `CngxSelectShell`). Unlike {@link handlePageJumpKey}
 * (combobox/typeahead) the jump target resolves through the injected
 * {@link CngxFlatNavStrategy}, so a consumer `CNGX_FLAT_NAV_STRATEGY`
 * override keeps steering page jumps. Opens the popover when closed,
 * returns `true` when the key was a handled page-jump key. Guards
 * modifier combos itself, mirroring {@link handlePageJumpKey}. A disabled
 * control (focusable through `aria-disabled`) leaves the key alone and
 * never opens the panel.
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
  if (deps.disabled()) {
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
  const { items, currentIndex: currentListboxIndex } = resolvePageJumpSpace(
    lb,
    deps.virtualSpace ?? deps.flatOptions,
  );
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
    lb.ad.highlightByIndex(action.index);
  }
  return true;
}
