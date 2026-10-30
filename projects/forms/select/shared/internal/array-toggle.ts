import type { Signal, WritableSignal } from '@angular/core';

import type { CngxSelectCommitAction, CngxSelectCommitMode } from '../commit-action.types';
import type { CngxSelectOptionDef } from '../option.model';
import { commitLedgerFor } from './commit-ledger';
import type { CngxSelectCompareFn, CngxSelectCore } from './select-core';

/**
 * Change payload handed to `emitSelectionChange`. The variant spreads it
 * into its own change interface and adds `source: this` - the only
 * per-variant field in the event.
 *
 * @internal
 */
export interface ArrayToggleChange<T> {
  readonly values: readonly T[];
  readonly previousValues: readonly T[];
  readonly added: readonly T[];
  readonly removed: readonly T[];
  readonly option: CngxSelectOptionDef<T> | null;
  readonly action: 'toggle' | 'clear';
}

/**
 * Configuration for {@link createArrayToggleDispatch}.
 *
 * @internal
 */
export interface ArrayToggleDispatchOptions<T> {
  /** Component's primary value signal (multi-shape variants). */
  readonly values: WritableSignal<T[]>;
  readonly compareWith: Signal<CngxSelectCompareFn<T>>;
  readonly commitMode: Signal<CngxSelectCommitMode>;
  readonly commitAction: Signal<CngxSelectCommitAction<T[]> | null>;
  /** Source of `togglingOption`, `announce`, `panelHostAdapter.isSelected`. */
  readonly core: CngxSelectCore<T, T[]>;
  /**
   * Store the pre-mutation snapshot (the confirmed value while another
   * commit is in flight) that the toggle finalize reports as previous.
   */
  readonly setLastCommitted: (previous: T[]) => void;
  /** Lazy route into `ArrayCommitHandler.beginToggle`. */
  readonly beginToggle: (
    next: T[],
    previous: T[],
    option: CngxSelectOptionDef<T>,
    action: CngxSelectCommitAction<T[]>,
  ) => void;
  /** Lazy route into `ArrayCommitHandler.beginClear`. */
  readonly beginClear: (previous: T[], action: CngxSelectCommitAction<T[]>) => void;
  readonly emitOptionToggled: (option: CngxSelectOptionDef<T>, added: boolean) => void;
  readonly emitSelectionChange: (change: ArrayToggleChange<T>) => void;
  readonly emitCleared: () => void;
  /**
   * Variant side effect of a finalized toggle, run before the events.
   * `CngxActionMultiSelect` clears a stale quick-create error on a pick.
   */
  readonly onToggled?: (option: CngxSelectOptionDef<T>, isNowSelected: boolean) => void;
}

/**
 * API returned from {@link createArrayToggleDispatch}.
 *
 * @internal
 */
export interface ArrayToggleDispatch<T> {
  /** Emit `optionToggled` + `selectionChange(action:'toggle')` + announce. */
  readonly finalizeToggle: (
    opt: CngxSelectOptionDef<T>,
    isNowSelected: boolean,
    previousValues?: readonly T[],
  ) => void;
  /**
   * Emit `cleared` + `selectionChange(action:'clear')` without announcing.
   * Wire to `ArrayCommitHandlerOptions.onClearFinalize`; the commit
   * handler owns the clear announce on that path.
   */
  readonly clearFinalize: (previous: T[], finalValues: T[]) => void;
  /** Imperative clear-all used by slot + default button. */
  readonly clearAll: () => void;
  /**
   * `createADActivationDispatcher` commit path: pre-mutation snapshot,
   * optimistic write, `beginToggle`.
   */
  readonly handleADCommit: (toggledValue: T, opt: CngxSelectOptionDef<T>) => void;
  /**
   * `createADActivationDispatcher` non-commit path. Listbox already wrote
   * through `[(values)]`; inverts the toggle to recover the pre-mutation
   * snapshot. selected=true → previous = current \ {opt}; selected=false
   * → previous = current ∪ {opt}.
   */
  readonly handleADActivate: (value: T, opt: CngxSelectOptionDef<T>) => void;
  /**
   * Toggle that bypasses the listbox (closed-trigger typeahead): commits
   * through `handleADCommit` when a `commitAction` is bound, else writes and
   * finalizes directly.
   */
  readonly toggleByUser: (opt: CngxSelectOptionDef<T>) => void;
}

