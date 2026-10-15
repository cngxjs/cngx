import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createLiveRegionPair } from './live-region-pair';

const CLEAR_DELAY_MS = 16;

describe('createLiveRegionPair', () => {
  let container: HTMLElement;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
    vi.useRealTimers();
  });

  const region = (politeness: string) =>
    container.querySelector<HTMLElement>(`span[aria-live="${politeness}"]`);

  it('creates no node before the first announce or ensure()', () => {
    createLiveRegionPair(container, document);
    expect(container.children).toHaveLength(0);
  });

  it('creates both regions up front on ensure()', () => {
    const pair = createLiveRegionPair(container, document);
    pair.ensure();
    pair.ensure();
    expect(region('polite')?.getAttribute('aria-atomic')).toBe('true');
    expect(region('assertive')?.getAttribute('aria-atomic')).toBe('true');
    expect(container.children).toHaveLength(2);
  });

  it('writes each politeness into its own region, clear-then-set', () => {
    const pair = createLiveRegionPair(container, document);
    pair.announce('Saved', 'polite');
    pair.announce('Failed', 'assertive');
    expect(region('polite')?.textContent).toBe('');
    expect(region('assertive')?.textContent).toBe('');

    vi.advanceTimersByTime(CLEAR_DELAY_MS);
    expect(region('polite')?.textContent).toBe('Saved');
    expect(region('assertive')?.textContent).toBe('Failed');

    pair.announce('Saved', 'polite');
    expect(region('polite')?.textContent).toBe('');
    vi.advanceTimersByTime(CLEAR_DELAY_MS);
    expect(region('polite')?.textContent).toBe('Saved');
  });

  it('takePending() returns and cancels unwritten messages only', () => {
    const pair = createLiveRegionPair(container, document);
    pair.announce('Landed', 'polite');
    vi.advanceTimersByTime(CLEAR_DELAY_MS);
    pair.announce('Queued', 'assertive');

    expect(pair.takePending()).toEqual([{ message: 'Queued', politeness: 'assertive' }]);
    vi.advanceTimersByTime(CLEAR_DELAY_MS);
    expect(region('assertive')?.textContent).toBe('');
    expect(pair.takePending()).toEqual([]);
  });

  it('destroy() removes the regions and cancels pending writes', () => {
    const pair = createLiveRegionPair(container, document);
    pair.announce('Late', 'polite');
    const polite = region('polite');
    pair.destroy();
    vi.advanceTimersByTime(CLEAR_DELAY_MS);
    expect(container.children).toHaveLength(0);
    expect(polite?.textContent).toBe('');
  });
});
