// @vitest-environment jsdom
import { signal } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';

import { createTabKeyboardNav } from './tab-keyboard-nav';
import type { CngxTabGroupHost, CngxTabHandle } from '../tab-group-host.token';

function handle(id: string, disabled = false): CngxTabHandle {
  return {
    id,
    label: signal(id),
    disabled: signal(disabled),
    closable: signal(undefined),
    errorAggregator: signal(undefined),
  } as unknown as CngxTabHandle;
}

interface FakeHostOptions {
  readonly active?: number;
  readonly orientation?: 'horizontal' | 'vertical';
  readonly loop?: boolean;
}

function makeHost(handles: readonly CngxTabHandle[], opts: FakeHostOptions = {}) {
  const active = signal(opts.active ?? 0);
  // Mimic automatic activation: select() commits the index synchronously.
  const select = vi.fn((index: number) => active.set(index));
  const host = {
    tabs: signal(handles),
    activeIndex: active,
    activeId: () => {
      const clamped = Math.max(0, Math.min(active(), handles.length - 1));
      return handles[clamped]?.id ?? null;
    },
    orientation: signal(opts.orientation ?? 'horizontal'),
    loop: signal(opts.loop ?? true),
    select,
  } as unknown as CngxTabGroupHost;
  return { host, active, select };
}

function makeDom(count: number): { el: HTMLElement; buttons: HTMLButtonElement[] } {
  const el = document.createElement('div');
  const buttons: HTMLButtonElement[] = [];
  for (let i = 0; i < count; i++) {
    const b = document.createElement('button');
    b.className = 'cngx-tabs__tab';
    el.appendChild(b);
    buttons.push(b);
  }
  document.body.appendChild(el);
  return { el, buttons };
}

function press(key: string): KeyboardEvent {
  return new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
}

describe('createTabKeyboardNav', () => {
  it('derives the roving tab stop from activeId (active = 0, rest = -1)', () => {
    const handles = [handle('a'), handle('b'), handle('c')];
    const { host } = makeHost(handles, { active: 1 });
    const { el } = makeDom(3);
    const nav = createTabKeyboardNav({ host, hostElement: el });
    expect(handles.map((h) => nav.tabTabindex(h))).toEqual([-1, 0, -1]);
  });

  it('ArrowRight activates the next tab and focuses its button', () => {
    const handles = [handle('a'), handle('b'), handle('c')];
    const { host, select } = makeHost(handles);
    const { el, buttons } = makeDom(3);
    const nav = createTabKeyboardNav({ host, hostElement: el });
    const ev = press('ArrowRight');
    nav.handleKeydown(ev);
    expect(ev.defaultPrevented).toBe(true);
    expect(select).toHaveBeenCalledWith(1);
    expect(document.activeElement).toBe(buttons[1]);
  });

  it('ArrowLeft from the first tab wraps to the last when loop is on', () => {
    const handles = [handle('a'), handle('b'), handle('c')];
    const { host, select } = makeHost(handles, { loop: true });
    const { el, buttons } = makeDom(3);
    const nav = createTabKeyboardNav({ host, hostElement: el });
    nav.handleKeydown(press('ArrowLeft'));
    expect(select).toHaveBeenCalledWith(2);
    expect(document.activeElement).toBe(buttons[2]);
  });

  it('ArrowLeft at the first tab is a no-op when loop is off', () => {
    const handles = [handle('a'), handle('b')];
    const { host, select } = makeHost(handles, { loop: false });
    const { el } = makeDom(2);
    const nav = createTabKeyboardNav({ host, hostElement: el });
    const ev = press('ArrowLeft');
    nav.handleKeydown(ev);
    expect(select).not.toHaveBeenCalled();
    expect(ev.defaultPrevented).toBe(false);
  });

  it('skips disabled tabs', () => {
    const handles = [handle('a'), handle('b', true), handle('c')];
    const { host, select } = makeHost(handles);
    const { el } = makeDom(3);
    const nav = createTabKeyboardNav({ host, hostElement: el });
    nav.handleKeydown(press('ArrowRight'));
    expect(select).toHaveBeenCalledWith(2);
  });

  it('Home/End jump to the first/last enabled tab', () => {
    const handles = [handle('a'), handle('b'), handle('c')];
    const { host, select } = makeHost(handles, { active: 1 });
    const { el } = makeDom(3);
    const nav = createTabKeyboardNav({ host, hostElement: el });
    nav.handleKeydown(press('End'));
    expect(select).toHaveBeenLastCalledWith(2);
    nav.handleKeydown(press('Home'));
    expect(select).toHaveBeenLastCalledWith(0);
  });

  it('vertical orientation uses ArrowUp/Down and ignores ArrowLeft/Right', () => {
    const handles = [handle('a'), handle('b')];
    const { host, select } = makeHost(handles, { orientation: 'vertical' });
    const { el } = makeDom(2);
    const nav = createTabKeyboardNav({ host, hostElement: el });
    const ignored = press('ArrowRight');
    nav.handleKeydown(ignored);
    expect(ignored.defaultPrevented).toBe(false);
    expect(select).not.toHaveBeenCalled();
    nav.handleKeydown(press('ArrowDown'));
    expect(select).toHaveBeenCalledWith(1);
  });

  it('ignores keys it does not own', () => {
    const handles = [handle('a'), handle('b')];
    const { host, select } = makeHost(handles);
    const { el } = makeDom(2);
    const nav = createTabKeyboardNav({ host, hostElement: el });
    const ev = press('Enter');
    nav.handleKeydown(ev);
    expect(select).not.toHaveBeenCalled();
    expect(ev.defaultPrevented).toBe(false);
  });
});
