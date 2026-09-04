import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { AsyncStatus } from '@cngx/core/utils';
import { describe, expect, it } from 'vitest';
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
});
