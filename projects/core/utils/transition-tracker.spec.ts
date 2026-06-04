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

    status.set('loading');
    TestBed.flushEffects();

    expect(tracker.current()).toBe('loading');
    expect(tracker.previous()).toBe('idle');
  });

  it('tracks multiple transitions when read between changes', () => {
    const status = signal<AsyncStatus>('idle');
    const tracker = TestBed.runInInjectionContext(() => createTransitionTracker(() => status()));

    status.set('loading');
    // Force evaluation so linkedSignal captures the intermediate state
    expect(tracker.current()).toBe('loading');
    expect(tracker.previous()).toBe('idle');

    status.set('success');
    expect(tracker.current()).toBe('success');
    expect(tracker.previous()).toBe('loading');
  });

  it('does not update when status stays the same', () => {
    const status = signal<AsyncStatus>('loading');
    const tracker = TestBed.runInInjectionContext(() => createTransitionTracker(() => status()));

    status.set('loading');
    TestBed.flushEffects();

    expect(tracker.current()).toBe('loading');
    expect(tracker.previous()).toBe('idle');
  });
});