/**
 * Array-shape toggle/clear dispatch shared by the multi-value composites
 * (`CngxMultiSelect`, `CngxCombobox`, `CngxReorderableMultiSelect`,
 * `CngxActionMultiSelect`).
 * Owns the finalize events, the imperative clear-all, and the two
 * AD-activation closures; the variant owns outputs (`source: this`),
 * the `lastCommittedValues` snapshot field, and the commit handler.
 *
 * @internal
 */
export function createArrayToggleDispatch<T>(
  opts: ArrayToggleDispatchOptions<T>,
): ArrayToggleDispatch<T> {
  const ledger = commitLedgerFor<T[], T>(opts.core.commitController);

  const finalizeToggle = (
    opt: CngxSelectOptionDef<T>,
    isNowSelected: boolean,
    previousValues: readonly T[] = [],
  ): void => {
    opts.onToggled?.(opt, isNowSelected);
    opts.emitOptionToggled(opt, isNowSelected);
    opts.emitSelectionChange({
      values: opts.values(),
      previousValues,
      added: isNowSelected ? [opt.value] : [],
      removed: isNowSelected ? [] : [opt.value],
      option: opt,
      action: 'toggle',
    });
    opts.core.announce(opt, isNowSelected ? 'added' : 'removed', opts.values().length, true);
  };

  const clearFinalize = (previous: T[], finalValues: T[]): void => {
    opts.emitCleared();
    opts.emitSelectionChange({
      values: finalValues,
      previousValues: previous,
      added: [],
      removed: previous,
      option: null,
      action: 'clear',
    });
  };

  const clearAll = (): void => {
    const previous = [...opts.values()];
    if (previous.length === 0) {
      return;
    }
    const action = opts.commitAction();
    if (action) {
      opts.setLastCommitted(ledger.baseline(previous));
      opts.core.togglingOption.set(null);
      if (opts.commitMode() === 'optimistic') {
        opts.values.set([]);
      }
      opts.beginClear(previous, action);
      return;
    }
    opts.values.set([]);
    clearFinalize(previous, []);
    opts.core.announce(null, 'removed', 0, true);
  };

  const handleADCommit = (toggledValue: T, opt: CngxSelectOptionDef<T>): void => {
    const previous = [...opts.values()];
    const wasSelected = previous.some((v) => opts.compareWith()(v, toggledValue));
    const next = wasSelected
      ? previous.filter((v) => !opts.compareWith()(v, toggledValue))
      : [...previous, toggledValue];
    // Change events of a superseding toggle report the confirmed selection.
    opts.setLastCommitted(ledger.baseline(previous));
    opts.core.togglingOption.set(opt);
    if (opts.commitMode() === 'optimistic') {
      opts.values.set(next);
    }
    const action = opts.commitAction();
    if (action) {
      opts.beginToggle(next, previous, opt, action);
    }
  };

  const handleADActivate = (_value: T, opt: CngxSelectOptionDef<T>): void => {
    const currentSelected = opts.core.panelHostAdapter.isSelected(opt);
    const current = opts.values();
    const eq = opts.compareWith();
    const previousValues = currentSelected
      ? current.filter((v) => !eq(v, opt.value))
      : [...current, opt.value];
    finalizeToggle(opt, currentSelected, previousValues);
  };

  const toggleByUser = (opt: CngxSelectOptionDef<T>): void => {
    if (opts.commitAction()) {
      handleADCommit(opt.value, opt);
      return;
    }
    const previous = [...opts.values()];
    const eq = opts.compareWith();
    const wasSelected = previous.some((v) => eq(v, opt.value));
    opts.values.set(
      wasSelected ? previous.filter((v) => !eq(v, opt.value)) : [...previous, opt.value],
    );
    finalizeToggle(opt, !wasSelected, previous);
  };

  return {
    finalizeToggle,
    clearFinalize,
    clearAll,
    handleADCommit,
    handleADActivate,
    toggleByUser,
  };
}
