import { describe, expect, it } from 'vitest';
import { createDebouncer } from './debouncer';

/** Build a debouncer over a controllable clock. */
function setup(windowMs = 100) {
  let clock = 0;
  const debouncer = createDebouncer({ windowMs, now: () => clock });
  return {
    debouncer,
    advance(ms: number) {
      clock += ms;
    },
  };
}

describe('createDebouncer', () => {
  it('fires the first time a name is seen', () => {
    const { debouncer } = setup();
    expect(debouncer.shouldFire('tap')).toBe(true);
  });

  it('suppresses an identical name within the window', () => {
    const { debouncer } = setup();
    expect(debouncer.shouldFire('tap')).toBe(true);
    expect(debouncer.shouldFire('tap')).toBe(false);
  });

  it('suppresses the whole burst against the first fire', () => {
    const { debouncer, advance } = setup(100);
    expect(debouncer.shouldFire('tap')).toBe(true);
    advance(40);
    expect(debouncer.shouldFire('tap')).toBe(false);
    advance(40); // 80 ms since first fire, still inside 100 ms
    expect(debouncer.shouldFire('tap')).toBe(false);
  });

  it('fires again once the window elapses', () => {
    const { debouncer, advance } = setup(100);
    expect(debouncer.shouldFire('tap')).toBe(true);
    advance(100);
    expect(debouncer.shouldFire('tap')).toBe(true);
  });

  it('tracks names independently', () => {
    const { debouncer } = setup();
    expect(debouncer.shouldFire('tap')).toBe(true);
    expect(debouncer.shouldFire('success')).toBe(true);
    expect(debouncer.shouldFire('tap')).toBe(false);
  });

  it('never suppresses when the window is zero', () => {
    const { debouncer } = setup(0);
    expect(debouncer.shouldFire('tap')).toBe(true);
    expect(debouncer.shouldFire('tap')).toBe(true);
  });

  it('reset(name) clears one name', () => {
    const { debouncer } = setup();
    debouncer.shouldFire('tap');
    debouncer.reset('tap');
    expect(debouncer.shouldFire('tap')).toBe(true);
  });

  it('reset() clears all names', () => {
    const { debouncer } = setup();
    debouncer.shouldFire('tap');
    debouncer.shouldFire('success');
    debouncer.reset();
    expect(debouncer.shouldFire('tap')).toBe(true);
    expect(debouncer.shouldFire('success')).toBe(true);
  });
});
