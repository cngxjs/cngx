import { InjectionToken, type Signal } from '@angular/core';
import type { CngxListbox } from '@cngx/common/interactive';
import type { CngxPopoverPresentation } from '@cngx/common/popover';

import type { CngxResolvedSelectAriaLabels } from './internal/resolve-labels';
import type { CngxSelectTemplateRegistry } from './template-registry';

/**
 * @internal What `<cngx-select-sheet-header>` reads from its variant. Every
 * member is a signal or a callback; the header owns no select state.
 */
export interface CngxSelectSheetHeaderHost {
  /** The panel is open; the field label is read once per rising edge. */
  readonly panelVisible: Signal<boolean>;
  /** Resolved presentation of the panel's sheet, for the handle slot context. */
  readonly presentation: Signal<CngxPopoverPresentation>;
  /** A pessimistic commit is pending: X and Done are `aria-disabled` and inert. */
  readonly closeBlocked: Signal<boolean>;
  /** Static per variant: multi and input variants show Done. */
  readonly showDone: Signal<boolean>;
  /** Static per variant: Combobox, Typeahead and the action variants carry a header input. */
  readonly showInput: Signal<boolean>;
  /** The header input takes focus on open only when the open came from the keyboard. */
  readonly searchLeads: Signal<boolean>;
  /** Per-instance `[sheetLabel]`, wins over the field label. */
  readonly sheetLabel: Signal<string | undefined>;
  /** The variant's `[label]` input, used when no field label exists. */
  readonly label: Signal<string>;
  readonly ariaLabels: Signal<CngxResolvedSelectAriaLabels>;
  readonly tpl: Pick<CngxSelectTemplateRegistry, 'sheetHandle'>;
  /** Shared search term of the trigger input and the header input. */
  readonly searchTerm: Signal<string>;
  setSearchTerm(term: string): void;
  readonly listboxRef: Signal<CngxListbox | undefined>;
  /** Id of the popover panel the header input controls. */
  readonly panelId: Signal<string | null>;
  /** X and Done. */
  close(): void;
  /** Escape in the header input. */
  escapeClose(): void;
}

/** @internal Provided by every select-family variant. Not in `public-api.ts`. */
export const CNGX_SELECT_SHEET_HEADER_HOST = new InjectionToken<CngxSelectSheetHeaderHost>(
  'CngxSelectSheetHeaderHost',
);
