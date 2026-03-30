import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import { createVisibilityTimer } from './visibility-timer';

describe('createVisibilityTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function setup(opts: { delay?: number; minDuration?: number } = {}) {
    const isActive = signal(false);
    const delay = signal(opts.delay ?? 200);
    const minDuration = signal(opts.minDuration ?? 500);

    let visible!: ReturnType<typeof createVisibilityTimer>;
    TestBed.runInInjectionContext(() => {
      visible = createVisibilityTimer(isActive, delay, minDuration);
    });
    TestBed.flushEffects();

    return { isActive, delay, minDuration, visible };
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

  it('should stay visible for minDuration even if isActive becomes false quickly', () => {
    const { isActive, visible } = setup({ delay: 200, minDuration: 500 });

    isActive.set(true);
    TestBed.flushEffects();
    vi.advanceTimersByTime(200);
    expect(visible()).toBe(true);

    // Deactivate immediately after becoming visible
    isActive.set(false);
    TestBed.flushEffects();

    // Still visible — minDuration not elapsed
    vi.advanceTimersByTime(300);
    expect(visible()).toBe(true);
  });

  it('should hide after minDuration when isActive is false', () => {
    const { isActive, visible } = setup({ delay: 200, minDuration: 500 });

    isActive.set(true);
    TestBed.flushEffects();
    vi.advanceTimersByTime(200);
    expect(visible()).toBe(true);

    isActive.set(false);
    TestBed.flushEffects();

    vi.advanceTimersByTime(500);
    expect(visible()).toBe(false);
  });

  it('should remain visible if isActive is still true after minDuration', () => {
    const { isActive, visible } = setup({ delay: 200, minDuration: 500 });

    isActive.set(true);
    TestBed.flushEffects();
    vi.advanceTimersByTime(200);
    expect(visible()).toBe(true);

    // Do not deactivate — wait for minDuration to pass
    vi.advanceTimersByTime(500);
    expect(visible()).toBe(true);
  });

  it('should hide immediately after minDuration if isActive was already false', () => {
    const { isActive, visible } = setup({ delay: 100, minDuration: 300 });

    isActive.set(true);
    TestBed.flushEffects();
    vi.advanceTimersByTime(100);
    expect(visible()).toBe(true);

    isActive.set(false);
    TestBed.flushEffects();

    // minDuration timer fires and checks isActive => false => hides
    vi.advanceTimersByTime(300);
    expect(visible()).toBe(false);
  });

  it('should respect zero delay', () => {
    const { isActive, visible } = setup({ delay: 0, minDuration: 500 });

    isActive.set(true);
    TestBed.flushEffects();
    vi.advanceTimersByTime(0);
    expect(visible()).toBe(true);
  });
});
