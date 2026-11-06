import type { Signal } from '@angular/core';

/**
 * Where a hotkey binding can fire from.
 *
 * - `'global'`: anywhere in the document, unless a modal scope sits between
 *   the focused element and the binding's scope.
 * - `'focus'`: only while focus is inside the binding's own scope (WCAG 2.1.4
 *   "active only on focus" for single-key shortcuts).
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/keyboard/hotkeys/hotkey-binding.ts
 * @since 0.1.0
 * @relatedTo CngxHotkeyBinding, injectHotkey
 */
export type CngxHotkeyReach = 'global' | 'focus';

/**
 * One hotkey as a data record, registered through {@link injectHotkey} or
 * {@link injectHotkeys}.
 *
 * `id` is the stable remap identity (`'sidenav.toggle'`, `'hotkeys.help'`),
 * shared by every registration that carries it. `combo`, `description` and
 * `group` accept a Signal so a remap or a language flip reaches the help list
 * without re-registering. A binding without `description` fires but is not
 * listed.
 *
 * ```ts
 * injectHotkey({
 *   id: 'editor.save',
 *   combo: 'mod+s',
 *   description: this.i18n.save,
 *   run: () => this.save(),
 * });
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/keyboard/hotkeys/hotkey-binding.ts
 * @since 0.1.0
 * @relatedTo injectHotkey, injectHotkeys, CngxHotkeyReach
 */
export interface CngxHotkeyBinding {
  /** Stable remap identity; registrations sharing an id remap together. */
  readonly id: string;
  /** Combo string in `parseKeyCombo` syntax, e.g. `'mod+s'`, `'shift+?'`, `'escape'`. */
  readonly combo: string | Signal<string>;
  /** Human-readable description for the help list; omit to keep the binding unlisted. */
  readonly description?: string | Signal<string>;
  /** Group label the help list sorts the binding under. */
  readonly group?: string | Signal<string>;
  /** Runs when the binding fires; the registry has already called `preventDefault()`. */
  readonly run: (event: KeyboardEvent) => void;
  /** Gates the binding; `false` skips it at keypress and drops it from the help list. */
  readonly enabled?: Signal<boolean>;
  /** Where the binding fires from. Defaults to `'global'`. */
  readonly reach?: CngxHotkeyReach;
  /** Fire on auto-repeat keydown events too. Defaults to `false`. */
  readonly allowRepeat?: boolean;
}

/**
 * Handle for one source registration in the hotkey registry.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/keyboard/hotkeys/hotkey-binding.ts
 * @since 0.1.0
 * @relatedTo injectHotkeys, CngxHotkeyRegistry
 */
export interface CngxHotkeyRegistration {
  /** Removes the registration. Idempotent. */
  unregister(): void;
}

/**
 * Handle returned by {@link injectHotkey} for a single binding.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/keyboard/hotkeys/hotkey-binding.ts
 * @since 0.1.0
 * @relatedTo injectHotkey, CngxHotkeyBinding
 */
export interface CngxHotkeyRef extends CngxHotkeyRegistration {
  /** The binding's remap identity. */
  readonly id: string;
  /** The combo the binding currently fires on. */
  readonly effectiveCombo: Signal<string>;
  /** `true` while the binding's scope or one of its ancestors is inactive. */
  readonly muted: Signal<boolean>;
}
