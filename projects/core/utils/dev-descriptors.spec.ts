import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import {
  CNGX_DEV_DESCRIPTOR_VERSION,
  CNGX_DEV_DESCRIPTORS,
  resolveDevDescriptors,
} from './dev-descriptors';

function factoryResult<T extends object>(name: string, value: T): T {
  return CNGX_DEV_DESCRIPTORS.tag(value, { kind: 'cngx-dev:factory', factory: name, inputs: {} });
}

describe('CNGX_DEV_DESCRIPTORS', () => {
  it('reads back what was tagged, stamped with the descriptor version', () => {
    const fallback = signal('x');
    const target = signal('x');

    const returned = CNGX_DEV_DESCRIPTORS.tag(target, {
      kind: 'cngx-dev:controlled-source',
      priority: undefined,
      fallback,
    });

    expect(returned).toBe(target);
    expect(CNGX_DEV_DESCRIPTORS.read(target)).toEqual({
      kind: 'cngx-dev:controlled-source',
      priority: undefined,
      fallback,
      version: CNGX_DEV_DESCRIPTOR_VERSION,
    });
  });

  it('reads undefined for an untagged object and for primitives', () => {
    expect(CNGX_DEV_DESCRIPTORS.read({})).toBeUndefined();
    expect(CNGX_DEV_DESCRIPTORS.read('text')).toBeUndefined();
    expect(CNGX_DEV_DESCRIPTORS.read(null)).toBeUndefined();
  });

  it('exposes no way to enumerate tagged targets, so tags never retain them', () => {
    expect(Object.keys(CNGX_DEV_DESCRIPTORS).sort()).toEqual(['read', 'tag']);
  });
});

describe('resolveDevDescriptors', () => {
  it('finds a tagged value in a TypeScript-private field and ignores untagged fields', () => {
    class Host {
      private readonly tracker = factoryResult('createTransitionTracker', { current: 1 });
      readonly plain = { current: 2 };
      readonly label = 'text';

      peek(): unknown {
        return this.tracker;
      }
    }
    const host = new Host();

    const entries = resolveDevDescriptors(host);

    expect(entries).toHaveLength(1);
    expect(entries[0].path).toEqual(['tracker']);
    expect(entries[0].descriptor).toMatchObject({ factory: 'createTransitionTracker' });
    expect(entries[0].descriptor).toBe(CNGX_DEV_DESCRIPTORS.read(host.peek()));
  });

  it('descends into a tagged factory result to a field chain of two', () => {
    const selection = factoryResult('createSelectionController', {
      deeper: factoryResult('createTransitionTracker', {}),
    });
    const host = { core: factoryResult('createSelectCore', { selection, untagged: {} }) };

    const paths = resolveDevDescriptors(host).map((entry) => entry.path);

    expect(paths).toEqual([['core'], ['core', 'selection']]);
  });

  it('does not descend into untagged objects', () => {
    const host = { bag: { tracker: factoryResult('createTransitionTracker', {}) } };

    expect(resolveDevDescriptors(host)).toEqual([]);
  });

  it('terminates on a cyclic tagged object', () => {
    const cyclic: { self?: object } = {};
    cyclic.self = cyclic;
    factoryResult('createCycle', cyclic);
    const host = { cyclic };

    const paths = resolveDevDescriptors(host).map((entry) => entry.path);

    expect(paths).toEqual([['cyclic']]);
  });

  it('never invokes an own getter', () => {
    const host = {};
    let reads = 0;
    Object.defineProperty(host, 'lazy', {
      get: () => {
        reads++;
        return factoryResult('createLazy', {});
      },
    });

    expect(resolveDevDescriptors(host)).toEqual([]);
    expect(reads).toBe(0);
  });
});
