import { InjectionToken, type Provider } from '@angular/core';

import type { CngxPopoverPanelConfig, PopoverPanelFeature } from './popover-panel.types';

/** Default configuration — no auto-dismiss, no close-on-success, variant='default'. */
const DEFAULT_CONFIG: CngxPopoverPanelConfig = {
  defaultVariant: 'default',
};

/** Injection token for popover panel configuration. */
export const CNGX_POPOVER_PANEL_CONFIG = new InjectionToken<CngxPopoverPanelConfig>(
  'CngxPopoverPanelConfig',
  { factory: () => DEFAULT_CONFIG },
);

/**
 * Provides configuration for `CngxPopoverPanel` instances.
 *
 * @usageNotes
 * ```typescript
 * providers: [
 *   providePopoverPanel(
 *     withAutoDismiss({ info: 5000, success: 3000 }),
 *     withCloseOnSuccess(300),
 *   ),
 * ]
 * ```
 */
export function providePopoverPanel(...features: PopoverPanelFeature[]): Provider {
  const config = features.reduce((acc, f) => f(acc), { ...DEFAULT_CONFIG });
  return { provide: CNGX_POPOVER_PANEL_CONFIG, useValue: config };
}

/**
 * Auto-dismiss the panel after a timeout, per variant.
 *
 * @param timing - Map of variant name to dismiss duration in ms.
 * ```typescript
 * withAutoDismiss({ info: 5000, success: 3000 })
 * ```
 */
export function withAutoDismiss(timing: Record<string, number>): PopoverPanelFeature {
  return (config) => ({ ...config, autoDismiss: { ...config.autoDismiss, ...timing } });
}

/**
 * Auto-close the panel after an async action in the footer succeeds.
 *
 * @param delay - Delay in ms before closing. Defaults to `300`.
 */
export function withCloseOnSuccess(delay = 300): PopoverPanelFeature {
  return (config) => ({ ...config, closeOnSuccessDelay: delay });
}

/**
 * Set the default variant applied when no `variant` input is set.
 */
export function withDefaultVariant(variant: string): PopoverPanelFeature {
  return (config) => ({ ...config, defaultVariant: variant });
}

/**
 * Show the close button on all panels by default.
 */
export function withCloseButton(show = true): PopoverPanelFeature {
  return (config) => ({ ...config, showClose: show });
}

/**
 * Show the arrow on all panels by default.
 */
export function withArrow(show = true): PopoverPanelFeature {
  return (config) => ({ ...config, showArrow: show });
}
