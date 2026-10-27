import { computed, DestroyRef, inject, InjectionToken, type Signal } from '@angular/core';

import { createKeyedRegistry, type RegistryOptions } from './registry';

/**
 * Configuration for {@link createDescribedByRegistry}.
 */
export interface CngxDescribedByRegistryOptions extends RegistryOptions {
  /**
   * Ids that always lead the value, typically the consumer's static
   * `aria-describedby` attribute read through `HostAttributeToken`. A
   * space-separated list is split into its ids.
   */
  readonly seed?: string | null;
}

/**
 * Shared `aria-describedby` owner of one element, returned by
 * {@link createDescribedByRegistry}. Every directive on the element that
 * wants to describe it contributes an id signal, and every one of them binds
 * `[attr.aria-describedby]` to the same {@link CngxDescribedByRegistry.value},
 * so the bindings agree by construction and the last writer loses nothing.
 */
export interface CngxDescribedByRegistry {
  /**
   * The merged ids, space-separated: the seed first, then every contribution
   * in registration order, each id once. `null` while no id applies, so the
   * attribute is removed. A string, compared by value.
   */
  readonly value: Signal<string | null>;
  /**
   * Adds `ids` under `key`. The signal yields one id, a space-separated list
   * or `null` while its description does not apply. Same lifecycle as
   * `createKeyedRegistry`: idempotent for the same pair, swap-is-noop with a
   * dev warning for a different signal under a live key.
   */
  contribute(key: string, ids: Signal<string | null>): void;
  /**
   * Removes the contribution under `key` while `ids` is still its holder; a
   * stale holder withdrawing after a successor took the key is a no-op.
   */
  withdraw(key: string, ids: Signal<string | null>): void;
}

const splitIds = (ids: string | null | undefined): readonly string[] =>
  ids ? ids.split(/\s+/).filter(Boolean) : [];

/**
 * Creates the `aria-describedby` owner for one element. \
 * Two directives that both bind `[attr.aria-describedby]` on one element
 * overwrite each other: the later binding wins and the other id is lost (a
 * disabled button's reason next to a co-hosted tooltip). The host provides
 * one registry under {@link CNGX_DESCRIBED_BY}, every co-hosted directive
 * contributes its gated id, and all of them bind the same `value`.
 *
 * Built on `createKeyedRegistry`, so withdrawal is destroy-safe. Plain
 * signals, no injection context required.
 *
 * ```ts
 * providers: [
 *   {
 *     provide: CNGX_DESCRIBED_BY,
 *     useFactory: () =>
 *       createDescribedByRegistry({
 *         seed: inject(new HostAttributeToken('aria-describedby'), { optional: true }),
 *       }),
 *   },
 * ]
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/core/utils/described-by.ts
 * @since 0.1.0
 * @relatedTo CNGX_DESCRIBED_BY, injectDescribedByContribution, createKeyedRegistry
 */
export function createDescribedByRegistry(
  options?: CngxDescribedByRegistryOptions,
): CngxDescribedByRegistry {
  const seed = splitIds(options?.seed);
  const contributions = createKeyedRegistry<Signal<string | null>>({
    name: options?.name ?? 'cngx aria-describedby registry',
  });

  const value = computed<string | null>(() => {
    const ids = new Set(seed);
    for (const contribution of contributions.values()) {
      for (const id of splitIds(contribution())) {
        ids.add(id);
      }
    }
    return ids.size > 0 ? Array.from(ids).join(' ') : null;
  });

  return {
    value,
    contribute: (key, ids) => contributions.register(key, ids),
    withdraw: (key, ids) => contributions.unregister(key, ids),
  };
}

/**
 * The `aria-describedby` owner of the current element. A host component
 * that binds `aria-describedby` itself provides it in its own `providers`;
 * a co-hosted directive reads it with `{ self: true, optional: true }`, so
 * only a directive on the same element sees it.
 *
 * No `providedIn`, no default: an element without a providing host keeps
 * the directive's own binding.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/core/utils/described-by.ts
 * @since 0.1.0
 * @relatedTo createDescribedByRegistry, injectDescribedByContribution
 */
export const CNGX_DESCRIBED_BY = new InjectionToken<CngxDescribedByRegistry>('CNGX_DESCRIBED_BY');

/**
 * Contributes `ids` under `key` to the {@link CNGX_DESCRIBED_BY} registry of
 * the current element and withdraws it when the caller is destroyed. Returns
 * the registry, whose `value` the caller binds to `[attr.aria-describedby]`,
 * or `null` when the element provides none; the caller then binds its own
 * ids as before. Runs in an injection context.
 *
 * ```ts
 * private readonly registry = injectDescribedByContribution(this.id, this.ownIds);
 * protected readonly describedBy = this.registry?.value ?? this.ownIds;
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/core/utils/described-by.ts
 * @since 0.1.0
 * @relatedTo CNGX_DESCRIBED_BY, createDescribedByRegistry
 */
export function injectDescribedByContribution(
  key: string,
  ids: Signal<string | null>,
): CngxDescribedByRegistry | null {
  const registry = inject(CNGX_DESCRIBED_BY, { self: true, optional: true });
  if (!registry) {
    return null;
  }
  registry.contribute(key, ids);
  inject(DestroyRef).onDestroy(() => registry.withdraw(key, ids));
  return registry;
}
