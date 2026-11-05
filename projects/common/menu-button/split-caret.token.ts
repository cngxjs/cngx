import { InjectionToken } from '@angular/core';
import type { CngxButtonState } from '@cngx/common/button';

/**
 * Marks the button that can be the caret of a `cngxSplitButton`: provided
 * by `cngxIconMenuButton` (`useExisting` its `CNGX_BUTTON_STATE`), queried
 * by the split as a direct child. Main and caret are compared as the same
 * `CngxButtonState` instances, so the split never names a concrete class.
 *
 * @internal
 */
export const CNGX_SPLIT_CARET = new InjectionToken<CngxButtonState>('CngxSplitCaret');
