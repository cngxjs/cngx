// @vitest-environment jsdom
import { signal } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';

import { createStepperStripKeyboardNav } from './strip-keyboard-nav';
import type { CngxStepperHost } from './stepper-host.token';

interface FakeHostOptions {
  readonly activeId?: string;
  readonly orientation?: 'horizontal' | 'vertical';
  readonly busy?: boolean;
  readonly stepIds?: readonly string[];
  readonly disabledIds?: readonly string[];
}

function makeHost(opts: FakeHostOptions = {}) {
  const selectNext = vi.fn();
  const selectPrevious = vi.fn();
  const select = vi.fn();
  const stepIds = opts.stepIds ?? ['s0', 's1', 's2'];
  const disabled = new Set(opts.disabledIds ?? []);
  const host = {
    activeStepId: signal<string | null>(opts.activeId ?? 's0'),
    orientation: signal(opts.orientation ?? 'horizontal'),
    busy: signal(opts.busy ?? false),
    intendedStepIndex: signal<number | undefined>(undefined),
    stepsOnly: signal(
      stepIds.map((id) => ({ id, disabled: () => disabled.has(id) })),
    ),
    selectNext,
    selectPrevious,
    select,
  } as unknown as CngxStepperHost;
  return { host, selectNext, selectPrevious, select };
}

function makeStrip(): { el: HTMLElement; button: HTMLButtonElement } {
  const el = document.createElement('div');
  const button = document.createElement('button');
  button.className = 'cngx-stepper__step';
  button.id = 's0-header';
  el.appendChild(button);
  document.body.appendChild(el);
  return { el, button };
}

function nav(host: CngxStepperHost, el: HTMLElement, direction: 'ltr' | 'rtl') {
  return createStepperStripKeyboardNav({
    presenter: host,
    hostElement: el,
    direction: signal<'ltr' | 'rtl'>(direction),
    stepButtonIdFor: (id) => `${id}-header`,
  });
}

// Dispatch a keydown on the step button so `event.target` carries the
// strip class the handler gates on, then bubbles to the host listener.
function press(
  el: HTMLElement,
  button: HTMLElement,
  handler: (event: KeyboardEvent) => void,
  key: string,
): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  el.addEventListener('keydown', handler, { once: true });
  button.dispatchEvent(event);
  return event;
}

describe('createStepperStripKeyboardNav (horizontal, ltr)', () => {
  it('ArrowRight advances, ArrowLeft retreats', () => {
    const { host, selectNext, selectPrevious } = makeHost();
    const { el, button } = makeStrip();
    const handler = nav(host, el, 'ltr');

    const next = press(el, button, handler, 'ArrowRight');
    expect(selectNext).toHaveBeenCalledOnce();
    expect(next.defaultPrevented).toBe(true);

    press(el, button, handler, 'ArrowLeft');
    expect(selectPrevious).toHaveBeenCalledOnce();
  });

  it('Home jumps to the first step, End to the last', () => {
    const { host, select } = makeHost();
    const { el, button } = makeStrip();
    const handler = nav(host, el, 'ltr');

    press(el, button, handler, 'Home');
    expect(select).toHaveBeenCalledWith(0);
    press(el, button, handler, 'End');
    expect(select).toHaveBeenCalledWith(2);
  });
});

describe('createStepperStripKeyboardNav (horizontal, rtl)', () => {
  it('ArrowLeft advances, ArrowRight retreats', () => {
    const { host, selectNext, selectPrevious } = makeHost();
    const { el, button } = makeStrip();
    const handler = nav(host, el, 'rtl');

    press(el, button, handler, 'ArrowLeft');
    expect(selectNext).toHaveBeenCalledOnce();

    press(el, button, handler, 'ArrowRight');
    expect(selectPrevious).toHaveBeenCalledOnce();
  });

  it('Home/End stay direction-invariant', () => {
    const { host, select } = makeHost();
    const { el, button } = makeStrip();
    const handler = nav(host, el, 'rtl');

    press(el, button, handler, 'Home');
    expect(select).toHaveBeenCalledWith(0);
    press(el, button, handler, 'End');
    expect(select).toHaveBeenCalledWith(2);
  });
});

describe('createStepperStripKeyboardNav (vertical) is direction-invariant', () => {
  for (const direction of ['ltr', 'rtl'] as const) {
    it(`ArrowDown advances and ArrowUp retreats under ${direction}`, () => {
      const { host, selectNext, selectPrevious } = makeHost({ orientation: 'vertical' });
      const { el, button } = makeStrip();
      const handler = nav(host, el, direction);

      press(el, button, handler, 'ArrowDown');
      expect(selectNext).toHaveBeenCalledOnce();

      press(el, button, handler, 'ArrowUp');
      expect(selectPrevious).toHaveBeenCalledOnce();
    });
  }
});

describe('createStepperStripKeyboardNav - busy gate and disabled-skip', () => {
  it('swallows the back-arrow while a commit is in flight', () => {
    const { host, selectPrevious } = makeHost({ busy: true });
    const { el, button } = makeStrip();
    const handler = nav(host, el, 'ltr');

    const event = press(el, button, handler, 'ArrowLeft');
    expect(event.defaultPrevented).toBe(true);
    expect(selectPrevious).not.toHaveBeenCalled();
  });

  it('Home skips leading disabled steps, End skips trailing ones', () => {
    const { host, select } = makeHost({ disabledIds: ['s0', 's2'] });
    const { el, button } = makeStrip();
    const handler = nav(host, el, 'ltr');

    press(el, button, handler, 'Home');
    expect(select).toHaveBeenCalledWith(1);
    press(el, button, handler, 'End');
    expect(select).toHaveBeenLastCalledWith(1);
  });
});
