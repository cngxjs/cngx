import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import { createVisibilityGate } from './visibility-gate';

describe('createVisibilityGate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function setup(opts: { delay?: number; minDwell?: number } = {}) {
    const isActive = signal(false);
    const delay = signal(opts.delay ?? 200);
    const minDwell = signal(opts.minDwell ?? 500);

    let visible!: ReturnType<typeof createVisibilityGate>;
    TestBed.runInInjectionContext(() => {
      visible = createVisibilityGate(isActive, delay, minDwell);
    });
    TestBed.flushEffects();

    return { isActive, delay, minDwell, visible };
  }

  it('should not be visible initially when isActive is false', () => {
    const { visible } = setup();
    expect(visible()).toBe(false);
  });

  it('should not be visible immediately when isActive becomes true', () => {
    const { isActive, visible } = setup({ delay: 200 });

    isActive.set(true);
    TestBed.flushEffects();

    expect(visible()).toBe(false);
  });

  it('should become visible after delay when isActive is true', () => {
    const { isActive, visible } = setup({ delay: 200 });

    isActive.set(true);
    TestBed.flushEffects();

    vi.advanceTimersByTime(200);
    expect(visible()).toBe(true);
  });

  it('should not become visible if isActive becomes false before delay', () => {
    const { isActive, visible } = setup({ delay: 200 });

    isActive.set(true);
    TestBed.flushEffects();

    vi.advanceTimersByTime(100);
    isActive.set(false);
    TestBed.flushEffects();

    vi.advanceTimersByTime(200);
    expect(visible()).toBe(false);
  });

  it('should stay visible for minDwell even if isActive becomes false quickly', () => {
    const { isActive, visible } = setup({ delay: 200, minDwell: 500 });

    isActive.set(true);
    TestBed.flushEffects();
    vi.advanceTimersByTime(200);
    expect(visible()).toBe(true);

    // Deactivate immediately after becoming visible
    isActive.set(false);
    TestBed.flushEffects();

    // Still visible — minDwell not elapsed
    vi.advanceTimersByTime(300);
    expect(visible()).toBe(true);
  });

  it('should hide after minDwell when isActive is false', () => {
    const { isActive, visible } = setup({ delay: 200, minDwell: 500 });

    isActive.set(true);
    TestBed.flushEffects();
    vi.advanceTimersByTime(200);
    expect(visible()).toBe(true);

    isActive.set(false);
    TestBed.flushEffects();

    vi.advanceTimersByTime(500);
    expect(visible()).toBe(false);
  });

  it('should remain visible if isActive is still true after minDwell', () => {
    const { isActive, visible } = setup({ delay: 200, minDwell: 500 });

    isActive.set(true);
    TestBed.flushEffects();
    vi.advanceTimersByTime(200);
    expect(visible()).toBe(true);

    // Do not deactivate — wait for minDwell to pass
    vi.advanceTimersByTime(500);
    expect(visible()).toBe(true);
  });

  it('should hide immediately after minDwell if isActive was already false', () => {
    const { isActive, visible } = setup({ delay: 100, minDwell: 300 });

    isActive.set(true);
    TestBed.flushEffects();
    vi.advanceTimersByTime(100);
    expect(visible()).toBe(true);

    isActive.set(false);
    TestBed.flushEffects();

    // minDwell timer fires and checks isActive => false => hides
    vi.advanceTimersByTime(300);
    expect(visible()).toBe(false);
  });

  it('should respect zero delay', () => {
    const { isActive, visible } = setup({ delay: 0, minDwell: 500 });

    isActive.set(true);
    TestBed.flushEffects();
    vi.advanceTimersByTime(0);
    expect(visible()).toBe(true);
  });
});
