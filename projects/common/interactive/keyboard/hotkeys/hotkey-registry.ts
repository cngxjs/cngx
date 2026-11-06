import { DOCUMENT } from '@angular/common';
import {
  computed,
  DestroyRef,
  inject,
  InjectionToken,
  isSignal,
  signal,
  type Signal,
  untracked,
} from '@angular/core';
import { cngxDevWarn } from '@cngx/utils';
import { injectWindow } from '@cngx/core/tokens';
import {
  createKeyedRegistry,
  type KeyCombo,
  matchesKeyCombo,
  nextUid,
  resolveMacPlatform,
} from '@cngx/core/utils';

import type { CngxHotkeyBinding, CngxHotkeyRef, CngxHotkeyRegistration } from './hotkey-binding';
import { parseHotkeyCombo } from './hotkey-combo';
import {
  CNGX_HOTKEY_SCOPE,
  resolveHotkeyScopeChain,
  type CngxHotkeyScopeNode,
} from './hotkey-scope';
import { isAltGrRiskHotkey, isReservedHotkey } from './reserved-combos';

/**
 * One listed binding: what the help list renders for a live binding.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/keyboard/hotkeys/hotkey-registry.ts
 * @since 0.1.0
 * @relatedTo CngxHotkeyRegistry, CngxHotkeyGroup
 */
export interface CngxHotkeyListing {
  /** The binding's remap identity. */
  readonly id: string;
  /** The combo the binding fires on. */
  readonly combo: string;
  /** The binding's description. */
  readonly description: string;
  /** The binding's group, `null` when it has none. */
  readonly group: string | null;
}

/**
 * Listed bindings sharing one group, in registration order.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/keyboard/hotkeys/hotkey-registry.ts
 * @since 0.1.0
 * @relatedTo CngxHotkeyRegistry, CngxHotkeyListing
 */
export interface CngxHotkeyGroup {
  /** The group label, `null` for bindings without a group. */
  readonly group: string | null;
  /** The group's bindings. */
  readonly bindings: readonly CngxHotkeyListing[];
}

/**
 * The document keymap: one `keydown` listener, a set of binding sources and
 * the per-keypress resolution over the hotkey scope tree.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/keyboard/hotkeys/hotkey-registry.ts
 * @since 0.1.0
 * @relatedTo createHotkeyRegistry, CNGX_HOTKEY_REGISTRY, injectHotkey, injectHotkeys
 */
export interface CngxHotkeyRegistry {
  /** Whether the registry resolves `mod` and key labels for macOS. */
  readonly isMac: boolean;
  /**
   * Registers a binding source in a scope (`null` = app scope). The source is
   * read per keypress, so a changing list needs no re-registration.
   */
  register(
    source: Signal<readonly CngxHotkeyBinding[]>,
    scope: CngxHotkeyScopeNode | null,
  ): CngxHotkeyRegistration;
  /**
   * The bindings live for a focus context (`null` = the document), grouped
   * and deduped by id. Reactive when read inside a `computed()`; returns the
   * previous array reference while the listing is structurally unchanged.
   */
  liveGroupsFor(context: Element | null): readonly CngxHotkeyGroup[];
  /** Removes the listener and drops every registration. Idempotent. */
  destroy(): void;
}

/**
 * Inputs of {@link createHotkeyRegistry}.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/keyboard/hotkeys/hotkey-registry.ts
 * @since 0.1.0
 * @relatedTo createHotkeyRegistry, injectHotkeyRegistryDeps
 */
export interface CngxHotkeyRegistryDeps {
  /** The document the listener attaches to. */
  readonly doc: Document;
  /** Whether the platform is macOS (`resolveMacPlatform`). */
  readonly isMac: boolean;
}

/**
 * Factory shape for a replacement registry behind {@link CNGX_HOTKEY_REGISTRY}.
 *
 * ```ts
 * {
 *   provide: CNGX_HOTKEY_REGISTRY,
 *   useFactory: () => {
 *     const registry = myRegistry(injectHotkeyRegistryDeps());
 *     inject(DestroyRef).onDestroy(() => registry.destroy());
 *     return registry;
 *   },
 * }
 * ```
 *
 * A replacement resolves scopes through `resolveHotkeyScopeChain`, and must
 * call `destroy()` on teardown so the document listener does not outlive it.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/keyboard/hotkeys/hotkey-registry.ts
 * @since 0.1.0
 * @relatedTo CNGX_HOTKEY_REGISTRY, createHotkeyRegistry
 */
