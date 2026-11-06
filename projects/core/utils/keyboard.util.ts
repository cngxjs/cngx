import { inject, InjectionToken, type Provider } from '@angular/core';

/**
 * Parsed keyboard combo.
 *
 * @since 0.1.0
 */
export interface KeyCombo {
  readonly key: string;
  readonly ctrl: boolean;
  readonly meta: boolean;
  readonly mod: boolean;
  readonly shift: boolean;
  readonly alt: boolean;
}

const KEY_ALIASES: Readonly<Record<string, string>> = { esc: 'escape' };

/**
 * Parses a keyboard shortcut string like `'ctrl+shift+k'` or `'mod+b'` into
 * a structured {@link KeyCombo}.
 *
 * The `mod` modifier resolves to `meta` on macOS and `ctrl` elsewhere.
 * Modifier names are case-insensitive.
 *
 * A trailing `+` names the literal plus key: `'mod++'` parses as
 * `mod` + `'+'` (the split's trailing empty segment is the key, not a
 * dangling separator).
 *
 * The space bar is spelled `'space'` (a combo segment is trimmed, so `' '`
 * cannot name it) and `'esc'` is an alias that parses to `'escape'`, the
 * UI Events key value, so the matcher and {@link resolveAriaKeyShortcuts}
 * read one vocabulary.
 *
 * ```typescript
 * const combo = parseKeyCombo('mod+b');
 * // { key: 'b', ctrl: false, meta: false, mod: true, shift: false, alt: false }
 * ```
 *
 * @since 0.1.0
 */
