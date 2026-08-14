import { InjectionToken, signal, type Signal } from '@angular/core';

import { matchesKeyCombo, type KeyCombo } from '@cngx/core/utils';

/**
 * Handle returned by a palette keybinding: a pulse signal that increments each
 * time the open combo is pressed, plus a teardown that removes the document
 * listener. The palette tracks `triggered` in a guarded effect to open, and
 * registers `teardown` on its `DestroyRef` so nothing leaks document-wide.
 *
 * @category ui/command-palette
 * @since 0.1.0
 */
export interface CngxPaletteKeybinding {
  /** Increments on every matching key press. Starts at `0` (no open). */
  readonly triggered: Signal<number>;
  /** Removes the installed document keydown listener. */
  teardown(): void;
}

/**
 * Factory producing a {@link CngxPaletteKeybinding} for a combo. Captured as a
 * type alias so an override matches the exact signature.
 *
 * @category ui/command-palette
 * @since 0.1.0
 */
export type CngxPaletteKeybindingFactory = (combo: KeyCombo) => CngxPaletteKeybinding;

/**
 * Default palette keybinding: installs a document keydown listener that pulses
 * `triggered` whenever the combo is pressed (matched via `matchesKeyCombo`).
 * Side-effectful by design - it owns the global listener - so its `teardown`
 * must be called on destroy.
 *
 * `isMac` defaults to platform detection; pass it explicitly for deterministic
 * tests.
 *
 * @category ui/command-palette
 * @since 0.1.0
 */
export function createPaletteKeybinding(
  combo: KeyCombo,
  isMac: boolean = detectMac(),
): CngxPaletteKeybinding {
  const triggered = signal(0);
  const handler = (event: KeyboardEvent): void => {
    if (matchesKeyCombo(event, combo, isMac)) {
      event.preventDefault();
      triggered.update((count) => count + 1);
    }
  };
  document.addEventListener('keydown', handler);
  return {
    triggered: triggered.asReadonly(),
    teardown: () => document.removeEventListener('keydown', handler),
  };
}

/**
 * Swappable open-trigger seam. Defaults to {@link createPaletteKeybinding}.
 * Override it to install an enterprise key-capture policy without touching the
 * palette.
 *
 * @category ui/command-palette
 * @since 0.1.0
 */
export const CNGX_PALETTE_KEYBINDING_FACTORY = new InjectionToken<CngxPaletteKeybindingFactory>(
  'CNGX_PALETTE_KEYBINDING_FACTORY',
  { providedIn: 'root', factory: () => createPaletteKeybinding },
);

/** @internal Best-effort macOS detection; overridable via the `isMac` argument. */
function detectMac(): boolean {
  return typeof navigator !== 'undefined' && /mac/i.test(navigator.platform);
}
