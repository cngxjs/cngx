import type { ElementRef, Signal } from '@angular/core';

import type { CngxListbox } from '@cngx/common/interactive';
import type { CngxPopover } from '@cngx/common/popover';

import { handlePageJumpKey } from './page-jump-handler';

/**
 * Dependencies for {@link createActionTriggerInput}. `Prev` is the
 * variant's previous-value snapshot shape (`T | undefined` for the
 * scalar organism, `readonly T[]` for the array organism).
 *
 * @internal
 */
export interface ActionTriggerInputDeps<Prev> {
  readonly listbox: () => CngxListbox | undefined;
  readonly popover: () => CngxPopover | undefined;
  readonly input: () => ElementRef<HTMLInputElement> | undefined;
  readonly searchTerm: Signal<string>;
  readonly liveInputFallback: Signal<boolean>;
  /** Truthiness of the bound `quickCreateAction`. */
  readonly hasQuickCreateAction: () => boolean;
  /** Pre-dispatch snapshot handed back through `dispatch`. */
  readonly snapshotPrevious: () => Prev;
  /** Route into `CreateCommitHandler.dispatch`. */
  readonly dispatch: (draft: { readonly label: string }, term: string, previous: Prev) => void;
}

/**
 * API returned from {@link createActionTriggerInput}.
 *
 * @internal
 */
export interface ActionTriggerInput {
  /**
   * Enter on the trigger input. With no active AD item, a bound
   * `quickCreateAction`, and a non-empty term, fires the create flow
   * (type-and-Enter UX). If an AD item is active, `CngxListboxTrigger`
   * already activated it; this is a no-op.
   */
  readonly handleTriggerEnter: (event: Event) => void;
  /** PageUp/PageDown shared behaviour (±10 option jump). */
  readonly handleInputKeydown: (event: KeyboardEvent) => void;
  /** Create-flow entry: draft from the action slot, else the live term. */
  readonly handleActionCommit: (draft?: { readonly label: string }) => void;
  /**
   * Live search-term accessor for the create flow. With
   * `liveInputFallback` (default), reads the raw `<input>.value` when
   * the debounced `searchTerm` hasn't caught up - prevents fast-typist
   * Create-button taps from no-op'ing in the debounce window. Disable
   * for predictable consumer-debounced payloads.
   */
  readonly resolveLiveTerm: () => string;
}

/**
 * Trigger-input keyboard + live-term dispatch shared by the action
 * organisms (`CngxActionSelect`, `CngxActionMultiSelect`). Both honour
 * the `liveInputFallback` switch identically; the variant owns the
 * create handler and its previous-value shape.
 *
 * @internal
 */
export function createActionTriggerInput<Prev>(
  deps: ActionTriggerInputDeps<Prev>,
): ActionTriggerInput {
  const resolveLiveTerm = (): string => {
    const term = deps.searchTerm();
    if (term !== '' || !deps.liveInputFallback()) {
      return term;
    }
    return deps.input()?.nativeElement.value ?? '';
  };

  const handleActionCommit = (draft?: { readonly label: string }): void => {
    const term = resolveLiveTerm();
    const effective = draft ?? { label: term };
    if (effective.label === '') {
      return;
    }
    deps.dispatch(effective, term, deps.snapshotPrevious());
  };

  const handleTriggerEnter = (event: Event): void => {
    const ad = deps.listbox()?.ad;
    if (ad?.activeItem()) {
      return;
    }
    if (!deps.hasQuickCreateAction()) {
      return;
    }
    const term = resolveLiveTerm();
    if (term === '') {
      return;
    }
    event.preventDefault();
    handleActionCommit();
  };

  const handleInputKeydown = (event: KeyboardEvent): void => {
    handlePageJumpKey(event, {
      listbox: deps.listbox(),
      popover: deps.popover(),
    });
  };

  return { handleTriggerEnter, handleInputKeydown, handleActionCommit, resolveLiveTerm };
}
