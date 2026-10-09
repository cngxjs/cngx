import { isSignal, untracked, type Signal } from '@angular/core';

/**
 * Version of the {@link CngxDevDescriptor} union. Any change to a descriptor
 * shape bumps it in the same commit, so a consumer that projects descriptors
 * (a devtools console, an MCP tool) can tell which shape it reads.
 *
 * @internal
 */
export const CNGX_DEV_DESCRIPTOR_VERSION = 1;

/**
 * Describes a `createOverrideMerge` result: the coerced sides it merges.
 *
 * @internal
 */
export interface CngxOverrideMergeDescriptor {
  readonly version: number;
  readonly kind: 'cngx-dev:override-merge';
  readonly defaults: Signal<object>;
  readonly overrides: Signal<object>;
}

/**
 * Describes a `createNestedOverrideMerge` result: the coerced sides and the
 * one nested record key merged key by key.
 *
 * @internal
 */
export interface CngxNestedOverrideMergeDescriptor {
  readonly version: number;
  readonly kind: 'cngx-dev:nested-override-merge';
  readonly defaults: Signal<object>;
  readonly overrides: Signal<object>;
  readonly key: PropertyKey;
}

/**
 * Describes a `createDefaultsFill` result: the merge it fills, the coerced
 * defaults, and the nested key when the fill is nested.
 *
 * @internal
 */
export interface CngxDefaultsFillDescriptor {
  readonly version: number;
  readonly kind: 'cngx-dev:defaults-fill';
  readonly merged: Signal<object>;
  readonly defaults: Signal<object>;
  readonly key: PropertyKey | undefined;
}

/**
 * Describes a `createControlledSource` result: the higher-precedence source
 * (absent when none was injected) and the fallback.
 *
 * @internal
 */
export interface CngxControlledSourceDescriptor {
  readonly version: number;
  readonly kind: 'cngx-dev:controlled-source';
  readonly priority: Signal<unknown> | undefined;
  readonly fallback: Signal<unknown>;
}

/**
 * Describes the object a stateful `create*` factory returns: the factory name
 * and the inputs it was called with.
 *
 * @internal
 */
export interface CngxFactoryDescriptor {
  readonly version: number;
  readonly kind: 'cngx-dev:factory';
  readonly factory: string;
  readonly inputs: Readonly<Record<string, unknown>>;
}

/**
 * Everything a cngx factory can say about the object it returned, keyed by
 * `kind`. Every `kind` carries the `cngx-dev:` marker, which the production
 * strip check searches the examples bundle for.
 *
 * @internal
 */
export type CngxDevDescriptor =
  | CngxOverrideMergeDescriptor
  | CngxNestedOverrideMergeDescriptor
  | CngxDefaultsFillDescriptor
  | CngxControlledSourceDescriptor
  | CngxFactoryDescriptor;

/**
 * A descriptor as a factory hands it to `CNGX_DEV_DESCRIPTORS.tag`: without
 * `version`, which `tag` stamps. Distributive, because a plain `Omit` over the
 * union collapses the `kind` discriminant.
 *
 * @internal
 */
export type CngxDevDescriptorInit = WithoutVersion<CngxDevDescriptor>;

/** @internal */
type WithoutVersion<T> = T extends unknown ? Omit<T, 'version'> : never;

/** @internal */
const DESCRIPTORS = new WeakMap<object, CngxDevDescriptor>();

/**
 * The dev-mode descriptor seam. A factory tags the object it returns, behind
 * `typeof ngDevMode !== 'undefined' && ngDevMode`, so production builds drop
 * the call; an inspector reads the tag back. A `WeakMap` holds the tags, so
 * tagging never keeps a target alive and needs no unregister.
 *
 * @internal
 */
export const CNGX_DEV_DESCRIPTORS = {
  tag<T extends object>(target: T, descriptor: CngxDevDescriptorInit): T {
    DESCRIPTORS.set(target, {
      ...descriptor,
      version: CNGX_DEV_DESCRIPTOR_VERSION,
    } as CngxDevDescriptor);
    return target;
  },
  read(target: unknown): CngxDevDescriptor | undefined {
    return isReference(target) ? DESCRIPTORS.get(target) : undefined;
  },
} as const;

