import {
  computed,
  effect,
  inject,
  signal,
  untracked,
  type ElementRef,
  type Signal,
} from '@angular/core';
import type { CngxListbox } from '@cngx/common/interactive';
import type {
  CngxPopover,
  CngxPopoverPresentation,
  CngxPopoverPresentationRequest,
  CngxPopoverSheet,
  CngxPopoverSheetCloseReason,
} from '@cngx/common/popover';

import type { CngxSelectCommitMode } from '../commit-action.types';
import { CNGX_DISMISS_HANDLER_FACTORY } from '../dismiss-handler';
import type { CngxSelectSheetHeaderHost } from '../sheet-header-host';
import type { CngxSelectTemplateRegistry } from '../template-registry';
import { createSelectSheetScope, type CngxSelectSheetScope } from './scoped-announcer';
import type { CngxSelectCore } from './select-core';

/**
 * @internal The slice of the select core the wiring reads. Every variant
 * hands in its {@link CngxSelectCore}.
 */
export type CngxSelectSheetCore = Pick<
  CngxSelectCore<unknown, unknown>,
  'isCommitting' | 'resolvedPresentationRequest' | 'ariaLabels' | 'disabled' | 'listboxId'
>;

/** @internal Inputs of {@link createSelectSheetWiring}. */
export interface CngxSelectSheetWiringOptions {
  readonly core: CngxSelectSheetCore;
  readonly sheet: Signal<CngxPopoverSheet | undefined>;
  readonly popoverRef: Signal<CngxPopover | undefined>;
  readonly listboxRef: Signal<CngxListbox | undefined>;
  readonly tpl: Pick<CngxSelectTemplateRegistry, 'sheetHandle'>;
  /** Variants without a commit mode never block a close. */
  readonly commitMode?: Signal<CngxSelectCommitMode>;
  readonly dismissOn: 'outside' | 'escape' | 'both';
  readonly shouldBlockDismiss?: Signal<boolean>;
  /** Static per variant. */
  readonly showDone: boolean;
  /** Static per variant: the header carries an input. */
  readonly showInput: boolean;
  readonly sheetLabel: Signal<string | undefined>;
  readonly label: Signal<string>;
  readonly searchTerm?: Signal<string>;
  /**
   * The trigger input that owns the search term. The header input writes
   * through it, so the trigger's `CngxSearch` stays the one source.
   */
  readonly searchInput?: Signal<ElementRef<HTMLInputElement> | undefined>;
  /** The variant's `[inputMode]`; the trigger input's mode outside the keyboard hold. */
  readonly inputMode?: Signal<string>;
  /** The variant's anchored close (focus back to the trigger, then hide). */
  readonly close: () => void;
  /** Static per variant: the popup role the trigger announces while anchored. */
  readonly popupRole: 'listbox' | 'tree';
}

/**
 * @internal Input events of the trigger that the wiring reads, forwarded by
 * `CngxSelectSheetTrigger` in the capture phase so they land before the
 * trigger's own handlers open the panel.
 */
export interface CngxSelectSheetTriggerEvents {
  /** A pointer went down anywhere on the trigger. */
  handlePointerDown(): void;
  /** A key went down or text was entered on the trigger. */
  handleKey(): void;
  /** Focus landed on the trigger or one of its controls. */
  handleFocus(): void;
  /** Focus left a trigger control; `leftTrigger` when it left the trigger entirely. */
  handleFocusOut(event: FocusEvent, leftTrigger: boolean): void;
}

/**
 * @internal One bundle per variant: everything the template and the sheet
 * header need to present the panel as a mobile sheet. Doubles as the
 * scoped announcer's {@link CngxSelectSheetScope}.
 */
