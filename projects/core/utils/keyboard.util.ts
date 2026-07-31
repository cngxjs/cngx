/**
 * Parsed keyboard combo.
 *
 * @category core/utils/keyboard
 */
export interface KeyCombo {
  readonly key: string;
  readonly ctrl: boolean;
  readonly meta: boolean;
  readonly mod: boolean;
  readonly shift: boolean;
  readonly alt: boolean;
}

/**
 * Parses a keyboard shortcut string like `'ctrl+shift+k'` or `'mod+b'` into
 * a structured {@link KeyCombo}.
 *
 * The `mod` modifier resolves to `meta` on macOS and `ctrl` elsewhere.
 * Modifier names are case-insensitive.
 *
 * ```typescript
 * const combo = parseKeyCombo('mod+b');
 * // { key: 'b', ctrl: false, meta: false, mod: true, shift: false, alt: false }
 * ```
 *
 * @category core/utils/keyboard
 */
export function parseKeyCombo(combo: string): KeyCombo {
  const parts = combo
    .toLowerCase()
    .split('+')
    .map((s) => s.trim());
  const key = parts.pop() ?? '';
  return {
    key,
    ctrl: parts.includes('ctrl'),
    meta: parts.includes('meta'),
    mod: parts.includes('mod'),
    shift: parts.includes('shift'),
    alt: parts.includes('alt'),
  };
}

/**
 * Tests whether a `KeyboardEvent` matches a parsed {@link KeyCombo}.
 *
 * A combo matches only a press carrying **exactly** the modifiers it names:
 * a bare `'b'` matches an unmodified `b` and rejects `Cmd+B`, `Ctrl+B`,
 * `Shift+B`, `Alt+B`. `mod` resolves to the platform's primary modifier
 * (`Meta` on macOS, `Ctrl` elsewhere) and does not constrain the other one,
 * so `'mod+b'` matches `Cmd+B` on macOS and `Ctrl+B` elsewhere. A
 * single-character punctuation key is shift-agnostic unless the combo names
 * `shift`, because the produced character already encodes the shift state
 * (`?` requires Shift on most layouts): `'?'` matches the `Shift+/` press
 * that yields `event.key === '?'`, while `'shift+?'` still requires it and
 * ctrl/meta/alt stay strict for every key.
 *
 * @param event The keyboard event to test.
 * @param combo The parsed combo to match against.
 * @param isMac Whether the current platform is macOS (affects `mod` resolution).
 *
 * @category core/utils/keyboard
 */
export function matchesKeyCombo(event: KeyboardEvent, combo: KeyCombo, isMac: boolean): boolean {
  if (event.key.toLowerCase() !== combo.key) {
    return false;
  }
  // Alt is always strict: a combo that does not name it rejects an Alt press.
  if (combo.alt !== event.altKey) {
    return false;
  }
  // `mod` requires the platform primary and leaves the other one free;
  // otherwise ctrl and meta must both match exactly.
  const primaryOk = combo.mod
    ? isMac
      ? event.metaKey
      : event.ctrlKey
    : combo.ctrl === event.ctrlKey && combo.meta === event.metaKey;
  if (!primaryOk) {
    return false;
  }
  // Strict shift for letters, digits and named keys (so bare `b` rejects
  // `Shift+B`); shift-agnostic for a single punctuation char whose glyph
  // already encodes Shift, unless the combo names `shift` explicitly.
  const shiftAgnostic = combo.key.length === 1 && !/[a-z0-9]/.test(combo.key) && !combo.shift;
  if (!shiftAgnostic && combo.shift !== event.shiftKey) {
    return false;
  }
  return true;
}
