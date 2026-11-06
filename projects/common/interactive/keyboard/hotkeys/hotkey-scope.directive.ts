import { booleanAttribute, DestroyRef, Directive, ElementRef, inject, input } from '@angular/core';

import { CNGX_HOTKEY_SCOPE, createHotkeyScope, type CngxHotkeyScopeNode } from './hotkey-scope';

/**
 * Marks an element as a hotkey scope for its subtree.
 *
 * Bindings registered below it with `reach: 'focus'` fire only while focus
 * is inside the element; a modal scope blocks every `'global'` binding
 * outside it while focus is inside; an inactive scope mutes the bindings
 * registered below it (they never fire and are not listed) without
 * unregistering them.
 *
 * ```html
 * <ul cngxHotkeyScope aria-label="Results">
 *   <!-- n / p fire only while focus is in the list -->
 * </ul>
 *
 * <section cngxHotkeyScope [cngxHotkeyScopeActive]="opened()">...</section>
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/keyboard/hotkeys/hotkey-scope.directive.ts
 * @since 0.1.0
 * @relatedTo CNGX_HOTKEY_SCOPE, createHotkeyScope, injectHotkey, CngxKeyboardShortcut
 * @axis level atom
 */
@Directive({
  selector: '[cngxHotkeyScope]',
  exportAs: 'cngxHotkeyScope',
  providers: [{ provide: CNGX_HOTKEY_SCOPE, useFactory: () => inject(CngxHotkeyScope).node }],
})
export class CngxHotkeyScope {
  /** Blocks global bindings outside the scope while focus is inside it. */
  readonly modal = input<boolean, unknown>(false, {
    alias: 'cngxHotkeyScopeModal',
    transform: booleanAttribute,
  });
  /** `false` mutes every binding registered in the scope and its descendants. */
  readonly active = input<boolean, unknown>(true, {
    alias: 'cngxHotkeyScopeActive',
    transform: booleanAttribute,
  });

  /** @internal DI hand-off for the subtree provider. */
  readonly node: CngxHotkeyScopeNode = createHotkeyScope({
    element: inject<ElementRef<Element>>(ElementRef).nativeElement,
    modal: this.modal,
    active: this.active,
    parent: inject(CNGX_HOTKEY_SCOPE, { optional: true, skipSelf: true }),
    destroyRef: inject(DestroyRef),
  });
}