/**
 * One tagged value found on an instance: the field chain that reaches it and
 * its descriptor.
 *
 * @internal
 */
export interface CngxDevDescriptorEntry {
  readonly path: readonly string[];
  readonly descriptor: CngxDevDescriptor;
}

/**
 * Field chains longer than this are not walked.
 *
 * @internal
 */
const MAX_DEPTH = 2;

/**
 * Lists every tagged value among the own fields of `instance`, TypeScript
 * `private` fields included. A tagged factory result is descended into, so a
 * select core's nested selection controller is found too; untagged objects are
 * not, which keeps the walk bounded. Inside a tagged factory result, a signal
 * field whose current value is tagged counts as that value (the select core
 * hands its controller out as `selection: Signal<SelectionController>`); the
 * signal is read once, untracked, and a read that throws is skipped. Signals on
 * `instance` itself are never read, so an unset required input cannot throw.
 * Stops at a field chain of two and visits each object once, so cycles
 * terminate. Getters are never invoked.
 *
 * @internal
 */
export function resolveDevDescriptors(instance: object): CngxDevDescriptorEntry[] {
  const entries: CngxDevDescriptorEntry[] = [];
  const visited = new Set<object>([instance]);
  walkFields(instance, [], visited, entries);
  return entries;
}

/** @internal */
function walkFields(
  owner: object,
  path: readonly string[],
  visited: Set<object>,
  entries: CngxDevDescriptorEntry[],
): void {
  for (const name of Object.getOwnPropertyNames(owner)) {
    const field = Object.getOwnPropertyDescriptor(owner, name)?.value as unknown;
    const value = path.length > 0 ? unwrapSignal(field) : field;
    if (!isReference(value) || visited.has(value)) {
      continue;
    }
    const descriptor = DESCRIPTORS.get(value);
    if (!descriptor) {
      continue;
    }
    visited.add(value);
    const fieldPath = [...path, name];
    entries.push({ path: fieldPath, descriptor });
    if (descriptor.kind === 'cngx-dev:factory' && fieldPath.length < MAX_DEPTH) {
      walkFields(value, fieldPath, visited, entries);
    }
  }
}

/**
 * The current value of an untagged signal, read untracked; any other value as
 * is. A read that throws yields `undefined`.
 *
 * @internal
 */
function unwrapSignal(value: unknown): unknown {
  if (!isSignal(value) || DESCRIPTORS.has(value)) {
    return value;
  }
  try {
    return untracked(value);
  } catch {
    return undefined;
  }
}

/**
 * Where one key of a merged bundle got its value: `'override'` when the key is
 * present in the overrides (an explicit `undefined` included, matching the
 * spread), `'default'` otherwise, `'filled'` when a defaults fill restored it
 * from a nullish merged value, and `'unknown'` when a fill wraps a signal that
 * is not a tagged merge, so the fill cannot tell the other two apart.
 *
 * @internal
 */
export type CngxValueSource = 'override' | 'default' | 'filled' | 'unknown';

/**
 * Per-key provenance of a merged bundle. The nested record of a nested merge
 * or nested fill resolves key by key into its own map.
 *
 * @internal
 */
export interface CngxOverrideProvenance {
  readonly [key: string]: CngxValueSource | CngxOverrideProvenance;
}

/**
 * Which side of a controlled source currently wins.
 *
 * @internal
 */
export type CngxControlledProvenance = 'priority' | 'fallback';

/** @internal */
type Bag = Readonly<Record<PropertyKey, unknown>>;

/**
 * Resolves, per key of the current value, where a `createOverrideMerge`,
 * `createNestedOverrideMerge` or `createDefaultsFill` result got it from.
 * Derived on read from the descriptor the merge tagged in dev mode; every
 * signal is read inside `untracked`, so a calling `computed` or `effect` does
 * not subscribe through it. `undefined` for an untagged signal, which includes
 * every signal in a production build.
 *
 * @internal
 */
export function resolveOverrideProvenance(
  merged: Signal<object>,
): CngxOverrideProvenance | undefined {
  return untracked(() => provenanceOf(merged));
}

