/** Parsed keyboard combo. */
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
 * @example
 * ```typescript
 * const combo = parseKeyCombo('mod+b');
 * // { key: 'b', ctrl: false, meta: false, mod: true, shift: false, alt: false }
 * ```
 */
export function parseKeyCombo(combo: string): KeyCombo {
  const parts = combo.toLowerCase().split('+').map((s) => s.trim());
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
 * @param event The keyboard event to test.
 * @param combo The parsed combo to match against.
 * @param isMac Whether the current platform is macOS (affects `mod` resolution).
 */
export function matchesKeyCombo(event: KeyboardEvent, combo: KeyCombo, isMac: boolean): boolean {
  if (event.key.toLowerCase() !== combo.key) {
    return false;
  }
  if (combo.shift && !event.shiftKey) {
    return false;
  }
  if (combo.alt && !event.altKey) {
    return false;
  }
  if (combo.mod) {
    if (isMac ? !event.metaKey : !event.ctrlKey) {
      return false;
    }
  } else {
    if (combo.ctrl && !event.ctrlKey) {
      return false;
    }
    if (combo.meta && !event.metaKey) {
      return false;
    }
  }
  return true;
}
