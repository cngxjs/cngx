import { InjectionToken, signal, type Signal } from '@angular/core';

/**
 * One node of the hotkey scope tree: an element region with a modal and an
 * active flag, linked to its enclosing scope.
 *
 * A modal scope (an open modal dialog, an engaged drawer overlay) blocks
 * every `'global'` binding outside it while focus is inside it. An inactive
 * scope (a closed dialog whose children stay in the DOM) mutes every binding
 * registered in it or in a descendant scope: they never fire and are not
 * listed. The app scope is implicit (`document.documentElement`) and has no
 * node.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/keyboard/hotkeys/hotkey-scope.ts
 * @since 0.1.0
 * @relatedTo createHotkeyScope, CNGX_HOTKEY_SCOPE, CngxHotkeyScope
 */
export interface CngxHotkeyScopeNode {
  /** The region the scope covers. */
  readonly element: Element;
  /** `true` while the scope blocks global bindings outside it. */
  readonly modal: Signal<boolean>;
  /** `false` mutes every binding in the scope and its descendants. */
  readonly active: Signal<boolean>;
  /** The enclosing scope, `null` under the app scope. */
  readonly parent: CngxHotkeyScopeNode | null;
}

/**
 * Options for {@link createHotkeyScope}.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/keyboard/hotkeys/hotkey-scope.ts
 * @since 0.1.0
 * @relatedTo createHotkeyScope
 */
export interface CngxHotkeyScopeOptions {
  /** The region the scope covers. */
  readonly element: Element;
  /** Modal flag; defaults to never modal. */
  readonly modal?: Signal<boolean>;
  /** Active flag; defaults to always active. */
  readonly active?: Signal<boolean>;
  /** The enclosing scope, usually `inject(CNGX_HOTKEY_SCOPE, { optional: true, skipSelf: true })`. */
  readonly parent: CngxHotkeyScopeNode | null;
}

/**
 * The hotkey scope of the current injector subtree. No default: an absent
 * scope is the app scope. Provided by `[cngxHotkeyScope]` and by molecules
 * that own a region (`CngxDialog`, `CngxDrawerSurface`).
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/keyboard/hotkeys/hotkey-scope.ts
 * @since 0.1.0
 * @relatedTo createHotkeyScope, CngxHotkeyScope, injectHotkey
 */
export const CNGX_HOTKEY_SCOPE = new InjectionToken<CngxHotkeyScopeNode>('CNGX_HOTKEY_SCOPE');

const NEVER = signal(false).asReadonly();
const ALWAYS = signal(true).asReadonly();

// Keypress resolution starts at a DOM target, so the registry needs the
// scopes on the target's ancestor path, including scopes that hold no
// registration (an open modal dialog without hotkeys still blocks the app's).
// Keyed weakly by element: a scope lives exactly as long as its region.
const SCOPES_BY_ELEMENT = new WeakMap<Element, CngxHotkeyScopeNode[]>();

/**
 * Creates a hotkey scope node for a region and makes it visible to keypress
 * resolution. DI-agnostic; the caller provides it as `CNGX_HOTKEY_SCOPE` for
 * the region's subtree.
 *
 * ```ts
 * readonly hotkeyScope = createHotkeyScope({
 *   element: inject(ElementRef).nativeElement,
 *   modal: this.isModal,
 *   parent: inject(CNGX_HOTKEY_SCOPE, { optional: true, skipSelf: true }),
 * });
 * ```
 *
 * @param options The region, its flags and its parent.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/keyboard/hotkeys/hotkey-scope.ts
 * @since 0.1.0
 * @relatedTo CNGX_HOTKEY_SCOPE, CngxHotkeyScope
 */
export function createHotkeyScope(options: CngxHotkeyScopeOptions): CngxHotkeyScopeNode {
  const node: CngxHotkeyScopeNode = {
    element: options.element,
    modal: options.modal ?? NEVER,
    active: options.active ?? ALWAYS,
    parent: options.parent,
  };
  const existing = SCOPES_BY_ELEMENT.get(node.element);
  if (existing) {
    existing.push(node);
  } else {
    SCOPES_BY_ELEMENT.set(node.element, [node]);
  }
  return node;
}

/** @internal Scopes created for an element, in creation order. */
export function hotkeyScopesOf(element: Element): readonly CngxHotkeyScopeNode[] {
  return SCOPES_BY_ELEMENT.get(element) ?? [];
}

/** @internal `true` when the scope or an ancestor scope is inactive. */
export function isHotkeyScopeMuted(scope: CngxHotkeyScopeNode | null): boolean {
  for (let s = scope; s !== null; s = s.parent) {
    if (!s.active()) {
      return true;
    }
  }
  return false;
}
