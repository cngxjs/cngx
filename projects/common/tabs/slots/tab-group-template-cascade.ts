import { computed, type Signal, type TemplateRef } from '@angular/core';

import type { CngxTabsConfig } from '../tabs-config';
import type { CngxTabAddIcon } from './tab-add-icon.directive';
import type { CngxTabBusySpinner, CngxTabBusySpinnerContext } from './tab-busy-spinner.directive';
import type { CngxTabCloseIcon, CngxTabCloseIconContext } from './tab-close-icon.directive';
import type { CngxTabErrorBadge, CngxTabErrorBadgeContext } from './tab-error-badge.directive';
import type { CngxTabIcon, CngxTabIconContext } from './tab-icon.directive';
import type {
  CngxTabRejectionIcon,
  CngxTabRejectionIconContext,
} from './tab-rejection-icon.directive';

/**
 * Inputs to {@link createTabGroupTemplateBindings}. \
 * The organism owns the `contentChild()` queries (NG8110 — must run in component
 * injection context) and the resolved {@link CngxTabsConfig}; the
 * factory runs the 3-stage cascade per slot key.
 *
 * Sibling shape to
 * - `createStepperTemplateBindings`.
 *
 * @category common/tabs/slots
 */
export interface CngxTabGroupTemplateBindingsOptions {
  readonly errorBadgeSlot: Signal<CngxTabErrorBadge | undefined>;
  readonly rejectionIconSlot: Signal<CngxTabRejectionIcon | undefined>;
  readonly busySpinnerSlot: Signal<CngxTabBusySpinner | undefined>;
  readonly iconSlot: Signal<CngxTabIcon | undefined>;
  /** Per-instance `*cngxTabCloseIcon` slot. Optional - close is opt-in. */
  readonly closeIconSlot?: Signal<CngxTabCloseIcon | undefined>;
  /** Per-instance `*cngxTabAddIcon` slot. Optional - add is opt-in. */
  readonly addIconSlot?: Signal<CngxTabAddIcon | undefined>;
  readonly config: CngxTabsConfig;
}

/**
 * Output of {@link createTabGroupTemplateBindings}. One resolved
 * `Signal<TemplateRef | null>` per slot; `null` means the organism
 * renders its built-in default.
 *
 * @category common/tabs/slots
 */
export interface CngxTabGroupTemplateBindings {
  readonly errorBadge: Signal<TemplateRef<CngxTabErrorBadgeContext> | null>;
  readonly rejectionIcon: Signal<TemplateRef<CngxTabRejectionIconContext> | null>;
  readonly busySpinner: Signal<TemplateRef<CngxTabBusySpinnerContext> | null>;
  readonly icon: Signal<TemplateRef<CngxTabIconContext> | null>;
  readonly closeIcon: Signal<TemplateRef<CngxTabCloseIconContext> | null>;
  readonly addIcon: Signal<TemplateRef<void> | null>;
}

/**
 * Wires the 3-stage template cascade for the `<cngx-tab-group>` skin
 * slots (errorBadge / rejectionIcon / busySpinner / icon / closeIcon /
 * addIcon):
 *   per-instance directive >
 *   `CNGX_TABS_CONFIG.templates.<key>` >
 *   `null`.
 *
 * `null` means the organism renders its built-in default - a default
 * span for the state decorations, the `CNGX_TABS_GLYPHS` glyph for
 * `closeIcon` / `addIcon`, and nothing for `icon`.
 *
 * Pure — no DI, no side effects. Safe in field-init. Sibling to
 * `createStepperTemplateBindings` and `createTabOverflowTemplateBindings`.
 *
 * Single-consumer today: `[cngxMatTabs]` does not consume this —
 * Material owns the rendered tab-button chrome via its own MDC
 * template, leaving no DOM seam. See `tabs-accepted-debt §9`.
 *
 * **UX / a11y**
 * - The cascade is presentation-only; the accessibility contract is
 *   invariant under it. Overriding a slot never strips its accessible
 *   default (fallthrough to a built-in or the organism default).
 * - The screen-reader channel (descriptor / `aria-busy` / live region)
 *   lives on the organism, not the slot template, so swapping a decoration
 *   template changes only the visual.
 * - An unbound `icon` slot resolves to nothing, which is correct - the
 *   icon is decorative and the label carries the accessible name.
 *
 * @category common/tabs/slots
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/tabs/slots/tab-group-template-cascade.ts
 * @since 0.1.0
 * @relatedTo CngxTabGroup, CngxTabErrorBadge, CngxTabBusySpinner, CngxTabRejectionIcon
 */
export function createTabGroupTemplateBindings(
  opts: CngxTabGroupTemplateBindingsOptions,
): CngxTabGroupTemplateBindings {
  return {
    errorBadge: computed<TemplateRef<CngxTabErrorBadgeContext> | null>(
      () => opts.errorBadgeSlot()?.templateRef ?? opts.config.templates?.errorBadge ?? null,
    ),
    rejectionIcon: computed<TemplateRef<CngxTabRejectionIconContext> | null>(
      () => opts.rejectionIconSlot()?.templateRef ?? opts.config.templates?.rejectionIcon ?? null,
    ),
    busySpinner: computed<TemplateRef<CngxTabBusySpinnerContext> | null>(
      () => opts.busySpinnerSlot()?.templateRef ?? opts.config.templates?.busySpinner ?? null,
    ),
    icon: computed<TemplateRef<CngxTabIconContext> | null>(
      () => opts.iconSlot()?.templateRef ?? opts.config.templates?.icon ?? null,
    ),
    closeIcon: computed<TemplateRef<CngxTabCloseIconContext> | null>(
      () => opts.closeIconSlot?.()?.templateRef ?? opts.config.templates?.closeIcon ?? null,
    ),
    addIcon: computed<TemplateRef<void> | null>(
      () => opts.addIconSlot?.()?.templateRef ?? opts.config.templates?.addIcon ?? null,
    ),
  };
}
