import { computed, type DestroyRef, InjectionToken, signal, type Signal } from '@angular/core';

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
  /** `true` while this scope or an ancestor scope is inactive. */
  readonly muted: Signal<boolean>;
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
  /**
   * The owner's lifetime. Pass it whenever the element can outlive the owner
   * (a reused overlay container): on destroy the scope leaves keypress
   * resolution, so a dead modal scope never blocks bindings again.
   */
  readonly destroyRef?: DestroyRef;
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
// Keyed weakly by element; an owner's `destroyRef` removes its scope early.
const SCOPES_BY_ELEMENT = new WeakMap<Element, CngxHotkeyScopeNode[]>();
// The index is not a signal; reading this makes a scope created or released
// later invalidate a computed that walked the chain (the help listing).
const scopesVersion = signal(0);

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
  const { parent } = options;
  const active = options.active ?? ALWAYS;
  const node: CngxHotkeyScopeNode = {
    element: options.element,
    modal: options.modal ?? NEVER,
    active,
    muted: computed(() => !active() || (parent?.muted() ?? false)),
    parent,
  };
  // Raw index reads: a scope created during a view's render must not track the version it bumps.
  SCOPES_BY_ELEMENT.set(node.element, [...(SCOPES_BY_ELEMENT.get(node.element) ?? []), node]);
  scopesVersion.update((v) => v + 1);
  options.destroyRef?.onDestroy(() => {
    const rest = (SCOPES_BY_ELEMENT.get(node.element) ?? []).filter((s) => s !== node);
    SCOPES_BY_ELEMENT.set(node.element, rest);
    scopesVersion.update((v) => v + 1);
  });
  return node;
}

/** Live scopes of an element, in creation order; reactive to scope churn. */
function hotkeyScopesOf(element: Element): readonly CngxHotkeyScopeNode[] {
  scopesVersion();
  return SCOPES_BY_ELEMENT.get(element) ?? [];
}

function depthOf(scope: CngxHotkeyScopeNode): number {
  let depth = 0;
  for (let s = scope.parent; s !== null; s = s.parent) {
    depth++;
  }
  return depth;
}

// Creation order says nothing on one element: a child that injects
// `CNGX_HOTKEY_SCOPE` creates its parent scope first.
function scopesInnermostFirst(element: Element): readonly CngxHotkeyScopeNode[] {
  const scopes = hotkeyScopesOf(element);
  return scopes.length < 2 ? scopes : [...scopes].sort((a, b) => depthOf(b) - depthOf(a));
}

function parentOf(node: Node): Node | null {
  return node.parentNode instanceof ShadowRoot ? node.parentNode.host : node.parentNode;
}

/**
 * The hotkey scopes containing an element, innermost first, cut after the
 * first modal one: the chain a key press on `target` resolves against. Walks
 * out of shadow roots through their hosts. Reactive when read inside a
 * `computed()` (scope flags and scopes created or released on the path).
 * A replacement registry behind `CNGX_HOTKEY_REGISTRY` reads it to apply the
 * same modal cut as the default one.
 *
 * @param target The element a key press or a listing starts from.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/keyboard/hotkeys/hotkey-scope.ts
 * @since 0.1.0
 * @relatedTo createHotkeyScope, createHotkeyRegistry
 */
export function resolveHotkeyScopeChain(target: Element): readonly CngxHotkeyScopeNode[] {
  const chain: CngxHotkeyScopeNode[] = [];
  for (let node: Node | null = target; node !== null; node = parentOf(node)) {
    if (!(node instanceof Element)) {
      continue;
    }
    for (const scope of scopesInnermostFirst(node)) {
      chain.push(scope);
      if (scope.modal()) {
        return chain;
      }
    }
  }
  return chain;
}
