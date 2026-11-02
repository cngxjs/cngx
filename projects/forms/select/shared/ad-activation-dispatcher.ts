import { effect, untracked, type Signal } from '@angular/core';

import type { CngxListbox } from '@cngx/common/interactive';
import type { CngxPopover } from '@cngx/common/popover';

import type { CngxSelectCommitAction } from './commit-action.types';
import type { CngxSelectOptionDef } from './option.model';

/**
 * The part of a select composite's core that
 * {@link createADActivationDispatcher} reads: the write gate and the option
 * lookup. A composite passes its full core; a custom host only has to supply
 * these two members.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/ad-activation-dispatcher.ts
 * @since 0.1.0
 * @relatedTo createADActivationDispatcher, CngxCommitHandlerCore
 */
export interface CngxActivationDispatcherCore<T> {
  /** `true` while the control is disabled or readonly; activations are then dropped. */
  readonly writeBlocked: Signal<boolean>;
  /** Option for `value` among the merged options, `null` when none matches. */
  findOption(value: T): CngxSelectOptionDef<T> | null;
}

/**
 * Dependencies and callbacks for {@link createADActivationDispatcher}.
 */
export interface ADActivationDispatcherOptions<T, V> {
  /**
   * Listbox whose `ad.activated` stream drives this dispatcher. Null until
   * the viewChild resolves; the effect re-runs when it does.
   */
  readonly listboxRef: Signal<CngxListbox<unknown> | null | undefined>;
  /** Write gate and option lookup, usually the composite's select core. */
  readonly core: CngxActivationDispatcherCore<T>;
  /** Popover to hide after a non-commit activation when `closeOnSelect`. */
  readonly popoverRef?: Signal<CngxPopover | null | undefined>;
  /**
   * Runs right before that hide. The variants move focus back to the trigger
   * here when it sits inside the panel (a search input), since the popover
   * blurs focus inside the panel on hide.
   */
  readonly beforeHide?: () => void;
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
        // A disabled or readonly select writes nothing, even an activation already queued.
        if (options.core.writeBlocked()) {
          return;
        }
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
          options.beforeHide?.();
          options.popoverRef?.()?.hide();
        }
      });
    });
    onCleanup(() => sub.unsubscribe());
  });
}
