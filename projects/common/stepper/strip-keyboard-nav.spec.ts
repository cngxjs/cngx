import { signal } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';

import { createStepperStripKeyboardNav } from './strip-keyboard-nav';
import type { CngxStepperHost } from './stepper-host.token';

function makePresenter(orientation: 'horizontal' | 'vertical') {
  const selectNext = vi.fn();
  const selectPrevious = vi.fn();
  const select = vi.fn();
  const presenter = {
    orientation: signal(orientation),
    activeStepId: signal<string | null>('s1'),
    selectNext,
    selectPrevious,
    select,
  } as unknown as CngxStepperHost;
  return { presenter, selectNext, selectPrevious, select };
}

function keydown(key: string): KeyboardEvent {
  const target = document.createElement('button');
  target.className = 'cngx-stepper__step';
  const event = new KeyboardEvent('keydown', { key, cancelable: true });
  Object.defineProperty(event, 'target', { value: target });
  return event;
}

function build(presenter: CngxStepperHost, orientation?: () => 'horizontal' | 'vertical') {
  return createStepperStripKeyboardNav({
    presenter,
    hostElement: document.createElement('div'),
    flatStepCount: () => 3,
    stepButtonIdFor: (id) => `${id}-header`,
    orientation,
  });
}

describe('createStepperStripKeyboardNav orientation accessor', () => {
  it('vertical accessor: ArrowDown -> selectNext, ArrowUp -> selectPrevious', () => {
    const { presenter, selectNext, selectPrevious } = makePresenter('horizontal');
    const handler = build(presenter, () => 'vertical');
    handler(keydown('ArrowDown'));
    handler(keydown('ArrowUp'));
    expect(selectNext).toHaveBeenCalledTimes(1);
    expect(selectPrevious).toHaveBeenCalledTimes(1);
  });

  it('vertical accessor: ArrowRight / ArrowLeft are inert', () => {
    const { presenter, selectNext, selectPrevious } = makePresenter('horizontal');
    const handler = build(presenter, () => 'vertical');
    handler(keydown('ArrowRight'));
    handler(keydown('ArrowLeft'));
    expect(selectNext).not.toHaveBeenCalled();
    expect(selectPrevious).not.toHaveBeenCalled();
  });

  it('omitted accessor falls back to presenter.orientation() (horizontal)', () => {
    const { presenter, selectNext } = makePresenter('horizontal');
    const handler = build(presenter);
    handler(keydown('ArrowRight'));
    expect(selectNext).toHaveBeenCalledTimes(1);
    // Vertical key is ignored while the resolved axis is horizontal.
    handler(keydown('ArrowDown'));
    expect(selectNext).toHaveBeenCalledTimes(1);
  });

  it('accessor wins over the presenter orientation when both are set', () => {
    // presenter says vertical, accessor forces horizontal.
    const { presenter, selectNext } = makePresenter('vertical');
    const handler = build(presenter, () => 'horizontal');
    handler(keydown('ArrowRight'));
    expect(selectNext).toHaveBeenCalledTimes(1);
    handler(keydown('ArrowDown'));
    expect(selectNext).toHaveBeenCalledTimes(1);
  });
});
