import { InjectionToken, type Provider, type TemplateRef } from '@angular/core';

import type { CngxPopoverArrowContext } from './popover-panel-slots';
import type { CngxPopoverPanelConfig, PopoverPanelFeature } from './popover-panel.types';

/** @internal Default configuration - no auto-dismiss, no close-on-success, variant='default'. */
const DEFAULT_CONFIG: CngxPopoverPanelConfig = {
  defaultVariant: 'default',
};

/**
 * Injection token for popover panel configuration.
 *
 * @category common/popover
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/popover/popover-panel.config.ts
 * @since 0.1.0
 */
export const CNGX_POPOVER_PANEL_CONFIG = new InjectionToken<CngxPopoverPanelConfig>(
  'CngxPopoverPanelConfig',
  { factory: () => DEFAULT_CONFIG },
);

/**
 * Provides configuration for `CngxPopoverPanel` instances.
 *
 * ```typescript
 * providers: [
 *   providePopoverPanel(
 *     withAutoDismiss({ info: 5000, success: 3000 }),
 *     withCloseOnSuccess(300),
 *   ),
 * ]
 * ```
 *
 * @category common/popover
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
 *
 * @category common/popover
 */
export function withAutoDismiss(timing: Record<string, number>): PopoverPanelFeature {
  return (config) => ({ ...config, autoDismiss: { ...config.autoDismiss, ...timing } });
}

/**
 * Auto-close the panel after an async action in the footer succeeds.
 *
 * @param delay - Delay in ms before closing. Defaults to `300`.
 *
 * @category common/popover
 */
export function withCloseOnSuccess(delay = 300): PopoverPanelFeature {
  return (config) => ({ ...config, closeOnSuccessDelay: delay });
}

/**
 * Set the default variant applied when no `variant` input is set.
 *
 * @category common/popover
 */
export function withDefaultVariant(variant: string): PopoverPanelFeature {
  return (config) => ({ ...config, defaultVariant: variant });
}

/**
 * Show the close button on all panels by default.
 *
 * @category common/popover
 */
export function withCloseButton(show = true): PopoverPanelFeature {
  return (config) => ({ ...config, showClose: show });
}

/**
 * Show the arrow on all panels by default.
 *
 * @category common/popover
 */
export function withArrow(show = true): PopoverPanelFeature {
  return (config) => ({ ...config, showArrow: show });
}

/**
 * Register an app-wide default template for the panel's arrow ornament.
 * The template receives a `CngxPopoverArrowContext` with `edge` and
 * `offsetPx` so the consumer's glyph can match the resolved placement.
 *
 * Per-instance `*cngxPopoverArrow` still wins over this default; the
 * library's rotated-diamond fallback only renders when neither tier is
 * set.
 *
 * ```typescript
 * providers: [
 *   providePopoverPanel(withArrowTemplate(brandArrowTpl)),
 * ]
 * ```
 *
 * @category common/popover
 */
export function withArrowTemplate(tpl: TemplateRef<CngxPopoverArrowContext>): PopoverPanelFeature {
  return (config) => ({ ...config, templates: { ...config.templates, arrow: tpl } });
}
