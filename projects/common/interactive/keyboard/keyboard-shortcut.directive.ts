import {
  computed,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
  type OnInit,
  output,
} from '@angular/core';
import { nextUid, parseKeyCombo, resolveAriaKeyShortcuts } from '@cngx/core/utils';

import type { CngxHotkeyBinding } from './hotkeys/hotkey-binding';
import { injectHotkeyRegistry } from './hotkeys/hotkey-registry';
import { CNGX_HOTKEY_SCOPE, createHotkeyScope, isHotkeyScopeMuted } from './hotkeys/hotkey-scope';

/**
 * Declarative keyboard shortcut on the app's hotkey registry.
 *
 * Registers the combo in `CNGX_HOTKEY_REGISTRY` (one document listener for
 * every shortcut in the app) and emits `shortcutTriggered` when it fires.
 * `mod` is the platform's primary modifier (`Meta` on macOS, `Ctrl`
 * elsewhere). The host carries `aria-keyshortcuts` for the combo while the
 * shortcut is enabled, so assistive technology announces it.
 *
 * Two scopes: `'global'` (default) fires anywhere in the document unless a
 * modal scope (an open modal dialog) sits between focus and the host;
 * `'self'` fires only while focus is inside the host.
 *
 * Inside a text field (`input` of a text type, `textarea`, `select`,
 * `contenteditable`) only combos with `ctrl`, `meta` or `mod`, function keys
 * and `escape` fire, in both scopes: `'mod+k'` works while typing, a bare
 * `'/'` does not.
 *
 * Name the shortcut with `shortcutId` to make it remappable, and give it a
 * `shortcutDescription` (and optionally a `shortcutGroup`) to list it in the
 * hotkey help.
 *
 * ### Global save shortcut
 * ```html
 * <button [cngxKeyboardShortcut]="'mod+s'" (shortcutTriggered)="save()">
 *   Save
 * </button>
 * ```
 *
 * ### Scoped escape handler
 * ```html
 * <div [cngxKeyboardShortcut]="'escape'" [shortcutScope]="'self'"
 *      (shortcutTriggered)="close()" tabindex="0">
 *   Press Escape to close
 * </div>
 * ```
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/keyboard/keyboard-shortcut.directive.ts
 * @since 0.1.0
 * @relatedTo CngxClickOutside, CngxSearch, CngxHotkeyScope, injectHotkey
 * <example-url>/#/common/interactive/gestures/keyboard-shortcut/global-shortcut</example-url>
 * <example-url>/#/common/interactive/gestures/keyboard-shortcut/self-scoped-shortcut</example-url>
 * @axis level atom
 */
@Directive({
  selector: '[cngxKeyboardShortcut]',
  exportAs: 'cngxKeyboardShortcut',
  standalone: true,
  host: { '[attr.aria-keyshortcuts]': 'ariaKeyShortcuts()' },
})
export class CngxKeyboardShortcut implements OnInit {
  /** Shortcut combo string, e.g. `'mod+s'`, `'ctrl+shift+k'`, `'escape'`. */
  readonly shortcut = input.required<string>({ alias: 'cngxKeyboardShortcut' });
  /** `'global'` fires anywhere outside a modal; `'self'` only while focus is inside the host. */
  readonly scope = input<'global' | 'self'>('global', { alias: 'shortcutScope' });
  /** Whether the shortcut is active. */
  readonly enabled = input<boolean>(true);
  /** Stable binding id for remapping; defaults to a generated `keyboard-shortcut-<n>` id. */
  readonly bindingId = input<string | undefined>(undefined, { alias: 'shortcutId' });
  /** Description listed in the hotkey help; without it the shortcut fires but is not listed. */
  readonly description = input<string | undefined>(undefined, { alias: 'shortcutDescription' });
  /** Group the hotkey help lists the shortcut under. */
  readonly group = input<string | undefined>(undefined, { alias: 'shortcutGroup' });

  /** Emitted when the shortcut fires; the event is already `preventDefault()`ed. */
  readonly shortcutTriggered = output<KeyboardEvent>();

  private readonly registry = injectHotkeyRegistry();
  private readonly destroyRef = inject(DestroyRef);
  private readonly defaultId = nextUid('keyboard-shortcut');
  // The host is the region `'self'` resolves against; `'global'` sits in it
  // too, so a shortcut inside a muted scope stays muted in both modes.
  private readonly hostScope = createHotkeyScope({
    element: inject<ElementRef<Element>>(ElementRef).nativeElement,
    parent: inject(CNGX_HOTKEY_SCOPE, { optional: true }),
    destroyRef: this.destroyRef,
  });

  private readonly bindings = computed<readonly CngxHotkeyBinding[]>(() => {
    const description = this.description();
    const group = this.group();
    return [
      {
        id: this.bindingId() ?? this.defaultId,
        combo: this.shortcut(),
        enabled: this.enabled,
        reach: this.scope() === 'self' ? 'focus' : 'global',
        run: (event: KeyboardEvent) => this.shortcutTriggered.emit(event),
        ...(description === undefined ? {} : { description }),
        ...(group === undefined ? {} : { group }),
      },
    ];
  });

  protected readonly ariaKeyShortcuts = computed(() =>
    this.enabled() && !isHotkeyScopeMuted(this.hostScope)
      ? resolveAriaKeyShortcuts(parseKeyCombo(this.shortcut()), this.registry.isMac)
      : null,
  );

  ngOnInit(): void {
    // Registered once the inputs are bound: the registry reads the source at
    // registration for its dev checks, and a required input throws before.
    const registration = this.registry.register(this.bindings, this.hostScope);
    this.destroyRef.onDestroy(() => registration.unregister());
  }
}
