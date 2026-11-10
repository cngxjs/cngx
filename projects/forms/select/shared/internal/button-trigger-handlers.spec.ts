import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createButtonTriggerHandlers,
  type CngxButtonTriggerHandlersOptions,
} from './button-trigger-handlers';

type Mode = 'click' | 'focus' | 'click+focus' | undefined;

describe('createButtonTriggerHandlers', () => {
  let trigger: HTMLButtonElement;

  beforeEach(() => {
    trigger = document.createElement('button');
    document.body.append(trigger);
  });

  afterEach(() => {
    trigger.remove();
  });

  interface SetupOptions {
    mode?: Mode;
    suppressed?: boolean;
    disabled?: boolean;
  }

  function setup(o: SetupOptions = {}) {
    const markFocused = vi.fn();
    const markBlurred = vi.fn();
    const open = vi.fn();
    const toggle = vi.fn();
    const opts: CngxButtonTriggerHandlersOptions = {
      focusState: { markFocused, markBlurred },
      openOn: () => o.mode,
      open,
      toggle,
      suppressOpenOnFocus: () => o.suppressed ?? false,
      disabled: () => o.disabled ?? false,
    };
    return { handlers: createButtonTriggerHandlers(opts), markFocused, markBlurred, open, toggle };
  }

  function pointerDown(handler: (event: Event) => void): void {
    const event = new Event('pointerdown');
    Object.defineProperty(event, 'currentTarget', { value: trigger });
    handler(event);
  }

  function click(detail: number): MouseEvent {
    return new MouseEvent('click', { detail });
  }

  describe('handleTriggerClick', () => {
    it('toggles on a plain click', () => {
      const { handlers, toggle } = setup({ mode: 'click' });
      handlers.handleTriggerClick(click(1));
      expect(toggle).toHaveBeenCalledTimes(1);
    });

    it('ignores the click while disabled', () => {
      const { handlers, toggle } = setup({ disabled: true });
      handlers.handleTriggerClick(click(1));
      expect(toggle).not.toHaveBeenCalled();
    });

    it('skips toggle for the click of a press that focus-opened the panel', () => {
      const { handlers, toggle } = setup({ mode: 'focus' });
      pointerDown(handlers.handlePointerDown);
      handlers.handleTriggerClick(click(1));
      expect(toggle).not.toHaveBeenCalled();
    });

    it('toggles on the next click after a swallowed one', () => {
      const { handlers, toggle } = setup({ mode: 'click+focus' });
      pointerDown(handlers.handlePointerDown);
      handlers.handleTriggerClick(click(1));
      handlers.handleTriggerClick(click(1));
      expect(toggle).toHaveBeenCalledTimes(1);
    });

    it('toggles on a keyboard click even in a focus-open mode', () => {
      const { handlers, toggle } = setup({ mode: 'focus' });
      pointerDown(handlers.handlePointerDown);
      handlers.handleTriggerClick(click(0));
      expect(toggle).toHaveBeenCalledTimes(1);
    });

    it('toggles when the press starts on an already focused trigger', () => {
      const { handlers, toggle } = setup({ mode: 'focus' });
      trigger.focus();
      pointerDown(handlers.handlePointerDown);
      handlers.handleTriggerClick(click(1));
      expect(toggle).toHaveBeenCalledTimes(1);
    });

    it('toggles when the mode is click only', () => {
      const { handlers, toggle } = setup({ mode: 'click' });
      pointerDown(handlers.handlePointerDown);
      handlers.handleTriggerClick(click(1));
      expect(toggle).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleFocus', () => {
    it('marks focused without opening under openOn click', () => {
      const { handlers, markFocused, open } = setup({ mode: 'click' });
      handlers.handleFocus();
      expect(markFocused).toHaveBeenCalledTimes(1);
      expect(open).not.toHaveBeenCalled();
    });

    it.each<Mode>(['focus', 'click+focus'])('opens under openOn %s', (mode) => {
      const { handlers, markFocused, open } = setup({ mode });
      handlers.handleFocus();
      expect(markFocused).toHaveBeenCalledTimes(1);
      expect(open).toHaveBeenCalledTimes(1);
    });

    it('does not open when openOn is unset', () => {
      const { handlers, open } = setup();
      handlers.handleFocus();
      expect(open).not.toHaveBeenCalled();
    });

    it('marks focused but does not open while the post-close restore is suppressed', () => {
      const { handlers, markFocused, open } = setup({ mode: 'focus', suppressed: true });
      handlers.handleFocus();
      expect(markFocused).toHaveBeenCalledTimes(1);
      expect(open).not.toHaveBeenCalled();
    });
  });

  describe('handleBlur', () => {
    it('marks the trigger blurred and does nothing else', () => {
      const { handlers, markBlurred, open, toggle } = setup({ mode: 'focus' });
      handlers.handleBlur();
      expect(markBlurred).toHaveBeenCalledTimes(1);
      expect(open).not.toHaveBeenCalled();
      expect(toggle).not.toHaveBeenCalled();
    });
  });
});
