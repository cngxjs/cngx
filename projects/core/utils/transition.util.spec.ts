import { describe, it, expect, vi, afterEach } from 'vitest';
import { hasTransition, onTransitionDone } from './transition.util';

function stubComputedStyle(duration: string, property = 'all', delay = '0s'): void {
  vi.spyOn(window, 'getComputedStyle').mockReturnValue({
    transitionDuration: duration,
    transitionProperty: property,
    transitionDelay: delay,
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

  it('picks the longest property by duration + delay, not duration alone', () => {
    // transform has the longer duration (0.3s) but opacity finishes last
    // (0.2s + 0.5s delay = 0.7s) - a themed delay must extend the wait.
    stubComputedStyle('0.2s, 0.3s', 'opacity, transform', '0.5s, 0s');
    const el = document.createElement('div');
    const onDone = vi.fn();

    onTransitionDone(el, onDone);

    el.dispatchEvent(transitionEnd('transform'));
    expect(onDone).not.toHaveBeenCalled();

    el.dispatchEvent(transitionEnd('opacity'));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('flush() completes idempotently and detaches the listener', () => {
    stubComputedStyle('0.2s', 'opacity');
    const el = document.createElement('div');
    const onDone = vi.fn();

    const handle = onTransitionDone(el, onDone);
    handle.flush();
    handle.flush();

    expect(onDone).toHaveBeenCalledTimes(1);
    // The listener is gone, so a late event cannot re-fire.
    el.dispatchEvent(transitionEnd('opacity'));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('cancel() tears down without invoking onDone', () => {
    vi.useFakeTimers();
    stubComputedStyle('0.2s', 'opacity');
    const el = document.createElement('div');
    const onDone = vi.fn();

    const handle = onTransitionDone(el, onDone);
    handle.cancel();

    // Neither a late transitionend nor the fallback timer may fire onDone.
    el.dispatchEvent(transitionEnd('opacity'));
    vi.advanceTimersByTime(1000);
    expect(onDone).not.toHaveBeenCalled();

    // A flush after cancel stays a no-op - the handle is settled.
    handle.flush();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('cancel() clears the pending fallback timer', () => {
    vi.useFakeTimers();
    stubComputedStyle('0.2s', 'opacity');
    const el = document.createElement('div');

    const handle = onTransitionDone(el, vi.fn());
    expect(vi.getTimerCount()).toBe(1);
    handle.cancel();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('falls back to a timer when transitionend never arrives', () => {
    vi.useFakeTimers();
    stubComputedStyle('0.2s', 'opacity');
    const el = document.createElement('div');
    const onDone = vi.fn();

    onTransitionDone(el, onDone);
    expect(onDone).not.toHaveBeenCalled();

    // Fallback timer is maxTotal (200ms) + 50ms.
    vi.advanceTimersByTime(250);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('sums duration and delay into the fallback timer', () => {
    vi.useFakeTimers();
    // 200ms duration + 300ms delay: the old duration-only timer (250ms)
    // would cut the transition short; the timer must wait 550ms.
    stubComputedStyle('0.2s', 'opacity', '0.3s');
    const el = document.createElement('div');
    const onDone = vi.fn();

    onTransitionDone(el, onDone);

    vi.advanceTimersByTime(500);
    expect(onDone).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('cycles shorter duration/delay lists against the property list like CSS', () => {
    vi.useFakeTimers();
    // Single duration/delay value applies to both properties per CSS
    // repetition; max total is 100ms + 400ms.
    stubComputedStyle('0.1s', 'opacity, transform', '0.4s');
    const el = document.createElement('div');
    const onDone = vi.fn();

    onTransitionDone(el, onDone);

    vi.advanceTimersByTime(500);
    expect(onDone).not.toHaveBeenCalled();
    vi.advanceTimersByTime(50);
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
