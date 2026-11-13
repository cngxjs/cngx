import { InjectionToken, type Signal } from '@angular/core';
import type { CngxButtonState } from '@cngx/common/button';
import type { CngxPopover } from '@cngx/common/popover';

/**
 * What the caret of a `cngxSplitButton` hands the split.
 *
 * @internal
 */
export interface CngxSplitCaretRole {
  /** The caret host's `CNGX_BUTTON_STATE`, compared by identity with the main's. */
  readonly state: CngxButtonState;
  /** The popover of the co-hosted `CngxPopoverTrigger`, `null` without one. */
  readonly popover: Signal<CngxPopover | null>;
}

/**
 * Marks a possible caret of a `cngxSplitButton`: provided by
 * `CngxSplitCaret`, queried by the split as a direct child, so the split
 * never names a concrete class.
 *
 * @internal
 */
export const CNGX_SPLIT_CARET = new InjectionToken<CngxSplitCaretRole>('CngxSplitCaret');
