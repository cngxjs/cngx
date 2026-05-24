import type { TemplateRef } from '@angular/core';

import type { CngxPopoverArrowContext } from './popover-panel-slots';

/** Configuration for `CngxPopoverPanel` provided via `providePopoverPanel()`. */
export interface CngxPopoverPanelConfig {
  /**
   * Auto-dismiss timing per variant in ms.
   * `undefined` = no auto-dismiss (default).
   * Example: `{ info: 5000, success: 3000 }`
   */
  autoDismiss?: Record<string, number>;

  /**
   * Delay in ms before closing the panel after an action succeeds.
   * `0` = close immediately on success. `undefined` = don't auto-close.
   */
  closeOnSuccessDelay?: number;

  /** Default variant string applied when none is set on the component. */
  defaultVariant?: string;

  /** Default for `showClose`. `undefined` = per-component default (`false`). */
  showClose?: boolean;

  /** Default for `showArrow`. `undefined` = per-component default (`false`). */
  showArrow?: boolean;

  /**
   * App-wide template overrides for the panel's visible regions. Each
   * entry is the third tier of the slot cascade — per-instance
   * `contentChild` directives still win, the library defaults still
   * lose. Set via `withArrowTemplate(...)` and friends.
   */
  templates?: {
    /**
     * Default `*cngxPopoverArrow` template for every `<cngx-popover-panel>`
     * in the application. Per-instance `ng-template cngxPopoverArrow`
     * still wins.
     */
    arrow?: TemplateRef<CngxPopoverArrowContext>;
  };
}

/** Feature function signature for `providePopoverPanel()`. */
export type PopoverPanelFeature = (config: CngxPopoverPanelConfig) => CngxPopoverPanelConfig;
