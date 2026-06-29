import { effect, untracked, type Signal } from '@angular/core';

import type { CngxListbox } from '@cngx/common/interactive';
import type { CngxPopover } from '@cngx/common/popover';

import type { CngxSelectCommitAction } from './commit-action.types';
import type { CngxSelectOptionDef } from './option.model';
import type { CngxSelectCore } from './internal/select-core';

/**
 * Dependencies and callbacks for {@link createADActivationDispatcher}.
 *
 * @category forms/select/controllers
 */
export interface ADActivationDispatcherOptions<T, V> {
  /**
   * Listbox whose `ad.activated` stream drives this dispatcher. Null until
   * the viewChild resolves; the effect re-runs when it does.
   */
  readonly listboxRef: Signal<CngxListbox<unknown> | null | undefined>;
  /** Select-core handle for option resolution. */
  readonly core: CngxSelectCore<T, V>;
  /** Popover to hide after a non-commit activation when `closeOnSelect`. */
  readonly popoverRef?: Signal<CngxPopover | null | undefined>;
  /** Single-select: `true`. Multi/combobox/typeahead: `false`. */
  readonly closeOnSelect: boolean;
  /** Non-null routes to {@link onCommit}; null to {@link onActivate}. */
  readonly commitAction: Signal<CngxSelectCommitAction<V> | null>;
  /** Commit path. Consumer owns rollback snapshot + mode. Runs untracked. */
  readonly onCommit: (value: T, option: CngxSelectOptionDef<T>) => void;
  /** Non-commit path. Popover close runs after this returns. */
  readonly onActivate: (value: T, option: CngxSelectOptionDef<T>) => void;
}

/**
 * Wires `listbox.ad.activated` into the variant's commit / non-commit
 * callbacks. Single `effect(onCleanup)` - subscribes on ref resolve,
 * unsubscribes on teardown. Payload runs inside `untracked`; activations
 * for unknown values are dropped. Value-shape agnostic - rollback
 * ownership stays in the consumer.
 *
 * @category forms/select/controllers
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
