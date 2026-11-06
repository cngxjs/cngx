import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createHeldTimerRegistry, createPausableTimer } from './pausable-timer';

const flushMicrotasks = (): Promise<void> => Promise.resolve();

describe('createPausableTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reports the remaining time while running and while paused', () => {
    const timer = createPausableTimer();
    timer.start(5000, () => undefined);
    vi.advanceTimersByTime(2000);
    expect(timer.remaining()).toBe(3000);

    timer.pause();
    vi.advanceTimersByTime(4000);
    expect(timer.remaining()).toBe(3000);

    timer.resume();
    vi.advanceTimersByTime(1000);
    expect(timer.remaining()).toBe(2000);
  });

  it('reports zero once fired or cleared', () => {
    const timer = createPausableTimer();
    timer.start(1000, () => undefined);
    vi.advanceTimersByTime(1000);
    expect(timer.remaining()).toBe(0);

    timer.start(1000, () => undefined);
    timer.clear();
    expect(timer.remaining()).toBe(0);
  });
});

describe('createHeldTimerRegistry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('segments by transition', () => {
    it('publishes a running segment at start', async () => {
      const registry = createHeldTimerRegistry();
      registry.start(1, 5000, () => undefined);
      await flushMicrotasks();

      expect(registry.segments().get(1)).toEqual({
        serial: expect.any(Number),
        total: 5000,
        remaining: 5000,
        running: true,
      });
    });

    it('publishes a paused segment at the first hold and a running one at the last release', async () => {
      const registry = createHeldTimerRegistry();
      registry.start(1, 5000, () => undefined);
      await flushMicrotasks();
      const started = registry.segments().get(1)!;

      vi.advanceTimersByTime(2000);
      registry.hold(1, 'pointer');
      await flushMicrotasks();
      const paused = registry.segments().get(1)!;
      expect(paused).toMatchObject({ total: 5000, remaining: 3000, running: false });
      expect(paused.serial).toBeGreaterThan(started.serial);

      vi.advanceTimersByTime(4000);
      registry.release(1, 'pointer');
      await flushMicrotasks();
      const resumed = registry.segments().get(1)!;
      expect(resumed).toMatchObject({ total: 5000, remaining: 3000, running: true });
      expect(resumed.serial).toBeGreaterThan(paused.serial);
    });

    it('opens no new segment for a second source while held', async () => {
      const registry = createHeldTimerRegistry();
      registry.start(1, 5000, () => undefined);
      registry.hold(1, 'pointer');
      await flushMicrotasks();
      const held = registry.segments().get(1);

      registry.hold(1, 'focus');
      registry.release(1, 'pointer');
      await flushMicrotasks();
      expect(registry.segments().get(1)).toBe(held);
    });

    it('writes nothing before the microtask flush', async () => {
      const registry = createHeldTimerRegistry();
      const before = registry.segments();
      registry.start(1, 5000, () => undefined);
      expect(registry.segments()).toBe(before);
      expect(registry.segments().size).toBe(0);

      await flushMicrotasks();
      expect(registry.segments().has(1)).toBe(true);
    });

    it('coalesces the transitions of one tick into one write', async () => {
      const registry = createHeldTimerRegistry();
      registry.start(1, 5000, () => undefined);
      await flushMicrotasks();
      const before = registry.segments();

      registry.hold(1, 'pointer');
      registry.start(2, 3000, () => undefined);
      await flushMicrotasks();
      const after = registry.segments();
      expect(after).not.toBe(before);
      expect(after.get(1)?.running).toBe(false);
      expect(after.get(2)?.running).toBe(true);

      await flushMicrotasks();
      expect(registry.segments()).toBe(after);
    });

    it('keeps the identity of untouched entries across a write of another id', async () => {
      const registry = createHeldTimerRegistry();
      registry.start(1, 5000, () => undefined);
      registry.start(2, 5000, () => undefined);
      await flushMicrotasks();
      const first = registry.segments().get(1);

      registry.hold(2, 'focus');
      await flushMicrotasks();
      expect(registry.segments().get(1)).toBe(first);
    });

    it('removes the entry on clear and on clearAll', async () => {
      const registry = createHeldTimerRegistry();
      registry.start(1, 5000, () => undefined);
      registry.start(2, 5000, () => undefined);
      await flushMicrotasks();

      registry.clear(1);
      await flushMicrotasks();
      expect(registry.segments().has(1)).toBe(false);
      expect(registry.segments().has(2)).toBe(true);

      registry.clearAll();
      await flushMicrotasks();
      expect(registry.segments().size).toBe(0);
    });
  });

  describe('hold edge cases', () => {
    it('never releases a queue hold through a focus release', () => {
      const registry = createHeldTimerRegistry();
      const done = vi.fn();
      registry.start(1, 1000, done);
      registry.hold(1, 'queue');
      registry.release(1, 'focus');
      vi.advanceTimersByTime(5000);
      expect(done).not.toHaveBeenCalled();

      registry.release(1, 'queue');
      vi.advanceTimersByTime(1000);
      expect(done).toHaveBeenCalledOnce();
    });

    it('needs one release for a doubled hold of the same source', () => {
      const registry = createHeldTimerRegistry();
      const done = vi.fn();
      registry.start(1, 1000, done);
      registry.hold(1, 'pointer');
      registry.hold(1, 'pointer');
      registry.release(1, 'pointer');
      vi.advanceTimersByTime(1000);
      expect(done).toHaveBeenCalledOnce();
    });

    it('drops several sources in one transition', async () => {
      const registry = createHeldTimerRegistry();
      const done = vi.fn();
      registry.start(1, 1000, done);
      registry.hold(1, 'pointer');
      registry.hold(1, 'focus');
      registry.dropHolds(1, ['pointer', 'focus']);
      await flushMicrotasks();
      expect(registry.segments().get(1)?.running).toBe(true);

      vi.advanceTimersByTime(1000);
      expect(done).toHaveBeenCalledOnce();
    });

    it('leaves no entry for a hold or release on a cleared id', async () => {
      const registry = createHeldTimerRegistry();
      registry.start(1, 1000, () => undefined);
      registry.clear(1);
      registry.release(1, 'focus');
      registry.hold(1, 'pointer');
      registry.dropHolds(1, ['pointer']);
      await flushMicrotasks();
      expect(registry.segments().has(1)).toBe(false);

      const done = vi.fn();
      registry.start(1, 1000, done);
      vi.advanceTimersByTime(1000);
      expect(done).toHaveBeenCalledOnce();
    });

    it('keeps a restart while held paused at the full duration', async () => {
      const registry = createHeldTimerRegistry();
      const done = vi.fn();
      registry.start(1, 5000, done);
      vi.advanceTimersByTime(2000);
      registry.hold(1, 'pointer');
      registry.start(1, 5000, done);
      await flushMicrotasks();
      expect(registry.segments().get(1)).toMatchObject({
        total: 5000,
        remaining: 5000,
        running: false,
      });

      vi.advanceTimersByTime(60000);
      expect(done).not.toHaveBeenCalled();
      registry.release(1, 'pointer');
      vi.advanceTimersByTime(5000);
      expect(done).toHaveBeenCalledOnce();
    });
  });
});
