import { signal, type WritableSignal } from '@angular/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createAccordionKeyboardNav,
  type CngxAccordionHeaderHandle,
  type CngxAccordionKeyboardNavHost,
} from './accordion-keyboard-nav';

interface FakeHeader extends CngxAccordionHeaderHandle {
  readonly disabledState: WritableSignal<boolean>;
}

describe('createAccordionKeyboardNav', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  function makeHeader(id: string, disabled = false): FakeHeader {
    const element = document.createElement('button');
    element.type = 'button';
    element.setAttribute('data-id', id);
    container.appendChild(element);
    const disabledState = signal(disabled);
    return { id, element, disabled: disabledState, disabledState };
  }

  function makeHost(headers: readonly FakeHeader[]) {
    const rovingActiveId = signal<string | null>(headers[0]?.id ?? null);
    const host: CngxAccordionKeyboardNavHost = {
      headers: signal(headers).asReadonly(),
      rovingActiveId: rovingActiveId.asReadonly(),
      setRovingActive: (id) => rovingActiveId.set(id),
    };
    const nav = createAccordionKeyboardNav({ host });
    return { host, nav, rovingActiveId };
  }

  function keydown(key: string): KeyboardEvent {
    return new KeyboardEvent('keydown', { key, cancelable: true });
  }

  it('makes only the roving-active header a tab stop', () => {
    const headers = [makeHeader('a'), makeHeader('b'), makeHeader('c')];
    const { nav } = makeHost(headers);
    expect(nav.headerTabindex(headers[0])).toBe(0);
    expect(nav.headerTabindex(headers[1])).toBe(-1);
    expect(nav.headerTabindex(headers[2])).toBe(-1);
  });

  it('ArrowDown moves focus and the roving stop to the next header', () => {
    const headers = [makeHeader('a'), makeHeader('b'), makeHeader('c')];
    const { nav, rovingActiveId } = makeHost(headers);
    nav.handleKeydown(keydown('ArrowDown'));
    expect(rovingActiveId()).toBe('b');
    expect(document.activeElement).toBe(headers[1].element);
    expect(nav.headerTabindex(headers[1])).toBe(0);
  });

  it('ArrowUp loops from the first header to the last', () => {
    const headers = [makeHeader('a'), makeHeader('b'), makeHeader('c')];
    const { nav, rovingActiveId } = makeHost(headers);
    nav.handleKeydown(keydown('ArrowUp'));
    expect(rovingActiveId()).toBe('c');
    expect(document.activeElement).toBe(headers[2].element);
  });

  it('ArrowDown skips a disabled header', () => {
    const headers = [makeHeader('a'), makeHeader('b', true), makeHeader('c')];
    const { nav, rovingActiveId } = makeHost(headers);
    nav.handleKeydown(keydown('ArrowDown'));
    expect(rovingActiveId()).toBe('c');
    expect(document.activeElement).toBe(headers[2].element);
  });

  it('Home / End jump to the first / last enabled header', () => {
    const headers = [makeHeader('a'), makeHeader('b'), makeHeader('c', true)];
    const { nav, rovingActiveId } = makeHost(headers);
    nav.handleKeydown(keydown('End'));
    expect(rovingActiveId()).toBe('b');
    nav.handleKeydown(keydown('Home'));
    expect(rovingActiveId()).toBe('a');
  });

  it('roves in DOM order even when headers register out of order', () => {
    // Register b before a, but a precedes b in the document. compareDocumentPosition
    // must win so ArrowDown from a lands on b, not on whatever registered next.
    const a = makeHeader('a');
    const b = makeHeader('b');
    const { nav, host } = makeHost([b, a]);
    host.setRovingActive('a');
    nav.handleKeydown(keydown('ArrowDown'));
    expect(host.rovingActiveId()).toBe('b');
    expect(document.activeElement).toBe(b.element);
  });

  it('preventDefault on a handled key, no-op on others', () => {
    const headers = [makeHeader('a'), makeHeader('b')];
    const { nav } = makeHost(headers);
    const handled = keydown('ArrowDown');
    const prevent = vi.spyOn(handled, 'preventDefault');
    nav.handleKeydown(handled);
    expect(prevent).toHaveBeenCalledOnce();

    const ignored = keydown('Tab');
    const preventIgnored = vi.spyOn(ignored, 'preventDefault');
    nav.handleKeydown(ignored);
    expect(preventIgnored).not.toHaveBeenCalled();
  });
});