export function parseKeyCombo(combo: string): KeyCombo {
  const parts = combo
    .toLowerCase()
    .split('+')
    .map((s) => s.trim());
  // 'mod++' splits into ['mod', '', ''] - a trailing empty segment means the
  // combo ends in '+', so the key IS the literal plus character.
  const last = parts.pop() ?? '';
  const literal = last === '' && combo.trimEnd().endsWith('+') ? '+' : last;
  const key = KEY_ALIASES[literal] ?? literal;
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
 * Events fired during IME composition (`event.isComposing`) never match -
 * keystrokes that build a composed character are text input, not shortcuts.
 *
 * Two layout pitfalls are handled here so no consumer has to:
 *
 * - **Option and Shift transform the key.** Option+B on macOS reports
 *   `event.key === '∫'`, Shift+1 reports `'!'`. For a letter or digit combo
 *   key pressed with Alt or Shift, a failed `event.key` compare retries
 *   against the physical `event.code` (`KeyB`, `Digit1`), but only when
 *   `event.key` is not itself a Latin letter or digit. A layout that still
 *   produces a letter is compared by `event.key` alone, so QWERTZ Shift+Y
 *   (`key 'Y'`, `code 'KeyZ'`) matches `'shift+y'` and never `'shift+z'`.
 *   Limit: when the layout turns the key into a non-Latin character (Option
 *   on a non-QWERTY Mac, a Cyrillic layout), the fallback reads the physical
 *   US position, so `'alt+z'` matches the key that sits where US Z sits.
 *   Remapping the binding is the mitigation.
 * - **AltGr is character input, not a chord.** Windows and Linux report
 *   AltGr as `ctrlKey + altKey`, so AltGr+E (`€`) would otherwise match
 *   `'ctrl+alt+e'`. Off macOS, a combo naming `ctrl`, `alt` or `mod` never
 *   matches while `event.getModifierState('AltGraph')` is set. macOS has no
 *   AltGr key (Option is `alt`), so the guard is off there.
 *
 * @param event The keyboard event to test.
 * @param combo The parsed combo to match against.
 * @param isMac Whether the current platform is macOS (affects `mod` resolution
 *   and the AltGr guard). Resolve it once with {@link resolveMacPlatform}.
 *
 * @since 0.1.0
 */
export function matchesKeyCombo(event: KeyboardEvent, combo: KeyCombo, isMac: boolean): boolean {
  // Never match during IME composition: the event's key is an artifact of the
  // composition session (often 'Process'), not a shortcut press. One guard
  // here covers every shortcut consumer.
  if (event.isComposing) {
    return false;
  }
  const namesAltGrModifier = combo.ctrl || combo.alt || combo.mod;
  if (!isMac && namesAltGrModifier && event.getModifierState?.('AltGraph')) {
    return false;
  }
  if (!matchesComboKey(event, combo.key)) {
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

/**
 * One part of a resolved key combo: a modifier name, or the combo's single
 * non-modifier key (lower-case, as {@link parseKeyCombo} stores it).
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/core/utils/keyboard.util.ts
 * @since 0.1.0
 * @relatedTo resolveKeyComboParts, KeyCombo
 */
export type KeyComboPart = 'ctrl' | 'meta' | 'alt' | 'shift' | { readonly key: string };

type KeyComboModifier = Exclude<KeyComboPart, { readonly key: string }>;

const CANONICAL_MODIFIER_ORDER: readonly KeyComboModifier[] = ['ctrl', 'alt', 'shift', 'meta'];

function resolvedModifiers(combo: KeyCombo, isMac: boolean): readonly KeyComboModifier[] {
  const held: Record<KeyComboModifier, boolean> = {
    ctrl: combo.ctrl || (combo.mod && !isMac),
    alt: combo.alt,
    shift: combo.shift,
    meta: combo.meta || (combo.mod && isMac),
  };
  return CANONICAL_MODIFIER_ORDER.filter((m) => held[m]);
}

/**
 * Resolves a parsed {@link KeyCombo} into its display parts: the held
 * modifiers in canonical order (`ctrl alt shift meta` on every platform, the
 * Apple HIG order of the macOS glyphs), then the key. `mod` resolves to
 * `meta` on macOS and `ctrl` elsewhere; a combo naming both `mod` and the
 * modifier it resolves to lists that modifier once.
 *
 * Pure derivation for a renderer: localized labels, glyphs and spoken text
 * are the renderer's job, the parts only fix what is held and in which order.
 *
 * ```ts
 * resolveKeyComboParts(parseKeyCombo('mod+shift+k'), true);
 * // ['shift', 'meta', { key: 'k' }]
 * ```
 *
 * @param combo The parsed combo.
 * @param isMac Whether the current platform is macOS (resolves `mod`).
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/core/utils/keyboard.util.ts
 * @since 0.1.0
 * @relatedTo parseKeyCombo, resolveAriaKeyShortcuts, KeyComboPart
 */
export function resolveKeyComboParts(combo: KeyCombo, isMac: boolean): readonly KeyComboPart[] {
  return [...resolvedModifiers(combo, isMac), { key: combo.key }];
}

const ARIA_MODIFIER_TOKENS: Readonly<Record<KeyComboModifier, string>> = {
  ctrl: 'Control',
  alt: 'Alt',
  shift: 'Shift',
  meta: 'Meta',
};

// UI Events `key` values for the named keys a lower-cased combo can carry.
const ARIA_NAMED_KEYS: Readonly<Record<string, string>> = {
  '+': 'Plus',
  space: 'Space',
  enter: 'Enter',
  escape: 'Escape',
  tab: 'Tab',
  backspace: 'Backspace',
  delete: 'Delete',
  insert: 'Insert',
  home: 'Home',
  end: 'End',
  pageup: 'PageUp',
  pagedown: 'PageDown',
  arrowup: 'ArrowUp',
  arrowdown: 'ArrowDown',
  arrowleft: 'ArrowLeft',
  arrowright: 'ArrowRight',
  contextmenu: 'ContextMenu',
  capslock: 'CapsLock',
  numlock: 'NumLock',
  scrolllock: 'ScrollLock',
  printscreen: 'PrintScreen',
  pause: 'Pause',
};

function ariaKeyToken(key: string): string {
  const named = ARIA_NAMED_KEYS[key];
  if (named !== undefined) {
    return named;
  }
  if (/^f\d{1,2}$/.test(key)) {
    return key.toUpperCase();
  }
  if (key.length === 1) {
    // 'ß'.toUpperCase() is 'SS': two characters would name a different key.
    const upper = key.toUpperCase();
    return upper.length === 1 ? upper : key;
  }
  // A name outside the table: the UI Events value of a one-word key.
  return key.charAt(0).toUpperCase() + key.slice(1);
}

/**
 * Serialises a parsed {@link KeyCombo} into an `aria-keyshortcuts` value
 * (WAI-ARIA 1.2): the modifiers `Control`, `Alt`, `Shift`, `Meta` in
 * canonical order, then exactly one non-modifier key. Letters are upper-case,
 * the literal `+` key is `Plus`, space is `Space`, and named keys use their
 * UI Events key value (`Escape`, `ArrowUp`, `PageDown`). `mod` resolves per
 * platform. The tokens are spec tokens, not user-facing copy: never
 * translate them.
 *
 * ```ts
 * resolveAriaKeyShortcuts(parseKeyCombo('mod+k'), false); // 'Control+K'
 * resolveAriaKeyShortcuts(parseKeyCombo('mod++'), true);  // 'Meta+Plus'
 * ```
 *
 * @param combo The parsed combo.
 * @param isMac Whether the current platform is macOS (resolves `mod`).
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/core/utils/keyboard.util.ts
 * @since 0.1.0
 * @relatedTo parseKeyCombo, resolveKeyComboParts
 */
export function resolveAriaKeyShortcuts(combo: KeyCombo, isMac: boolean): string {
  const modifiers = resolvedModifiers(combo, isMac).map((m) => ARIA_MODIFIER_TOKENS[m]);
  return [...modifiers, ariaKeyToken(combo.key)].join('+');
}

// `userAgentData` (UA Client Hints) is not in lib.dom yet.
interface NavigatorWithUaData {
  readonly platform?: string;
  readonly userAgentData?: { readonly platform?: string };
}

/**
 * Detects macOS from a `Navigator`, the one platform rule every shortcut
 * consumer shares: `mod` resolves to Cmd there, the AltGr guard of
 * {@link matchesKeyCombo} is off, and key labels switch to the macOS glyphs.
 * Reads `navigator.userAgentData.platform` where the browser ships UA
 * Client Hints and falls back to `navigator.platform`. Returns `false` for
 * `undefined`, so a server render resolves to the non-mac labels.
 *
 * ```ts
 * const isMac = resolveMacPlatform(injectWindow()?.navigator);
 * ```
 *
 * @param nav The navigator to read, `undefined` on the server.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/core/utils/keyboard.util.ts
 * @since 0.1.0
 * @relatedTo matchesKeyCombo, resolveKeyComboParts
 */
export function resolveMacPlatform(nav: Navigator | undefined): boolean {
  if (nav === undefined) {
    return false;
  }
  const source = nav as NavigatorWithUaData;
  return /mac/i.test(source.userAgentData?.platform ?? source.platform ?? '');
}

const LATIN_LETTER_OR_DIGIT = /^[a-z0-9]$/;

function matchesComboKey(event: KeyboardEvent, comboKey: string): boolean {
  // The space bar reports `' '`; combos spell it `'space'`.
  const key = event.key === ' ' ? 'space' : event.key.toLowerCase();
  if (key === comboKey) {
    return true;
  }
  const transformable = LATIN_LETTER_OR_DIGIT.test(comboKey) && (event.altKey || event.shiftKey);
  // A key that is still a Latin letter or digit was not transformed by the
  // modifier, only remapped by the layout: trusting `code` there would match
  // the wrong letter (QWERTZ Y sits on US Z).
  if (!transformable || LATIN_LETTER_OR_DIGIT.test(key)) {
    return false;
  }
  const physical = /[0-9]/.test(comboKey) ? `Digit${comboKey}` : `Key${comboKey.toUpperCase()}`;
  return event.code === physical;
}

const NESTED_INTERACTIVE_DEFAULTS = [
  'button',
  'a[href]',
  'input',
  'select',
  'textarea',
  'summary',
  '[contenteditable]:not([contenteditable="false"])',
  '[role="button"]',
  '[role="checkbox"]',
  '[role="switch"]',
  '[role="radio"]',
  '[role="tab"]',
  '[role="slider"]',
  '[role="menuitem"]',
  '[role="menuitemcheckbox"]',
  '[role="menuitemradio"]',
].join(', ');

/**
 * Selector for the descendants that own Enter and Space themselves. A
 * keyboard host that forwards Enter / Space (`CngxActiveDescendant`,
 * `CngxListboxTrigger`, the select-family triggers) checks
 * `event.target.closest(selector)` and leaves a match inside itself alone: no
 * `preventDefault`, no activation of its own. The host's own items (an
 * active-descendant option or menu item that took focus) are never such a
 * match.
 *
 * Default: native buttons, links, form controls, `<summary>` and editable
 * regions (`contenteditable`), plus the ARIA widget roles whose activation key
 * is their own (button, checkbox, switch, radio, tab, slider and the three
 * menu item roles). Extend it with {@link provideNestedInteractiveSelector}
 * when slot content carries another custom widget.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/core/utils/keyboard.util.ts
 * @since 0.1.0
 * @relatedTo provideNestedInteractiveSelector, CngxActiveDescendant, CngxListboxTrigger
 */
export const CNGX_NESTED_INTERACTIVE_SELECTOR = new InjectionToken<string>(
  'CNGX_NESTED_INTERACTIVE_SELECTOR',
  { providedIn: 'root', factory: () => NESTED_INTERACTIVE_DEFAULTS },
);

/**
 * Adds `selectors` to the {@link CNGX_NESTED_INTERACTIVE_SELECTOR} of the
 * surrounding injector, so a keyboard host leaves Enter / Space inside a
 * matching descendant to it. Works app-wide (`bootstrapApplication`
 * providers) and per subtree (`providers` / `viewProviders`); a call in a
 * child injector extends the list of its parent. Two calls in the same
 * `providers` array do not add up: the last one wins, so pass every selector
 * of one level to a single call.
 *
 * ```ts
 * bootstrapApplication(App, {
 *   providers: [provideNestedInteractiveSelector('[role="spinbutton"]', 'app-rating')],
 * });
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/core/utils/keyboard.util.ts
 * @since 0.1.0
 * @relatedTo CNGX_NESTED_INTERACTIVE_SELECTOR
 */
export function provideNestedInteractiveSelector(...selectors: string[]): Provider[] {
  return [
    {
      provide: CNGX_NESTED_INTERACTIVE_SELECTOR,
      useFactory: (): string => {
        // At the root injector the parent is the platform, which has no list.
        const parent =
          inject(CNGX_NESTED_INTERACTIVE_SELECTOR, { skipSelf: true, optional: true }) ??
          NESTED_INTERACTIVE_DEFAULTS;
        return [parent, ...selectors].join(', ');
      },
    },
  ];
}
