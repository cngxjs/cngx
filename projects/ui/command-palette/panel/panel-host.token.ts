import { InjectionToken, type Signal } from '@angular/core';

/**
 * Contract the palette surface exposes to its panel body. One token, single
 * surface today; the container-swap second token is the documented eject seam
 * if a second surface ever lands (tracked debt), not built for one consumer.
 *
 * Focus restore is intentionally NOT on this contract - the palette renders a
 * native modal `<dialog cngxDialog>`, so `showModal()` traps focus and
 * `CngxDialog` stores the trigger at open and returns focus after the close
 * transition settles. The panel only needs to know it is open and to ask the
 * surface to dismiss when a command runs.
 *
 * @category ui/command-palette
 * @since 0.1.0
 */
export interface CngxCommandPaletteHost {
  /**
   * Whether the palette surface is currently open. Two documented consumers:
   * the panel resets its term and highlight when this flips to `false` (state
   * must not leak into the next open), and a composing consumer derives open
   * state from it instead of tracking its own flag -
   * `CngxCommandPaletteTrigger` binds its `aria-expanded` to the palette's
   * implementation of this member.
   */
  readonly isOpen: Signal<boolean>;
  /** Dismiss the surface (e.g. after a command runs). */
  dismiss(): void;
}

/**
 * DI token the panel injects (optional) to reach its hosting palette surface.
 *
 * @category ui/command-palette
 * @since 0.1.0
 */
export const CNGX_COMMAND_PALETTE_HOST = new InjectionToken<CngxCommandPaletteHost>(
  'CNGX_COMMAND_PALETTE_HOST',
);