export interface CngxSelectSheetWiring extends CngxSelectSheetScope {
  /** Bound to `[cngxPopoverSheet]`. */
  readonly presentationRequest: Signal<CngxPopoverPresentationRequest>;
  readonly presentation: Signal<CngxPopoverPresentation>;
  readonly sheetAnchored: Signal<boolean>;
  readonly sheetModal: Signal<boolean>;
  /**
   * Bound to the trigger's `[haspopup]`: `'dialog'` while the sheet is modal,
   * the variant's popup role while anchored.
   */
  readonly triggerHaspopup: Signal<'dialog' | 'listbox' | 'tree'>;
  /**
   * Bound to the trigger's `[controls]`: the listbox / tree id while
   * anchored, `null` while modal so the popover trigger names the sheet.
   */
  readonly triggerControls: Signal<string | null>;
  /** A pessimistic commit is pending. */
  readonly closeBlocked: Signal<boolean>;
  /**
   * Bound to `[closeOnEscape]`: off under `dismissOn: 'outside'`, and the
   * modal sheet blocks Escape while a pessimistic commit is pending.
   */
  readonly escapeEnabled: Signal<boolean>;
  /** Bound to `cngxClickOutside [enabled]`: outside a sheet the atom owns the outside tap. */
  readonly clickOutsideEnabled: Signal<boolean>;
  /** Anchored outside-click path of the variant (action dirty guard, `dismissOn`). */
  readonly handleClickOutside: () => void;
  /** `(closeRequested)` and X / Done: one dismiss policy for every sheet close vector. */
  readonly handleSheetClose: (reason: CngxPopoverSheetCloseReason) => void;
  /** The one Escape path of an in-sheet input. */
  readonly escapeClose: () => void;
  /**
   * Focus left the host: hides the anchored panel unless a pending commit or
   * the variant's dismiss guard blocks it. The modal sheet traps focus and
   * keeps its own close vectors.
   */
  readonly handleFocusLeave: () => void;
  /**
   * The open came from the keyboard: a key or typed text on the trigger, or
   * focus that arrived without a pointer. The sheet search leads such an
   * open; a tap opens on the listbox, so it raises no soft keyboard.
   */
  readonly searchLeads: Signal<boolean>;
  /** Bound to `[cngxSelectSheetTrigger]` on the trigger. */
  readonly trigger: CngxSelectSheetTriggerEvents;
  /**
   * Bound to the trigger input's `[attr.inputmode]`: `'none'` while the
   * keyboard hold is on, else the variant's `[inputMode]`.
   */
  readonly triggerInputMode: Signal<string | null>;
  /**
   * Called around every programmatic refocus of the trigger input (the
   * host-focus and lifecycle-emitter brackets). On the modal sheet path it
   * starts the keyboard hold before the focus call, so the refocus after a
   * close does not raise the soft keyboard; the next pointer down, key or
   * blur on the trigger input ends it.
   */
  readonly handleTriggerRefocus: (active: boolean) => void;
  readonly headerHost: CngxSelectSheetHeaderHost;
}

const NO_SEARCH_TERM = signal('').asReadonly();

/**
 * @internal
 *
 * Shared sheet wiring of the select family. Injection context required: it
 * resolves the variant's dismiss handler through
 * `CNGX_DISMISS_HANDLER_FACTORY`, so the sheet close vectors and the
 * anchored outside click share one dismiss policy.
 */
