import { signal } from '@angular/core';
import { SIGNAL, type ReactiveNode } from '@angular/core/primitives/signals';
import { TestBed } from '@angular/core/testing';
import type { AsyncStatus } from '@cngx/core/utils';
import { describe, expect, it } from 'vitest';
import { CNGX_DEV_DESCRIPTORS } from './dev-descriptors';
import { createTransitionTracker } from './transition-tracker';

describe('createTransitionTracker', () => {
  it('starts with idle as previous', () => {
    const status = signal<AsyncStatus>('idle');
    const tracker = TestBed.runInInjectionContext(() => createTransitionTracker(() => status()));

    expect(tracker.current()).toBe('idle');
    expect(tracker.previous()).toBe('idle');
  });

  it('tracks previous after a status change', () => {
    const status = signal<AsyncStatus>('idle');
    const tracker = TestBed.runInInjectionContext(() => createTransitionTracker(() => status()));

    // First read observes the mount value; the change after it is a real edge.
    expect(tracker.current()).toBe('idle');
    status.set('loading');
    TestBed.flushEffects();

    expect(tracker.current()).toBe('loading');
    expect(tracker.previous()).toBe('idle');
  });

  it('tracks multiple transitions when read between changes', () => {
    const status = signal<AsyncStatus>('idle');
    const tracker = TestBed.runInInjectionContext(() => createTransitionTracker(() => status()));

    expect(tracker.current()).toBe('idle');
    status.set('loading');
    expect(tracker.current()).toBe('loading');
    expect(tracker.previous()).toBe('idle');

    status.set('success');
    expect(tracker.current()).toBe('success');
    expect(tracker.previous()).toBe('loading');
  });

  it('folds an unobserved change before the first read into the mount value', () => {
    // Nothing read the tracker before the change: the first observation IS
    // the mount, so no transition is fabricated for the pre-read change.
    const status = signal<AsyncStatus>('idle');
    const tracker = TestBed.runInInjectionContext(() => createTransitionTracker(() => status()));

    status.set('loading');

    expect(tracker.current()).toBe('loading');
    expect(tracker.previous()).toBe('loading');
  });

  it('does not update when status stays the same', () => {
    const status = signal<AsyncStatus>('loading');
    const tracker = TestBed.runInInjectionContext(() => createTransitionTracker(() => status()));

    status.set('loading');
    TestBed.flushEffects();

    expect(tracker.current()).toBe('loading');
    expect(tracker.previous()).toBe('loading');
  });

  it('seeds previous to the mount value (no phantom idle transition)', () => {
    // A source that mounts mid-flight must not fabricate an idle -> loading
    // edge - previous equals current until the first real change.
    const status = signal<AsyncStatus>('loading');
    const tracker = TestBed.runInInjectionContext(() => createTransitionTracker(() => status()));

    expect(tracker.current()).toBe('loading');
    expect(tracker.previous()).toBe('loading');

    status.set('success');
    expect(tracker.current()).toBe('success');
    expect(tracker.previous()).toBe('loading');
  });

  it('honors an explicit seed for previous', () => {
    const status = signal<AsyncStatus>('loading');
    const tracker = TestBed.runInInjectionContext(() =>
      createTransitionTracker(() => status(), { seed: 'idle' }),
    );

    // The explicit seed deliberately treats the mount as a transition.
    expect(tracker.current()).toBe('loading');
    expect(tracker.previous()).toBe('idle');

    status.set('success');
    expect(tracker.previous()).toBe('loading');
  });

  it('tracks generic boolean sources', () => {
    const flag = signal(false);
    const tracker = TestBed.runInInjectionContext(() => createTransitionTracker(() => flag()));

    expect(tracker.current()).toBe(false);
    expect(tracker.previous()).toBe(false);

    flag.set(true);
    expect(tracker.current()).toBe(true);
    expect(tracker.previous()).toBe(false);
  });

  it('dedupes object snapshots through the equal option', () => {
    const source = signal({ a: 1 });
    const tracker = TestBed.runInInjectionContext(() =>
      createTransitionTracker(() => source(), { equal: (x, y) => x.a === y.a }),
    );

    const first = tracker.current();
    source.set({ a: 1 });
    // Structurally equal snapshot: the tracker state dedupes - no new edge.
    expect(tracker.current()).toBe(first);
    expect(tracker.previous()).toBe(first);

    source.set({ a: 2 });
    expect(tracker.current().a).toBe(2);
    expect(tracker.previous().a).toBe(1);
  });
});

describe('createTransitionTracker dev descriptor', () => {
  it('tags the tracker with its factory name and source', () => {
    const source = signal<AsyncStatus>('idle');
    const tracker = createTransitionTracker(source);

    expect(CNGX_DEV_DESCRIPTORS.read(tracker)).toMatchObject({
      kind: 'cngx-dev:factory',
      factory: 'createTransitionTracker',
      inputs: { source },
    });
  });

  it('names the current and previous signals for the signal graph', () => {
    const tracker = createTransitionTracker(signal<AsyncStatus>('idle'));
    const nameOf = (s: object): string | undefined =>
      (s as unknown as Record<symbol, ReactiveNode>)[SIGNAL].debugName;

    expect(nameOf(tracker.current)).toBe('transitionTracker.current');
    expect(nameOf(tracker.previous)).toBe('transitionTracker.previous');
  });
});