export type CngxHotkeyRegistryFactory = (deps: CngxHotkeyRegistryDeps) => CngxHotkeyRegistry;

interface HotkeyEntry {
  readonly source: Signal<readonly CngxHotkeyBinding[]>;
  readonly scope: CngxHotkeyScopeNode | null;
}

interface Candidate {
  readonly binding: CngxHotkeyBinding;
  readonly rank: number;
}

const TEXT_INPUT_TYPES = new Set(['text', 'search', 'email', 'url', 'tel', 'password', 'number']);
const FUNCTION_KEY = /^f([1-9]|1\d|2[0-4])$/;
const EDITABLE = '[contenteditable]:not([contenteditable="false"])';
const TEXT_ROLES = '[role="textbox"], [role="searchbox"]';

function read<T>(value: T | Signal<T>): T {
  return isSignal(value) ? value() : value;
}

function isTextEntry(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false;
  }
  const tag = target.tagName;
  if (tag === 'TEXTAREA' || tag === 'SELECT') {
    return true;
  }
  if (tag === 'INPUT') {
    return TEXT_INPUT_TYPES.has((target as HTMLInputElement).type);
  }
  return (
    (target as HTMLElement).isContentEditable === true ||
    target.matches(TEXT_ROLES) ||
    target.closest(EDITABLE) !== null
  );
}

/** Cheap pre-check on the press: nothing else can pass `firesInTextEntry`. */
function mayFireInTextEntry(event: KeyboardEvent): boolean {
  return (
    event.ctrlKey ||
    event.metaKey ||
    event.key === 'Escape' ||
    FUNCTION_KEY.test(event.key.toLowerCase())
  );
}

/** Keys that edit no text, plus every primary-modifier combo, fire in a field. */
function firesInTextEntry(combo: KeyCombo): boolean {
  return (
    combo.ctrl || combo.meta || combo.mod || combo.key === 'escape' || FUNCTION_KEY.test(combo.key)
  );
}

function innermostModal(chain: readonly CngxHotkeyScopeNode[]): CngxHotkeyScopeNode | null {
  const last = chain.at(-1);
  return last?.modal() ? last : null;
}

function reaches(
  binding: CngxHotkeyBinding,
  scope: CngxHotkeyScopeNode | null,
  chain: readonly CngxHotkeyScopeNode[],
  modal: CngxHotkeyScopeNode | null,
): boolean {
  if ((binding.reach ?? 'global') === 'focus') {
    // The app scope is on every chain a modal does not cut.
    return scope === null ? modal === null : chain.includes(scope);
  }
  return modal === null || (scope !== null && modal.element.contains(scope.element));
}

/** Lower is deeper; the app scope and scopes off the chain share the bottom rank. */
function rankOf(scope: CngxHotkeyScopeNode | null, chain: readonly CngxHotkeyScopeNode[]): number {
  const index = scope === null ? -1 : chain.indexOf(scope);
  return index === -1 ? chain.length : index;
}

function sameGroups(a: readonly CngxHotkeyGroup[], b: readonly CngxHotkeyGroup[]): boolean {
  return (
    a.length === b.length &&
    a.every(
      (g, i) =>
        g.group === b[i].group &&
        g.bindings.length === b[i].bindings.length &&
        g.bindings.every((l, j) => {
          const o = b[i].bindings[j];
          return (
            l.id === o.id &&
            l.combo === o.combo &&
            l.description === o.description &&
            l.group === o.group
          );
        }),
    )
  );
}

