import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { CngxNavGroupRegistry, type NavGroupRef } from './nav-group-registry';
import type { CngxDisclosure } from './disclosure.directive';

interface FakeGroup extends NavGroupRef {
  readonly open: ReturnType<typeof signal<boolean>>;
  readonly closeCalls: number[];
}

function makeGroup(initiallyOpen = true): FakeGroup {
  const open = signal(initiallyOpen);
  const closeCalls: number[] = [];
  const disclosure = {
    opened: () => open(),
    close: () => {
      open.set(false);
      closeCalls.push(1);
    },
  } as unknown as CngxDisclosure;
  return { disclosure, open, closeCalls };
}

describe('CngxNavGroupRegistry', () => {
  it('closes every other open group, leaving the excepted one open', () => {
    const registry = new CngxNavGroupRegistry();
    const a = makeGroup(true);
    const b = makeGroup(true);
    const c = makeGroup(true);
    registry.register(a);
    registry.register(b);
    registry.register(c);

    registry.closeOthers(b);

    expect(a.open()).toBe(false);
    expect(c.open()).toBe(false);
    expect(b.open()).toBe(true);
    expect(b.closeCalls).toEqual([]);
  });

  it('does not call close on groups that are already closed', () => {
    const registry = new CngxNavGroupRegistry();
    const open = makeGroup(true);
    const closed = makeGroup(false);
    registry.register(open);
    registry.register(closed);

    registry.closeOthers(open);

    // The already-closed group is skipped by the opened() guard.
    expect(closed.closeCalls).toEqual([]);
  });

  it('stops coordinating a group once it is unregistered', () => {
    const registry = new CngxNavGroupRegistry();
    const a = makeGroup(true);
    const b = makeGroup(true);
    registry.register(a);
    registry.register(b);

    registry.unregister(a);
    registry.closeOthers(b);

    // a is no longer tracked, so it stays open.
    expect(a.open()).toBe(true);
  });
});
