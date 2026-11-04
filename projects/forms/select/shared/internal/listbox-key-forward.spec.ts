import { signal, type Signal } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';

import type { CngxListbox } from '@cngx/common/interactive';

import { createListboxKeyForward } from './listbox-key-forward';

const ref = (ad: unknown): Signal<CngxListbox | undefined> =>
  signal({ ad } as unknown as CngxListbox);

function keydown(key: string, over: Partial<{ isComposing: boolean; keyCode: number }> = {}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  if (over.isComposing !== undefined) {
    Object.defineProperty(event, 'isComposing', { value: over.isComposing });
  }
  if (over.keyCode !== undefined) {
    Object.defineProperty(event, 'keyCode', { value: over.keyCode });
  }
  return event;
}

function makeAd() {
  return {
    highlightNext: vi.fn(),
    highlightPrev: vi.fn(),
    activateCurrent: vi.fn(),
    highlightFirst: vi.fn(),
    highlightLast: vi.fn(),
  };
}

// A signature that includes the homeEnd option the fix adds. The cast lets the
// RED spec compile against the current two-arg forwarder; Phase 4 widens the
// real signature and the Home/End cases flip green.
type ForwardWithOpts = (
  ref: Signal<CngxListbox | undefined>,
  escape: () => void,
  opts?: { homeEnd?: 'listbox' | 'caret' },
) => (event: KeyboardEvent) => void;

describe('createListboxKeyForward', () => {
  it('forwards ArrowDown and ArrowUp to the active descendant', () => {
    const ad = makeAd();
    const fw = createListboxKeyForward(ref(ad), () => undefined);
    fw(keydown('ArrowDown'));
    fw(keydown('ArrowUp'));
    expect(ad.highlightNext).toHaveBeenCalledTimes(1);
    expect(ad.highlightPrev).toHaveBeenCalledTimes(1);
  });

  it('activates the current option on a plain Enter', () => {
    const ad = makeAd();
    const fw = createListboxKeyForward(ref(ad), () => undefined);
    fw(keydown('Enter'));
    expect(ad.activateCurrent).toHaveBeenCalledTimes(1);
  });

  // A4: an Enter that closes an IME composition must not commit the option.
  it.fails('ignores an Enter while an IME composition is active', () => {
    const ad = makeAd();
    const fw = createListboxKeyForward(ref(ad), () => undefined);
    fw(keydown('Enter', { isComposing: true }));
    expect(ad.activateCurrent).not.toHaveBeenCalled();
  });

  it.fails('ignores an Enter with the legacy IME keyCode 229', () => {
    const ad = makeAd();
    const fw = createListboxKeyForward(ref(ad), () => undefined);
    fw(keydown('Enter', { keyCode: 229 }));
    expect(ad.activateCurrent).not.toHaveBeenCalled();
  });

  // select-search promises Home / End move the listbox highlight (homeEnd: 'listbox').
  it.fails('moves the highlight to the first option on Home with homeEnd listbox', () => {
    const ad = makeAd();
    const forward = createListboxKeyForward as unknown as ForwardWithOpts;
    const fw = forward(ref(ad), () => undefined, { homeEnd: 'listbox' });
    fw(keydown('Home'));
    expect(ad.highlightFirst).toHaveBeenCalledTimes(1);
  });

  it.fails('moves the highlight to the last option on End with homeEnd listbox', () => {
    const ad = makeAd();
    const forward = createListboxKeyForward as unknown as ForwardWithOpts;
    const fw = forward(ref(ad), () => undefined, { homeEnd: 'listbox' });
    fw(keydown('End'));
    expect(ad.highlightLast).toHaveBeenCalledTimes(1);
  });
});