// Module scope on purpose: the production build drops an unused top-level
// function with its cngxDevWarn import, but not one nested in a closure.
/** Dev-only checks of a binding's current combo at registration. */
function warnRegistration(
  binding: CngxHotkeyBinding,
  combo: KeyCombo | null,
  isMac: boolean,
): void {
  if (!(typeof ngDevMode !== 'undefined' && ngDevMode)) {
    return;
  }
  const raw = read(binding.combo);
  if (combo === null) {
    cngxDevWarn(
      'CNGX1080',
      `createHotkeyRegistry(): hotkey "${binding.id}" has the unparseable combo "${raw}"; it never fires.`,
      { id: binding.id, combo: raw },
    );
    return;
  }
  if (isReservedHotkey(combo, isMac)) {
    cngxDevWarn(
      'CNGX1078',
      `createHotkeyRegistry(): hotkey "${binding.id}" uses "${raw}", which the browser handles before the page.`,
      { id: binding.id, combo: raw },
    );
  }
  if (isAltGrRiskHotkey(combo)) {
    cngxDevWarn(
      'CNGX1079',
      `createHotkeyRegistry(): hotkey "${binding.id}" uses "${raw}"; Ctrl+Alt is AltGr on Windows and Linux, so it never fires on layouts that type characters with AltGr.`,
      { id: binding.id, combo: raw },
    );
  }
}

/** Dev-only, once per id pair: two live bindings matched one press at the same depth. */
function warnTie(
  winner: CngxHotkeyBinding,
  others: readonly CngxHotkeyBinding[],
  warnedTies: Set<string>,
): void {
  if (!(typeof ngDevMode !== 'undefined' && ngDevMode)) {
    return;
  }
  for (const other of others) {
    const pair = [winner.id, other.id].sort().join('\u0000');
    if (warnedTies.has(pair)) {
      continue;
    }
    warnedTies.add(pair);
    cngxDevWarn(
      'CNGX1077',
      `createHotkeyRegistry(): hotkeys "${other.id}" and "${winner.id}" both matched one press at the same scope depth; "${winner.id}" (registered last) runs.`,
      { winner: winner.id, shadowed: other.id },
    );
  }
}

/**
 * Creates the document keymap. Pure and DI-agnostic: every input arrives
 * through `deps`, so a spec or a replacement registry builds one without an
 * injector.
 *
 * Resolution, derived per keypress (no stored "active scope"):
 *
 * 1. A registration whose scope or an ancestor scope is inactive is muted.
 * 2. The chain is every scope containing `event.target`, innermost first, cut
 *    after the first modal one.
 * 3. A binding fires when its combo matches, `enabled()` is true, and its
 *    reach allows it: `'focus'` needs its scope on the chain, `'global'`
 *    needs no modal on the chain or its scope inside the innermost modal.
 * 4. The deeper scope on the chain wins; among equals the last registration.
 *
 * Inside a text field (text-like `input`, `textarea`, `select`,
 * `contenteditable`, `role="textbox"` / `"searchbox"`, also inside a shadow
 * root) only combos with `ctrl`, `meta` or `mod`, function keys
 * and `escape` fire. Events the page already handled (`defaultPrevented`),
 * IME composition and auto-repeat (unless `allowRepeat`) are skipped. A
 * fired binding gets a `preventDefault()`ed event.
 *
 * The single `keydown` listener exists only while at least one source is
 * registered, never on the server (`doc.defaultView === null`), and
 * `destroy()` removes it.
 *
 * @param deps The document and the platform flag.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/keyboard/hotkeys/hotkey-registry.ts
 * @since 0.1.0
 * @relatedTo CNGX_HOTKEY_REGISTRY, injectHotkeyRegistryDeps, CngxHotkeyRegistryFactory
 */
