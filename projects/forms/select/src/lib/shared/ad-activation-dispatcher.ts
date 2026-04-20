import { effect, untracked, type Signal } from '@angular/core';

import type { CngxListbox } from '@cngx/common/interactive';
import type { CngxPopover } from '@cngx/common/popover';

import type { CngxSelectCommitAction } from './commit-action.types';
import type { CngxSelectOptionDef } from './option.model';
import type { CngxSelectCore } from './select-core';

/**
 * Dependencies and callbacks for {@link createADActivationDispatcher}.
 *
 * @category interactive
 */
export interface ADActivationDispatcherOptions<T, V> {
  /**
   * The listbox whose `ad.activated` stream drives this dispatcher.
   * Typically the first `viewChild(CngxListbox)`. Null until the view
   * initialises; the effect skips subscription setup on null and
   * re-runs when the ref resolves.
   */
  readonly listboxRef: Signal<CngxListbox<unknown> | null | undefined>;
  /** Select-core handle — used only to resolve the activated option. */
  readonly core: CngxSelectCore<T, V>;
  /**
   * Popover to hide after a successful non-commit activation. Honoured
   * only when {@link closeOnSelect} is `true`. Omit for multi-select /
   * combobox / typeahead flavours that keep the panel open.
   */
  readonly popoverRef?: Signal<CngxPopover | null | undefined>;
  /**
   * When `true`, the dispatcher hides {@link popoverRef} after the
   * `onActivate` callback returns. True for single-select; false for
   * multi-select and combobox.
   */
  readonly closeOnSelect: boolean;
  /**
   * Current commit action. Resolved inside the dispatcher's `untracked`
   * block to decide between the commit path and the straight-activate
   * path — non-null routes to {@link onCommit}, null routes to
   * {@link onActivate}.
   */
  readonly commitAction: Signal<CngxSelectCommitAction<V> | null>;
  /**
   * Commit path — invoked when {@link commitAction} is non-null. The
   * consumer owns rollback-snapshot capture, optimistic vs pessimistic
   * mode, and the call into its own `beginCommit()`. Runs inside
   * `untracked()`.
   */
  readonly onCommit: (value: T, option: CngxSelectOptionDef<T>) => void;
  /**
   * Non-commit path — invoked when {@link commitAction} is null. The
   * consumer emits `selectionChange` / updates its model here. Popover
   * auto-close (when {@link closeOnSelect}) runs after this returns.
   */
  readonly onActivate: (value: T, option: CngxSelectOptionDef<T>) => void;
}

/**
 * Wire the listbox's ActiveDescendant `activated` stream into the select
 * variant's commit / non-commit callbacks. Installs a single
 * `effect(onCleanup)` that subscribes when the listbox ref resolves and
 * unsubscribes on teardown or re-run.
 *
 * Factored out of the three select variants (single / multi / combobox)
 * to (a) unify subscription lifecycle management, (b) guarantee the
 * activated payload runs inside `untracked` so callbacks can freely
 * read/write signals without polluting the effect's dep set, and
 * (c) enforce the opt-null guard uniformly — an activation whose value
 * does not resolve to a known option is silently dropped.
 *
 * Rollback-state ownership stays in the consumer: the dispatcher is
 * value-shape agnostic, which is why {@link onCommit} only receives the
 * raw activated value + option and not a pre/post snapshot tuple.
 *
 * @category interactive
 */
export function createADActivationDispatcher<T, V>(
  options: ADActivationDispatcherOptions<T, V>,
): void {
  effect((onCleanup) => {
    const lb = options.listboxRef();
    if (!lb) {
      return;
    }
    const sub = lb.ad.activated.subscribe((raw: unknown) => {
      untracked(() => {
        const value = raw as T;
        const opt = options.core.findOption(value);
        if (!opt) {
          return;
        }
        if (options.commitAction()) {
          options.onCommit(value, opt);
          return;
        }
        options.onActivate(value, opt);
        if (options.closeOnSelect) {
          options.popoverRef?.()?.hide();
        }
      });
    });
    onCleanup(() => sub.unsubscribe());
  });
}
