import { InjectionToken } from '@angular/core';

import { matchesKeyCombo, type KeyCombo } from '@cngx/core/utils';

/**
 * Handle returned by a palette keybinding: a teardown that removes the document
 * listener. The palette recreates the keybinding whenever the resolved combo
 * changes and tears the previous one down, so nothing leaks document-wide.
 *
 * @category ui/command-palette
 * @since 0.1.0
 */
export interface CngxPaletteKeybinding {
  /** Removes the installed document keydown listener. */
  teardown(): void;
}

/**
 * Factory producing a {@link CngxPaletteKeybinding} for a combo. It installs a
 * global listener that invokes `onOpen` whenever the combo is pressed. Captured
 * as a type alias so an override matches the exact signature - a consumer can
 * swap in an enterprise key-capture policy without touching the palette.
 *
 * @category ui/command-palette
 * @since 0.1.0
 */
export type CngxPaletteKeybindingFactory = (
  combo: KeyCombo,
  onOpen: () => void,
) => CngxPaletteKeybinding;

/**
 * Default palette keybinding: installs a document keydown listener that calls
 * `onOpen` whenever the combo is pressed (matched via `matchesKeyCombo`).
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
  onOpen: () => void,
  isMac: boolean = detectMac(),
): CngxPaletteKeybinding {
  const handler = (event: KeyboardEvent): void => {
    if (matchesKeyCombo(event, combo, isMac)) {
      event.preventDefault();
      onOpen();
    }
  };
  document.addEventListener('keydown', handler);
  return { teardown: () => document.removeEventListener('keydown', handler) };
}

/**
 * Swappable open-trigger seam. Defaults to {@link createPaletteKeybinding}.
 * Override it to install an enterprise key-capture policy without touching the
 * palette. To only change the *combo*, prefer `withPaletteShortcut(...)` or the
 * `[openShortcut]` input - this token is for replacing the whole listener.
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