export function createHotkeyRegistry(deps: CngxHotkeyRegistryDeps): CngxHotkeyRegistry {
  const { doc, isMac } = deps;
  const registrations = createKeyedRegistry<HotkeyEntry>({ name: 'CngxHotkeyRegistry' });
  const parsed = new Map<string, KeyCombo | null>();
  const lastGroups = new WeakMap<Element, readonly CngxHotkeyGroup[]>();
  const warnedTies = new Set<string>();
  let listening = false;
  let destroyed = false;

  function comboOf(binding: CngxHotkeyBinding): KeyCombo | null {
    const combo = read(binding.combo);
    if (!parsed.has(combo)) {
      parsed.set(combo, parseHotkeyCombo(combo));
    }
    return parsed.get(combo) ?? null;
  }

  function contextOf(target: EventTarget | null): Element {
    return target instanceof Element ? target : doc.documentElement;
  }

  /** Every live candidate for a context, with its precedence rank. */
  function candidates(context: Element): Candidate[] {
    const chain = resolveHotkeyScopeChain(context);
    const modal = innermostModal(chain);
    const out: Candidate[] = [];
    for (const entry of registrations.values()) {
      if (entry.scope?.muted()) {
        continue;
      }
      const rank = rankOf(entry.scope, chain);
      for (const binding of entry.source()) {
        const enabled = binding.enabled?.() ?? true;
        if (enabled && reaches(binding, entry.scope, chain, modal)) {
          out.push({ binding, rank });
        }
      }
    }
    return out;
  }

  function handleKeydown(event: KeyboardEvent): void {
    // A keydown dispatched from inside an effect or computed must not make
    // the registry's signals (or `run`'s reads) its dependencies.
    untracked(() => resolveKeydown(event));
  }

  function resolveKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented || event.isComposing) {
      return;
    }
    // At the document a shadow-DOM press is retargeted to its host; the
    // composed path still starts at the field the user types in.
    const target = event.composedPath()[0] ?? event.target;
    const inText = isTextEntry(target);
    if (inText && !mayFireInTextEntry(event)) {
      return;
    }
    let winner: Candidate | null = null;
    let tied: CngxHotkeyBinding[] = [];
    for (const candidate of candidates(contextOf(target))) {
      const { binding } = candidate;
      if (event.repeat && !binding.allowRepeat) {
        continue;
      }
      const combo = comboOf(binding);
      if (combo === null || (inText && !firesInTextEntry(combo))) {
        continue;
      }
      if (!matchesKeyCombo(event, combo, isMac)) {
        continue;
      }
      if (winner === null || candidate.rank < winner.rank) {
        winner = candidate;
        tied = [];
      } else if (candidate.rank === winner.rank) {
        // The later registration wins among equal ranks.
        tied.push(winner.binding);
        winner = candidate;
      }
    }
    if (winner !== null) {
      if (typeof ngDevMode !== 'undefined' && ngDevMode && tied.length > 0) {
        warnTie(winner.binding, tied, warnedTies);
      }
      event.preventDefault();
      winner.binding.run(event);
    }
  }

  function syncListener(): void {
    const wanted = !destroyed && doc.defaultView !== null && registrations.values().length > 0;
    if (wanted === listening) {
      return;
    }
    listening = wanted;
    if (wanted) {
      doc.addEventListener('keydown', handleKeydown);
    } else {
      doc.removeEventListener('keydown', handleKeydown);
    }
  }

  function register(
    source: Signal<readonly CngxHotkeyBinding[]>,
    scope: CngxHotkeyScopeNode | null,
  ): CngxHotkeyRegistration {
    if (destroyed) {
      return { unregister: () => undefined };
    }
    const key = nextUid('cngx-hotkey');
    const entry: HotkeyEntry = { source, scope };
    registrations.register(key, entry);
    syncListener();
    if (typeof ngDevMode !== 'undefined' && ngDevMode) {
      untracked(source).forEach((binding) => warnRegistration(binding, comboOf(binding), isMac));
    }
    return {
      unregister: () => {
        registrations.unregister(key, entry);
        syncListener();
      },
    };
  }

  function liveGroupsFor(context: Element | null): readonly CngxHotkeyGroup[] {
    const element = context ?? doc.documentElement;
    const winners = new Map<string, Candidate>();
    for (const candidate of candidates(element)) {
      const { binding } = candidate;
      if (binding.description === undefined || comboOf(binding) === null) {
        continue;
      }
      const held = winners.get(binding.id);
      if (held === undefined || candidate.rank <= held.rank) {
        winners.set(binding.id, candidate);
      }
    }
    const groups = new Map<string | null, CngxHotkeyListing[]>();
    for (const { binding } of winners.values()) {
      const group = binding.group === undefined ? null : read(binding.group);
      const listing: CngxHotkeyListing = {
        id: binding.id,
        combo: read(binding.combo),
        description: read(binding.description ?? ''),
        group,
      };
      const rows = groups.get(group);
      if (rows) {
        rows.push(listing);
      } else {
        groups.set(group, [listing]);
      }
    }
    const next: readonly CngxHotkeyGroup[] = Array.from(groups, ([group, bindings]) => ({
      group,
      bindings,
    }));
    const previous = lastGroups.get(element);
    if (previous !== undefined && sameGroups(previous, next)) {
      return previous;
    }
    lastGroups.set(element, next);
    return next;
  }

  function destroy(): void {
    if (destroyed) {
      return;
    }
    destroyed = true;
    for (const [key, entry] of registrations.entries()) {
      registrations.unregister(key, entry);
    }
    syncListener();
  }

  return { isMac, register, liveGroupsFor, destroy };
}