export function createSelectSheetWiring(opts: CngxSelectSheetWiringOptions): CngxSelectSheetWiring {
  const presentation = computed<CngxPopoverPresentation>(
    () => opts.sheet()?.presentation() ?? 'anchored',
  );
  const sheetAnchored = computed(() => presentation() === 'anchored');
  const sheetModal = computed(() => !sheetAnchored());
  const closeBlocked = computed(
    () => opts.commitMode?.() === 'pessimistic' && opts.core.isCommitting(),
  );
  const panelOpen = computed(() => opts.popoverRef()?.isVisible() ?? false);

  // The open state follows `disabled`: a select that turns disabled while
  // open closes, so no variant keeps a panel it can no longer act on.
  effect(() => {
    if (!opts.core.disabled() || !panelOpen()) {
      return;
    }
    untracked(() => opts.popoverRef()?.hide());
  });

  const dismiss = inject(CNGX_DISMISS_HANDLER_FACTORY)({
    popoverRef: opts.popoverRef,
    dismissOn: opts.dismissOn,
    shouldBlockDismiss: opts.shouldBlockDismiss,
    closeBlocked,
  });

  // A custom dismiss factory may predate handleSheetClose: the outside tap
  // keeps its outside-click policy, every other vector hides. The pending
  // commit still blocks.
  const handleSheetClose = (reason: CngxPopoverSheetCloseReason): void => {
    if (dismiss.handleSheetClose) {
      dismiss.handleSheetClose(reason);
      return;
    }
    if (closeBlocked()) {
      return;
    }
    if (reason === 'backdrop') {
      dismiss.handleClickOutside();
      return;
    }
    opts.popoverRef()?.hide();
  };

  // Hides without the variant's close(): that one refocuses the trigger,
  // which would pull focus back from where the user just moved it.
  const handleFocusLeave = (): void => {
    if (!panelOpen() || !sheetAnchored()) {
      return;
    }
    if (closeBlocked() || opts.shouldBlockDismiss?.()) {
      return;
    }
    opts.popoverRef()?.hide();
  };

  const escapeEnabled = computed(
    () => opts.dismissOn !== 'outside' && !(sheetModal() && closeBlocked()),
  );

  const escapeClose = (): void => {
    if (opts.dismissOn === 'outside') {
      return;
    }
    if (sheetModal()) {
      handleSheetClose('close');
      return;
    }
    opts.close();
  };

  // The keyboard hold. The refocus runs synchronously inside the closing
  // tap, before change detection applies the binding, and the soft keyboard
  // is decided at focus time, so the hold writes the bound value once ahead
  // of the binding; the binding then carries it and restores the mode.
  const keyboardHeld = signal(false);
  const triggerInputMode = computed(() => (keyboardHeld() ? 'none' : (opts.inputMode?.() ?? null)));
  const releaseKeyboard = (): void => {
    keyboardHeld.set(false);
  };
  const handleTriggerRefocus = (active: boolean): void => {
    const input = opts.searchInput?.()?.nativeElement;
    if (!active || !input || !sheetModal()) {
      return;
    }
    keyboardHeld.set(true);
    input.setAttribute('inputmode', 'none');
  };

  // Which input reached the trigger last. A focus counts as the keyboard
  // unless a pointer went down on the trigger since focus last left it, so
  // a Tab in (openOn: 'focus') leads with the search and a tap does not.
  const keyboardLast = signal(false);
  let pointerSinceFocusLeft = false;
  const trigger: CngxSelectSheetTriggerEvents = {
    handlePointerDown: () => {
      pointerSinceFocusLeft = true;
      keyboardLast.set(false);
      releaseKeyboard();
    },
    handleKey: () => {
      keyboardLast.set(true);
      releaseKeyboard();
    },
    handleFocus: () => {
      if (!pointerSinceFocusLeft) {
        keyboardLast.set(true);
      }
    },
    handleFocusOut: (event, leftTrigger) => {
      if (leftTrigger) {
        pointerSinceFocusLeft = false;
      }
      if (event.target === opts.searchInput?.()?.nativeElement) {
        releaseKeyboard();
      }
    },
  };
  const searchLeads = keyboardLast.asReadonly();

  const headerHost: CngxSelectSheetHeaderHost = {
    panelVisible: panelOpen,
    presentation,
    closeBlocked,
    showDone: signal(opts.showDone).asReadonly(),
    showInput: signal(opts.showInput).asReadonly(),
    searchLeads,
    sheetLabel: opts.sheetLabel,
    label: opts.label,
    ariaLabels: opts.core.ariaLabels,
    tpl: opts.tpl,
    searchTerm: opts.searchTerm ?? NO_SEARCH_TERM,
    setSearchTerm: (term) => {
      const input = opts.searchInput?.()?.nativeElement;
      if (!input) {
        return;
      }
      input.value = term;
      input.dispatchEvent(new Event('input'));
    },
    listboxRef: opts.listboxRef,
    panelId: computed(() => opts.popoverRef()?.id() ?? null),
    close: () => handleSheetClose('close'),
    escapeClose,
  };

  return {
    ...createSelectSheetScope(opts.sheet, opts.popoverRef),
    presentationRequest: opts.core.resolvedPresentationRequest,
    presentation,
    sheetAnchored,
    sheetModal,
    triggerHaspopup: computed(() => (sheetModal() ? 'dialog' : opts.popupRole)),
    triggerControls: computed(() => (sheetModal() ? null : opts.core.listboxId)),
    closeBlocked,
    escapeEnabled,
    clickOutsideEnabled: computed(() => panelOpen() && sheetAnchored()),
    handleClickOutside: dismiss.handleClickOutside,
    handleSheetClose,
    escapeClose,
    handleFocusLeave,
    searchLeads,
    trigger,
    triggerInputMode,
    handleTriggerRefocus,
    headerHost,
  };
}
