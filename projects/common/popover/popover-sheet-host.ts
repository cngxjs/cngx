import { inject, InjectionToken, type Signal } from '@angular/core';
import type { KeyedRegistry, SlotRegistry } from '@cngx/core/utils';
import { CngxRuntimeError } from '@cngx/utils';

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
  /** Whether the element takes part in the next open. Absent means it does. */
  readonly enabled?: Signal<boolean>;
}

/**
 * @internal What the sheet parts need from `CngxPopoverSheet`. A token
 * instead of the directive class keeps the parts free of the directive
 * import (dialog-title precedent, `CNGX_DIALOG_ARIA_REGISTRY`).
 */
export interface CngxPopoverSheetPartsHost {
  readonly titleRegistry: SlotRegistry<CngxPopoverSheetTitleHandle>;
  /** Keyed by a per-handle uid; the first enabled handle in document order wins. */
  readonly initialFocusRegistry: KeyedRegistry<CngxPopoverSheetFocusHandle>;
  /** `true` while the sheet lays the panel out as sheet or fullscreen. */
  readonly modal: Signal<boolean>;
  requestClose(reason: CngxPopoverSheetCloseReason): void;
}

/** @internal Provided by `CngxPopoverSheet` for its parts. */
export const CNGX_POPOVER_SHEET_HOST = new InjectionToken<CngxPopoverSheetPartsHost>(
  'CngxPopoverSheetHost',
);

/**
 * @internal The sheet a part belongs to. A part outside a sheet would render
 * nothing useful (an unnamed dialog, a dead swipe), so it throws instead.
 */
export function injectPopoverSheetHost(part: string): CngxPopoverSheetPartsHost {
  const host = inject(CNGX_POPOVER_SHEET_HOST, { optional: true });
  if (!host) {
    throw new CngxRuntimeError(
      'CNGX1066',
      typeof ngDevMode !== 'undefined' &&
        ngDevMode &&
        `[${part}] must be placed inside an element with [cngxPopoverSheet].`,
    );
  }
  return host;
}
