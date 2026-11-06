import { type KeyCombo, parseKeyCombo } from '@cngx/core/utils';

const MODIFIERS = new Set(['ctrl', 'meta', 'mod', 'shift', 'alt']);

/**
 * @internal `parseKeyCombo` reads anything; the registry only accepts well-formed
 * combos, so a typo like `'hyper+k'` never fires on a bare `k`.
 */
export function parseHotkeyCombo(combo: string): KeyCombo | null {
  const segments = combo
    .toLowerCase()
    .split('+')
    .map((s) => s.trim());
  // 'mod++' -> ['mod', '', '']: the last two empty segments are the plus key.
  const plusKey = segments.length >= 2 && segments.at(-1) === '' && segments.at(-2) === '';
  const modifiers = plusKey ? segments.slice(0, -2) : segments.slice(0, -1);
  const key = plusKey ? '+' : (segments.at(-1) ?? '');
  if (key === '' || MODIFIERS.has(key) || modifiers.some((m) => !MODIFIERS.has(m))) {
    return null;
  }
  return parseKeyCombo(combo);
}
