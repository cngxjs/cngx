import { type KeyCombo, parseKeyCombo, resolveAriaKeyShortcuts } from '@cngx/core/utils';

/**
 * @internal Combos the browser handles before the page sees them (close,
 * reopen and new tab or window, quit, tab switching). A page binding on one
 * of them never fires reliably, so the registry warns and the recorder
 * rejects them.
 */
export const CNGX_RESERVED_HOTKEYS: readonly string[] = [
  'mod+w',
  'mod+shift+w',
  'mod+t',
  'mod+shift+t',
  'mod+n',
  'mod+shift+n',
  'mod+q',
  'ctrl+tab',
  'ctrl+shift+tab',
  'ctrl+pagedown',
  'ctrl+pageup',
  'alt+f4',
];

const reservedByPlatform = new Map<boolean, ReadonlySet<string>>();

function reservedFor(isMac: boolean): ReadonlySet<string> {
  let set = reservedByPlatform.get(isMac);
  if (set === undefined) {
    set = new Set(
      CNGX_RESERVED_HOTKEYS.map((c) => resolveAriaKeyShortcuts(parseKeyCombo(c), isMac)),
    );
    reservedByPlatform.set(isMac, set);
  }
  return set;
}

/**
 * @internal `true` when the combo resolves to a browser-reserved combo on
 * this platform (`'meta+w'` is reserved on macOS, `'ctrl+w'` elsewhere).
 */
export function isReservedHotkey(combo: KeyCombo, isMac: boolean): boolean {
  return reservedFor(isMac).has(resolveAriaKeyShortcuts(combo, isMac));
}

/**
 * @internal `true` for `ctrl+alt+*` and `mod+alt+*`: Windows and Linux report
 * AltGr as Ctrl+Alt, so on layouts that type characters through AltGr the
 * matcher rejects the press as character input and the binding never fires.
 */
export function isAltGrRiskHotkey(combo: KeyCombo): boolean {
  return (combo.ctrl || combo.mod) && combo.alt;
}
