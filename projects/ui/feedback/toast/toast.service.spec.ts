import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxToaster } from './toast.service';

describe('CngxToaster', () => {
  let toaster: CngxToaster;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ providers: [CngxToaster] });
    toaster = TestBed.inject(CngxToaster);
  });

  // --- show() ---

  it('adds a toast to the stack', () => {
    toaster.show({ message: 'Hello' });
    expect(toaster.toasts().length).toBe(1);
    expect(toaster.toasts()[0].config.message).toBe('Hello');
  });

  it('defaults severity to info', () => {
    toaster.show({ message: 'Test' });
    expect(toaster.toasts()[0].config.severity).toBe('info');
  });

  it('defaults dismissible to true', () => {
    toaster.show({ message: 'Test' });
    expect(toaster.toasts()[0].config.dismissible).toBe(true);
  });

  it('uses provided severity', () => {
    toaster.show({ message: 'Warn', severity: 'warning' });
    expect(toaster.toasts()[0].config.severity).toBe('warning');
  });

  it('returns a ToastRef with dismiss()', () => {
    const ref = toaster.show({ message: 'Test' });
    expect(typeof ref.dismiss).toBe('function');
    ref.dismiss();
    expect(toaster.toasts().length).toBe(0);
  });

  it('returns a ToastRef with afterDismissed()', () => {
    const ref = toaster.show({ message: 'Test' });
    let dismissed = false;
    ref.afterDismissed().subscribe(() => (dismissed = true));
    ref.dismiss();
    expect(dismissed).toBe(true);
  });

  // --- Multiple toasts ---

  it('stacks multiple toasts (newest first)', () => {
    toaster.show({ message: 'First' });
    toaster.show({ message: 'Second' });
    expect(toaster.toasts().length).toBe(2);
    expect(toaster.toasts()[0].config.message).toBe('Second');
    expect(toaster.toasts()[1].config.message).toBe('First');
  });

  // --- Timer auto-dismiss ---

  it('removes toast after duration elapses', () => {
    toaster.show({ message: 'Temp', severity: 'info', duration: 3000 });
    expect(toaster.toasts().length).toBe(1);
    vi.advanceTimersByTime(3000);
    expect(toaster.toasts().length).toBe(0);
  });

  it('uses default duration (5000ms) for non-error toasts', () => {
    toaster.show({ message: 'Default timer' });
    vi.advanceTimersByTime(4999);
    expect(toaster.toasts().length).toBe(1);
    vi.advanceTimersByTime(1);
    expect(toaster.toasts().length).toBe(0);
  });

  it('uses persistent duration for error severity', () => {
    toaster.show({ message: 'Error', severity: 'error' });
    vi.advanceTimersByTime(60000);
    expect(toaster.toasts().length).toBe(1);
  });

  // --- Deduplication ---

  it('suppresses duplicate toasts within dedup window', () => {
    toaster.show({ message: 'Dup', severity: 'info' });
    toaster.show({ message: 'Dup', severity: 'info' });
    expect(toaster.toasts().length).toBe(1);
    expect(toaster.toasts()[0].count).toBe(2);
  });

  it('allows same message after dedup window expires', () => {
    toaster.show({ message: 'Dup', severity: 'info' });
    vi.advanceTimersByTime(1001);
    toaster.show({ message: 'Dup', severity: 'info' });
    expect(toaster.toasts().length).toBe(2);
  });

  it('does not dedup toasts with different severity', () => {
    toaster.show({ message: 'Same', severity: 'info' });
    toaster.show({ message: 'Same', severity: 'error' });
    expect(toaster.toasts().length).toBe(2);
  });

  // --- dismiss() ---

  it('dismiss() removes a specific toast by id', () => {
    toaster.show({ message: 'A' });
    toaster.show({ message: 'B' });
    const idToRemove = toaster.toasts()[0].id;
    toaster.dismiss(idToRemove);
    expect(toaster.toasts().length).toBe(1);
    expect(toaster.toasts()[0].config.message).toBe('A');
  });

  it('dismiss() is a no-op for unknown id', () => {
    toaster.show({ message: 'A' });
    toaster.dismiss(999);
    expect(toaster.toasts().length).toBe(1);
  });

  // --- dismissAll() ---

  it('dismissAll() clears the entire stack', () => {
    toaster.show({ message: 'A' });
    toaster.show({ message: 'B' });
    toaster.show({ message: 'C' });
    toaster.dismissAll();
    expect(toaster.toasts().length).toBe(0);
  });

  it('dismissAll() emits afterDismissed for all toasts', () => {
    let count = 0;
    const ref1 = toaster.show({ message: 'A' });
    const ref2 = toaster.show({ message: 'B' });
    ref1.afterDismissed().subscribe(() => count++);
    ref2.afterDismissed().subscribe(() => count++);
    toaster.dismissAll();
    expect(count).toBe(2);
  });

  // --- Pause / Resume ---

  it('pauseTimer() pauses auto-dismiss', () => {
    toaster.show({ message: 'Pause me', duration: 3000 });
    const id = toaster.toasts()[0].id;
    vi.advanceTimersByTime(1000);
    toaster.pauseTimer(id);
    vi.advanceTimersByTime(5000);
    expect(toaster.toasts().length).toBe(1);
    expect(toaster.toasts()[0].pausedRemaining).toBeDefined();
  });

  it('resumeTimer() resumes auto-dismiss from remaining time', () => {
    toaster.show({ message: 'Resume me', duration: 3000 });
    const id = toaster.toasts()[0].id;
    vi.advanceTimersByTime(1000);
    toaster.pauseTimer(id);
    toaster.resumeTimer(id);
    expect(toaster.toasts()[0].pausedRemaining).toBeUndefined();
    vi.advanceTimersByTime(2000);
    expect(toaster.toasts().length).toBe(0);
  });

  // --- Action config ---

  it('stores action config when provided', () => {
    const handler = vi.fn();
    toaster.show({ message: 'Act', action: { label: 'Undo', handler } });
    expect(toaster.toasts()[0].config.action).toEqual({ label: 'Undo', handler });
  });
});
