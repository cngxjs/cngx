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
}

/** Feature function signature for `providePopoverPanel()`. */
export type PopoverPanelFeature = (config: CngxPopoverPanelConfig) => CngxPopoverPanelConfig;