/**
 * Gathers the default {@link CngxHotkeyRegistryDeps} from the injector:
 * `DOCUMENT` and the macOS flag from `resolveMacPlatform`. Call it from a
 * replacement factory behind {@link CNGX_HOTKEY_REGISTRY}.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/keyboard/hotkeys/hotkey-registry.ts
 * @since 0.1.0
 * @relatedTo createHotkeyRegistry, CNGX_HOTKEY_REGISTRY
 */
export function injectHotkeyRegistryDeps(): CngxHotkeyRegistryDeps {
  return {
    doc: inject(DOCUMENT),
    isMac: resolveMacPlatform(injectWindow()?.navigator),
  };
}

/**
 * The app's hotkey registry. Root-provided: one keymap per document, torn
 * down with the root injector. Override it with a factory for a custom
 * registry or an isolated subtree:
 *
 * ```ts
 * providers: [
 *   {
 *     provide: CNGX_HOTKEY_REGISTRY,
 *     useFactory: () => {
 *       const registry = myRegistry(injectHotkeyRegistryDeps());
 *       inject(DestroyRef).onDestroy(() => registry.destroy());
 *       return registry;
 *     },
 *   },
 * ]
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/keyboard/hotkeys/hotkey-registry.ts
 * @since 0.1.0
 * @relatedTo createHotkeyRegistry, injectHotkeyRegistry, CngxHotkeyRegistryFactory
 */
export const CNGX_HOTKEY_REGISTRY = new InjectionToken<CngxHotkeyRegistry>('CNGX_HOTKEY_REGISTRY', {
  providedIn: 'root',
  factory: () => {
    const registry = createHotkeyRegistry(injectHotkeyRegistryDeps());
    inject(DestroyRef).onDestroy(() => registry.destroy());
    return registry;
  },
});

/**
 * Injects the hotkey registry of the current injector.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/keyboard/hotkeys/hotkey-registry.ts
 * @since 0.1.0
 * @relatedTo CNGX_HOTKEY_REGISTRY, injectHotkey
 */
export function injectHotkeyRegistry(): CngxHotkeyRegistry {
  return inject(CNGX_HOTKEY_REGISTRY);
}

/**
 * Registers one binding in the current hotkey scope for the lifetime of the
 * injection context: a routed component's binding leaves with the route.
 *
 * ```ts
 * readonly save = injectHotkey({ id: 'editor.save', combo: 'mod+s', run: () => this.save() });
 * ```
 *
 * @param binding The binding record.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/keyboard/hotkeys/hotkey-registry.ts
 * @since 0.1.0
 * @relatedTo injectHotkeys, CngxHotkeyBinding, CngxHotkeyRef
 */
export function injectHotkey(binding: CngxHotkeyBinding): CngxHotkeyRef {
  const scope = inject(CNGX_HOTKEY_SCOPE, { optional: true });
  const registration = injectHotkeys(signal<readonly CngxHotkeyBinding[]>([binding]).asReadonly());
  return {
    id: binding.id,
    effectiveCombo: computed(() => read(binding.combo)),
    muted: computed(() => scope?.muted() ?? false),
    unregister: () => registration.unregister(),
  };
}

/**
 * Registers a binding source in the current hotkey scope for the lifetime of
 * the injection context. The source is read per keypress and per help-list
 * read, so a list that changes (commands loaded later, a flag turned on)
 * needs no re-registration.
 *
 * ```ts
 * injectHotkeys(computed(() => this.items().map((item) => toBinding(item))));
 * ```
 *
 * @param source The bindings to register.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/keyboard/hotkeys/hotkey-registry.ts
 * @since 0.1.0
 * @relatedTo injectHotkey, CngxHotkeyBinding, CngxHotkeyRegistration
 */
export function injectHotkeys(
  source: Signal<readonly CngxHotkeyBinding[]>,
): CngxHotkeyRegistration {
  const registry = inject(CNGX_HOTKEY_REGISTRY);
  const scope = inject(CNGX_HOTKEY_SCOPE, { optional: true });
  const registration = registry.register(source, scope);
  inject(DestroyRef).onDestroy(() => registration.unregister());
  return registration;
}
