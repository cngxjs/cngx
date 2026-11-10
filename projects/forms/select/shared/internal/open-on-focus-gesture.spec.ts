import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createOpenOnFocusGesture } from './open-on-focus-gesture';

type Mode = 'click' | 'focus' | 'click+focus' | undefined;

describe('createOpenOnFocusGesture', () => {
  let trigger: HTMLButtonElement;
  let other: HTMLButtonElement;

  beforeEach(() => {
    trigger = document.createElement('button');
    other = document.createElement('button');
    document.body.append(trigger, other);
  });

  afterEach(() => {
    trigger.remove();
    other.remove();
  });

  function setup(mode: Mode = 'focus') {
    const open = vi.fn();
    const gesture = createOpenOnFocusGesture({ openOn: () => mode, open });
    const press = (): void => {
      const event = new Event('pointerdown');
      Object.defineProperty(event, 'currentTarget', { value: trigger });
      gesture.handlePointerDown(event);
    };
    const click = (detail: number): boolean =>
      gesture.consumeClick(new MouseEvent('click', { detail }));
    return { gesture, open, press, click };
  }

  it('swallows the click of a press that started on an unfocused trigger', () => {
    const { gesture, open, press, click } = setup();
    other.focus();
    press();
    trigger.focus();
    gesture.handleFocus();
    expect(open).toHaveBeenCalledTimes(1);
    expect(click(1)).toBe(true);
    expect(click(1)).toBe(false);
  });

  it('does not swallow the click of a press on the focused trigger', () => {
    const { press, click } = setup();
    trigger.focus();
    press();
    expect(click(1)).toBe(false);
  });

  it('lets a later press overwrite a press that never clicked', () => {
    const { press, click } = setup();
    other.focus();
    press();
    trigger.focus();
    press();
    expect(click(1)).toBe(false);
  });

  it('never swallows a keyboard click', () => {
    const { press, click } = setup();
    other.focus();
    press();
    expect(click(0)).toBe(false);
  });

  it('swallows nothing in click mode', () => {
    const { gesture, open, press, click } = setup('click');
    other.focus();
    press();
    gesture.handleFocus();
    expect(open).not.toHaveBeenCalled();
    expect(click(1)).toBe(false);
  });
});
