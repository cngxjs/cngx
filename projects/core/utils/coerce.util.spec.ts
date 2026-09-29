import { describe, it, expect } from 'vitest';
import '@angular/compiler';
import { isSignal, signal } from '@angular/core';
import { coerceBooleanProperty, coerceNumberProperty, coerceSignal } from './coerce.util';

describe('coerceBooleanProperty', () => {
  it('returns true for truthy strings', () => {
    expect(coerceBooleanProperty('true')).toBe(true);
    expect(coerceBooleanProperty('')).toBe(true);
    expect(coerceBooleanProperty('anything')).toBe(true);
  });

  it('returns false for "false"', () => {
    expect(coerceBooleanProperty('false')).toBe(false);
  });

  it('returns false for null and undefined', () => {
    expect(coerceBooleanProperty(null)).toBe(false);
    expect(coerceBooleanProperty(undefined)).toBe(false);
  });
});

describe('coerceNumberProperty', () => {
  it('parses numeric strings', () => {
    expect(coerceNumberProperty('42')).toBe(42);
    expect(coerceNumberProperty('3.14')).toBe(3.14);
  });

  it('returns fallback for non-numeric input', () => {
    expect(coerceNumberProperty('abc')).toBe(0);
    expect(coerceNumberProperty('abc', -1)).toBe(-1);
  });

  it('passes through numbers', () => {
    expect(coerceNumberProperty(7)).toBe(7);
  });

  it('parses a leading numeric prefix leniently (parseFloat contract)', () => {
    expect(coerceNumberProperty('12px')).toBe(12);
    expect(coerceNumberProperty('1.5rem')).toBe(1.5);
    expect(coerceNumberProperty('px12', -1)).toBe(-1);
  });

  it('returns fallback for booleans and objects', () => {
    expect(coerceNumberProperty(true, -1)).toBe(-1);
    expect(coerceNumberProperty(false, -1)).toBe(-1);
    expect(coerceNumberProperty({}, -1)).toBe(-1);
  });
});

describe('coerceSignal', () => {
  it('wraps a static value into a signal reading that value', () => {
    const bundle = { label: 'Close' };
    const result = coerceSignal(bundle);
    expect(isSignal(result)).toBe(true);
    expect(result()).toBe(bundle);
    expect(coerceSignal('en-US')()).toBe('en-US');
  });

  it('passes a signal through by reference', () => {
    const source = signal({ label: 'Close' });
    expect(coerceSignal(source)).toBe(source);
  });

  it('returns the same signal for the same static object', () => {
    const bundle = { label: 'Close' };
    expect(coerceSignal(bundle)).toBe(coerceSignal(bundle));
    expect(coerceSignal({ label: 'Close' })).not.toBe(coerceSignal(bundle));
  });

  it('never takes a plain formatter function or a bundle of them for a signal', () => {
    const format = (count: number): string => `${count} more`;
    const wrappedFn = coerceSignal<(count: number) => string>(format);
    expect(wrappedFn).not.toBe(format);
    expect(wrappedFn()).toBe(format);

    const bundle = { alertOverflow: format };
    expect(coerceSignal(bundle)()).toBe(bundle);
  });

  it('shares one signal per equal primitive', () => {
    expect(coerceSignal('Close')).toBe(coerceSignal('Close'));
    expect(coerceSignal(3)).toBe(coerceSignal(3));
    expect(coerceSignal<string | undefined>(undefined)).toBe(
      coerceSignal<string | undefined>(undefined),
    );
  });

  it('keeps distinct primitives on distinct signals', () => {
    expect(coerceSignal('Close')).not.toBe(coerceSignal('Schliessen'));
    expect(coerceSignal<string | number>('1')).not.toBe(coerceSignal<string | number>(1));
    expect(coerceSignal('Close')()).toBe('Close');
    expect(coerceSignal('Schliessen')()).toBe('Schliessen');
  });

  it('keeps evicting after a nullish value was wrapped', () => {
    expect(coerceSignal<string | null>(null)).toBe(coerceSignal<string | null>(null));
    const first = coerceSignal('after-nullish');
    for (let i = 0; i < 64; i++) {
      coerceSignal(`nullish-filler-${i}`);
    }
    expect(coerceSignal('after-nullish')).not.toBe(first);
  });

  it('reads the right value after a primitive was evicted', () => {
    const first = coerceSignal('evicted-first');
    for (let i = 0; i < 64; i++) {
      coerceSignal(`filler-${i}`);
    }
    const again = coerceSignal('evicted-first');
    expect(again).not.toBe(first);
    expect(again()).toBe('evicted-first');
    expect(first()).toBe('evicted-first');
  });
});
