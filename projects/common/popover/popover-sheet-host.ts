import { InjectionToken, type Signal } from '@angular/core';
import type { SlotRegistry } from '@cngx/core/utils';

/**
 * Why a sheet asked to close: a swipe on the header or handle, a tap outside
 * the panel, the Android back gesture, or a close control inside the sheet.
 *
 * @category common/popover
 */
export type CngxPopoverSheetCloseReason = 'swipe' | 'backdrop' | 'back' | 'close';

/** @internal Handle a `CngxPopoverSheetTitle` registers. */
export interface CngxPopoverSheetTitleHandle {
  readonly id: Signal<string>;
}

/** @internal Handle a `CngxPopoverSheetInitialFocus` registers. */
export interface CngxPopoverSheetFocusHandle {
  readonly element: HTMLElement;
}

/**
 * @internal What the sheet parts need from `CngxPopoverSheet`. A token
 * instead of the directive class keeps the parts free of the directive
 * import (dialog-title precedent, `CNGX_DIALOG_ARIA_REGISTRY`).
 */
export interface CngxPopoverSheetPartsHost {
  readonly titleRegistry: SlotRegistry<CngxPopoverSheetTitleHandle>;
  readonly initialFocusRegistry: SlotRegistry<CngxPopoverSheetFocusHandle>;
  /** `true` while the sheet lays the panel out as sheet or fullscreen. */
  readonly modal: Signal<boolean>;
  requestClose(reason: CngxPopoverSheetCloseReason): void;
}

/** @internal Provided by `CngxPopoverSheet` for its parts. */
export const CNGX_POPOVER_SHEET_HOST = new InjectionToken<CngxPopoverSheetPartsHost>(
  'CngxPopoverSheetHost',
);
