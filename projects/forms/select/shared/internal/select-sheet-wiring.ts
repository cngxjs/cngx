import { computed, inject, signal, type ElementRef, type Signal } from '@angular/core';
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
  'isCommitting' | 'resolvedPresentationRequest' | 'ariaLabels'
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
  /** The variant's anchored close (focus back to the trigger, then hide). */
  readonly close: () => void;
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
  /** A pessimistic commit is pending. */
  readonly closeBlocked: Signal<boolean>;
  /** Bound to `[closeOnEscape]`: only the modal sheet blocks Escape while a commit is pending. */
  readonly escapeEnabled: Signal<boolean>;
  /** Bound to `cngxClickOutside [enabled]`: outside a sheet the atom owns the outside tap. */
  readonly clickOutsideEnabled: Signal<boolean>;
  /** Anchored outside-click path of the variant (action dirty guard, `dismissOn`). */
  readonly handleClickOutside: () => void;
  /** `(closeRequested)` and X / Done: one dismiss policy for every sheet close vector. */
  readonly handleSheetClose: (reason: CngxPopoverSheetCloseReason) => void;
  /** The one Escape path of an in-sheet input. */
  readonly escapeClose: () => void;
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

  const escapeClose = (): void => {
    if (sheetModal()) {
      handleSheetClose('close');
      return;
    }
    opts.close();
  };

  const headerHost: CngxSelectSheetHeaderHost = {
    panelVisible: panelOpen,
    presentation,
    closeBlocked,
    showDone: signal(opts.showDone).asReadonly(),
    showInput: signal(opts.showInput).asReadonly(),
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
    closeBlocked,
    escapeEnabled: computed(() => !(sheetModal() && closeBlocked())),
    clickOutsideEnabled: computed(() => panelOpen() && sheetAnchored()),
    handleClickOutside: dismiss.handleClickOutside,
    handleSheetClose,
    escapeClose,
    headerHost,
  };
}
