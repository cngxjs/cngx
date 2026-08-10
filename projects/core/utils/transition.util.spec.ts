import { describe, it, expect, vi, afterEach } from 'vitest';
import { hasTransition, onTransitionDone } from './transition.util';

function stubComputedStyle(duration: string, property = 'all'): void {
  vi.spyOn(window, 'getComputedStyle').mockReturnValue({
    transitionDuration: duration,
    transitionProperty: property,
  } as unknown as CSSStyleDeclaration);
}

function transitionEnd(propertyName: string): Event {
  const event = new Event('transitionend');
  Object.defineProperty(event, 'propertyName', { value: propertyName });
  return event;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('hasTransition', () => {
  it('is false when the only duration is zero', () => {
    stubComputedStyle('0s');
    expect(hasTransition(document.createElement('div'))).toBe(false);
  });

  it('is true for a single non-zero duration', () => {
    stubComputedStyle('0.2s');
    expect(hasTransition(document.createElement('div'))).toBe(true);
  });

  it('is true when any value in a multi-property duration is non-zero', () => {
    stubComputedStyle('0s, 0.3s');
    expect(hasTransition(document.createElement('div'))).toBe(true);
  });
});

describe('onTransitionDone', () => {
  it('fires onDone once when the longest property ends, ignoring shorter ones', () => {
    stubComputedStyle('0.2s, 0.3s', 'opacity, transform');
    const el = document.createElement('div');
    const onDone = vi.fn();

    onTransitionDone(el, onDone);

    el.dispatchEvent(transitionEnd('opacity'));
    expect(onDone).not.toHaveBeenCalled();

    el.dispatchEvent(transitionEnd('transform'));
    expect(onDone).toHaveBeenCalledTimes(1);

    el.dispatchEvent(transitionEnd('transform'));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('returns an idempotent cleanup that completes on first call only', () => {
    stubComputedStyle('0.2s', 'opacity');
    const el = document.createElement('div');
    const onDone = vi.fn();

    const cleanup = onTransitionDone(el, onDone);
    cleanup();
    cleanup();

    expect(onDone).toHaveBeenCalledTimes(1);
    // The listener is gone, so a late event cannot re-fire.
    el.dispatchEvent(transitionEnd('opacity'));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('falls back to a timer when transitionend never arrives', () => {
    vi.useFakeTimers();
    stubComputedStyle('0.2s', 'opacity');
    const el = document.createElement('div');
    const onDone = vi.fn();

    onTransitionDone(el, onDone);
    expect(onDone).not.toHaveBeenCalled();

    // Fallback timer is maxDuration (200ms) + 50ms.
    vi.advanceTimersByTime(250);
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
