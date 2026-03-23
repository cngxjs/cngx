import { type WritableSignal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';

/**
 * Sets a signal value, runs change detection, and flushes effects.
 *
 * @example
 * ```typescript
 * updateAndFlush(fixture, host.active, true);
 * expect(el.classList.contains('active')).toBe(true);
 * ```
 */
export function updateAndFlush<T>(
  fixture: ComponentFixture<unknown>,
  signal: WritableSignal<T>,
  value: T,
): void {
  signal.set(value);
  fixture.detectChanges();
  TestBed.flushEffects();
}
