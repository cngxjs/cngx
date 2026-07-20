import { describe, expect, it } from 'vitest';
import { createAutoplayGate, type GestureEventTarget } from './autoplay-gate';

/** A fake gesture target that records listeners and can dispatch by type. */
function createFakeTarget(): GestureEventTarget & {
  dispatch(type: string): void;
  count(type: string): number;
} {
  const listeners = new Map<string, Set<EventListenerOrEventListenerObject>>();

  return {
    addEventListener(type, cb) {
      if (!cb) {
        return;
      }
      let set = listeners.get(type);
      if (!set) {
        set = new Set();
        listeners.set(type, set);
      }
      set.add(cb);
    },
    removeEventListener(type, cb) {
      if (!cb) {
        return;
      }
      listeners.get(type)?.delete(cb);
    },
    dispatch(type) {
      for (const cb of [...(listeners.get(type) ?? [])]) {
        (cb as EventListener)(new Event(type));
      }
    },
    count(type) {
      return listeners.get(type)?.size ?? 0;
    },
  };
}

/** Fake DestroyRef that captures the teardown callback for manual firing. */
function createFakeDestroyRef(): { onDestroy(fn: () => void): () => void; destroy(): void } {
  const fns: Array<() => void> = [];
  return {
    onDestroy(fn) {
      fns.push(fn);
      return () => {
        const i = fns.indexOf(fn);
        if (i >= 0) {
          fns.splice(i, 1);
        }
      };
    },
    destroy() {
      fns.forEach((fn) => fn());
    },
  };
}

describe('createAutoplayGate', () => {
  it('starts unarmed', () => {
    const target = createFakeTarget();
    const gate = createAutoplayGate({ target, destroyRef: createFakeDestroyRef() });
    expect(gate.armed()).toBe(false);
  });

  it('arms on the first pointerdown', () => {
    const target = createFakeTarget();
    const gate = createAutoplayGate({ target, destroyRef: createFakeDestroyRef() });
    target.dispatch('pointerdown');
    expect(gate.armed()).toBe(true);
  });

  it('arms on keydown', () => {
    const target = createFakeTarget();
    const gate = createAutoplayGate({ target, destroyRef: createFakeDestroyRef() });
    target.dispatch('keydown');
    expect(gate.armed()).toBe(true);
  });

  it('arms on touchstart', () => {
    const target = createFakeTarget();
    const gate = createAutoplayGate({ target, destroyRef: createFakeDestroyRef() });
    target.dispatch('touchstart');
    expect(gate.armed()).toBe(true);
  });

  it('arms programmatically via arm()', () => {
    const target = createFakeTarget();
    const gate = createAutoplayGate({ target, destroyRef: createFakeDestroyRef() });
    gate.arm();
    expect(gate.armed()).toBe(true);
  });

  it('removes all gesture listeners once armed', () => {
    const target = createFakeTarget();
    createAutoplayGate({ target, destroyRef: createFakeDestroyRef() });
    expect(target.count('pointerdown')).toBe(1);
    expect(target.count('keydown')).toBe(1);
    expect(target.count('touchstart')).toBe(1);

    target.dispatch('pointerdown');

    expect(target.count('pointerdown')).toBe(0);
    expect(target.count('keydown')).toBe(0);
    expect(target.count('touchstart')).toBe(0);
  });

  it('stays armed and ignores subsequent gestures', () => {
    const target = createFakeTarget();
    const gate = createAutoplayGate({ target, destroyRef: createFakeDestroyRef() });
    gate.arm();
    // A late gesture on an already-armed gate is a no-op, not a re-arm.
    target.dispatch('keydown');
    expect(gate.armed()).toBe(true);
  });

  it('removes listeners on DestroyRef teardown', () => {
    const target = createFakeTarget();
    const destroyRef = createFakeDestroyRef();
    createAutoplayGate({ target, destroyRef });
    expect(target.count('pointerdown')).toBe(1);
    destroyRef.destroy();
    expect(target.count('pointerdown')).toBe(0);
  });
});
