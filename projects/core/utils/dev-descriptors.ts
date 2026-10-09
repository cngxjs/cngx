import type { Signal } from '@angular/core';

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

type WithoutVersion<T> = T extends unknown ? Omit<T, 'version'> : never;

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

/** Field chains longer than this are not walked. */
const MAX_DEPTH = 2;

/**
 * Lists every tagged value among the own fields of `instance`, TypeScript
 * `private` fields included. A tagged factory result is descended into, so a
 * select core's nested selection controller is found too; untagged objects are
 * not, which keeps the walk bounded. Stops at a field chain of two and visits
 * each object once, so cycles terminate. Getters are never invoked.
 *
 * @internal
 */
export function resolveDevDescriptors(instance: object): CngxDevDescriptorEntry[] {
  const entries: CngxDevDescriptorEntry[] = [];
  const visited = new Set<object>([instance]);
  walkFields(instance, [], visited, entries);
  return entries;
}

function walkFields(
  owner: object,
  path: readonly string[],
  visited: Set<object>,
  entries: CngxDevDescriptorEntry[],
): void {
  for (const name of Object.getOwnPropertyNames(owner)) {
    const value = Object.getOwnPropertyDescriptor(owner, name)?.value as unknown;
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

/** Objects and functions (signals are functions) can key a `WeakMap`. */
function isReference(value: unknown): value is object {
  return (typeof value === 'object' && value !== null) || typeof value === 'function';
}
