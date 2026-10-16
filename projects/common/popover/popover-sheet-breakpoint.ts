import { DOCUMENT } from '@angular/common';
import { DestroyRef, inject, InjectionToken, type Signal } from '@angular/core';
import { createContainerSize } from '@cngx/common/layout';
import { injectWindow } from '@cngx/core/tokens';

const BREAKPOINT_PROPERTY = '--cngx-popover-sheet-breakpoint';

/**
 * @internal The `--cngx-popover-sheet-breakpoint` value `cngx-popover-sheet.css`
 * writes on the root: `'1'` on coarse, narrow viewports, `'0'` otherwise, `''`
 * before the first resize entry or without the stylesheet. One observer per
 * application, shared by every sheet.
 */
export const CNGX_POPOVER_SHEET_BREAKPOINT = new InjectionToken<Signal<string>>(
  'CngxPopoverSheetBreakpoint',
  {
    providedIn: 'root',
    factory: () =>
      createContainerSize(
        inject(DOCUMENT).documentElement,
        inject(DestroyRef),
        injectWindow(),
      ).property(BREAKPOINT_PROPERTY),
  },
);