/**
 * Resolves which side of a `createControlledSource` result currently wins:
 * `'priority'` when the priority source yields a value other than `null` or
 * `undefined`, else `'fallback'` (the `??` rule of the source itself). Reads
 * inside `untracked`; `undefined` for an untagged signal.
 *
 * @internal
 */
export function resolveControlledProvenance(
  source: Signal<unknown>,
): CngxControlledProvenance | undefined {
  const descriptor = DESCRIPTORS.get(source);
  if (descriptor?.kind !== 'cngx-dev:controlled-source') {
    return undefined;
  }
  const priority = untracked(() => descriptor.priority?.());
  return priority == null ? 'fallback' : 'priority';
}

/** @internal */
function provenanceOf(merged: Signal<object>): CngxOverrideProvenance | undefined {
  const descriptor = DESCRIPTORS.get(merged);
  switch (descriptor?.kind) {
    case 'cngx-dev:override-merge':
      return spreadProvenance(merged() as Bag, descriptor.overrides() as Bag);
    case 'cngx-dev:nested-override-merge': {
      const value = merged() as Bag;
      const overrides = descriptor.overrides() as Bag;
      const key = descriptor.key as string;
      return {
        ...spreadProvenance(value, overrides),
        [key]: spreadProvenance(asBag(value[key]), asBag(overrides[key])),
      };
    }
    case 'cngx-dev:defaults-fill':
      return fillProvenance(merged() as Bag, descriptor);
    default:
      return undefined;
  }
}

/** @internal */
function spreadProvenance(value: Bag, overrides: Bag): CngxOverrideProvenance {
  const result: Record<string, CngxValueSource> = {};
  for (const name of Object.keys(value)) {
    result[name] = Object.hasOwn(overrides, name) ? 'override' : 'default';
  }
  return result;
}

/** @internal */
function fillProvenance(
  value: Bag,
  descriptor: CngxDefaultsFillDescriptor,
): CngxOverrideProvenance {
  const inner = descriptor.merged() as Bag;
  const defaults = descriptor.defaults() as Bag;
  const innerProvenance = provenanceOf(descriptor.merged);
  const result: Record<string, CngxValueSource | CngxOverrideProvenance> = {};
  for (const name of Object.keys(value)) {
    result[name] = isFilled(defaults, inner, name)
      ? 'filled'
      : (innerProvenance?.[name] ?? 'unknown');
  }
  const key = descriptor.key as string | undefined;
  if (key === undefined) {
    return result;
  }
  const nestedInner = asBag(inner[key]);
  const nestedDefaults = asBag(defaults[key]);
  const nestedProvenance = innerProvenance?.[key];
  const nested: Record<string, CngxValueSource | CngxOverrideProvenance> = {};
  for (const name of Object.keys(asBag(value[key]))) {
    nested[name] = isFilled(nestedDefaults, nestedInner, name)
      ? 'filled'
      : chainedSource(nestedProvenance, name);
  }
  result[key] = nested;
  return result;
}

/**
 * A key the fill restored: one `defaults` has and the merge left nullish.
 *
 * @internal
 */
function isFilled(defaults: Bag, inner: Bag, name: string): boolean {
  return Object.hasOwn(defaults, name) && inner[name] == null;
}

/**
 * The inner source of a nested key: the inner merge resolved the whole record
 * at once when it was flat, key by key when it was nested.
 *
 * @internal
 */
function chainedSource(
  provenance: CngxValueSource | CngxOverrideProvenance | undefined,
  name: string,
): CngxValueSource | CngxOverrideProvenance {
  if (typeof provenance === 'string') {
    return provenance;
  }
  return provenance?.[name] ?? 'unknown';
}

/** @internal */
function asBag(value: unknown): Bag {
  return typeof value === 'object' && value !== null ? (value as Bag) : {};
}

/**
 * Objects and functions (signals are functions) can key a `WeakMap`.
 *
 * @internal
 */
function isReference(value: unknown): value is object {
  return (typeof value === 'object' && value !== null) || typeof value === 'function';
}
