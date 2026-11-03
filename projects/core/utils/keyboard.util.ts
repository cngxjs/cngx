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
  const key = last === '' && combo.trimEnd().endsWith('+') ? '+' : last;
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
 * @param event The keyboard event to test.
 * @param combo The parsed combo to match against.
 * @param isMac Whether the current platform is macOS (affects `mod` resolution).
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
