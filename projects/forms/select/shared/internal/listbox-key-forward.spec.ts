import { signal } from '@angular/core';
import type { CngxListbox } from '@cngx/common/interactive';
import { describe, expect, it, vi } from 'vitest';

import { createListboxKeyForward } from './listbox-key-forward';

function setup() {
  const ad = {
    highlightNext: vi.fn(),
    highlightPrev: vi.fn(),
    highlightFirst: vi.fn(),
    highlightLast: vi.fn(),
    activateCurrent: vi.fn(),
  };
  const listboxRef = signal<CngxListbox | undefined>({ ad } as unknown as CngxListbox);
  const escape = vi.fn();
  const handle = createListboxKeyForward(listboxRef, escape);
  return { ad, listboxRef, escape, handle };
}

function key(name: string): KeyboardEvent {
  return new KeyboardEvent('keydown', { key: name, cancelable: true });
}

describe('createListboxKeyForward', () => {
  it.each([
    ['ArrowDown', 'highlightNext'],
    ['ArrowUp', 'highlightPrev'],
    ['Enter', 'activateCurrent'],
  ] as const)('%s calls ad.%s and prevents the default', (name, method) => {
    const { ad, handle } = setup();
    const event = key(name);
    handle(event);
    expect(ad[method]).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it('Escape calls the escape callback and prevents the default', () => {
    const { escape, handle } = setup();
    const event = key('Escape');
    handle(event);
    expect(escape).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it.each(['Home', 'End'])('leaves %s to the input caret', (name) => {
    const { ad, handle } = setup();
    const event = key(name);
    handle(event);
    expect(event.defaultPrevented).toBe(false);
    expect(ad.highlightFirst).not.toHaveBeenCalled();
    expect(ad.highlightLast).not.toHaveBeenCalled();
  });

  it('leaves other keys alone', () => {
    const { ad, escape, handle } = setup();
    const event = key('a');
    handle(event);
    expect(event.defaultPrevented).toBe(false);
    expect(escape).not.toHaveBeenCalled();
    expect(ad.highlightNext).not.toHaveBeenCalled();
  });

  it('is a no-op without a listbox, Escape included', () => {
    const { listboxRef, escape, handle } = setup();
    listboxRef.set(undefined);
    const event = key('Escape');
    handle(event);
    expect(escape).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });
});
