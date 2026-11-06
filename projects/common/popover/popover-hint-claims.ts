import { computed, type Signal, untracked } from '@angular/core';
import { createKeyedRegistry, nextUid } from '@cngx/core/utils';

/** @internal One live claim; a fresh object per claim keeps the registry's identity guard exact. */
interface PopoverHintClaim<T> {
  readonly value: T;
}

/**
 * @internal Owner-keyed claim map behind the composer hints of `CngxPopover`.
 */
export interface PopoverHintClaims<T> {
  /** The value of the last live claim, or `undefined` when nobody claims. */
  readonly current: Signal<T | undefined>;
  /**
   * Claims `value` for `owner`. A re-claim replaces the owner's previous
   * claim and moves it to the end, so the latest claim wins.
   */
  claim(owner: object, value: T): void;
  /** Removes only `owner`'s claim. A no-op when `owner` holds none. */
  release(owner: object): void;
}

/**
 * @internal Creates an owner-keyed claim map: several composers can hint the
 * same popover, the last live claim wins, and a release only removes the
 * releasing owner's claim, so a co-composer's hint survives it. Built on
 * `createKeyedRegistry`, so every removal goes through its guarded
 * unregister path.
 *
 * `claim` and `release` run untracked: composers call them from effects, and
 * the registry reads its own state on write.
 */
export function createPopoverHintClaims<T>(name: string): PopoverHintClaims<T> {
  const registry = createKeyedRegistry<PopoverHintClaim<T>>({ name });
  const keys = new WeakMap<object, string>();

  const keyFor = (owner: object): string => {
    let key = keys.get(owner);
    if (key === undefined) {
      key = nextUid('cngx-popover-claim');
      keys.set(owner, key);
    }
    return key;
  };

  const release = (owner: object): void => {
    const key = keys.get(owner);
    if (key === undefined) {
      return;
    }
    untracked(() => {
      const held = registry.get(key);
      if (held) {
        registry.unregister(key, held);
      }
    });
  };

  const claim = (owner: object, value: T): void => {
    release(owner);
    untracked(() => registry.register(keyFor(owner), { value }));
  };

  const current = computed<T | undefined>(() => registry.values().at(-1)?.value);

  return { current, claim, release };
}
