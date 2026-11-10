import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createInputHostHandlers, type CngxInputHostHandlersOptions } from './input-host-handlers';

type Mode = 'click' | 'focus' | 'click+focus' | undefined;

describe('createInputHostHandlers', () => {
  let host: HTMLElement;
  let input: HTMLInputElement;
  let chipRemove: HTMLButtonElement;
  let panelButton: HTMLButtonElement;
  let outside: HTMLButtonElement;

  beforeEach(() => {
    host = document.createElement('div');
    input = document.createElement('input');
    chipRemove = document.createElement('button');
    chipRemove.className = 'nested';
    panelButton = document.createElement('button');
    host.append(input, chipRemove, panelButton);
    outside = document.createElement('button');
    document.body.append(host, outside);
  });

  afterEach(() => {
    host.remove();
    outside.remove();
  });

  interface SetupOptions {
    mode?: Mode;
    suppressed?: boolean;
    disabled?: boolean;
    panelOpen?: boolean;
    clearOnBlur?: boolean;
    retryFn?: (() => void) | null;
    withBlurLeave?: boolean;
    nestedInteractive?: string;
  }

  function setup(o: SetupOptions = {}) {
    const calls: string[] = [];
    const markFocused = vi.fn(() => calls.push('markFocused'));
    const markBlurred = vi.fn(() => calls.push('markBlurred'));
    const refocusOwnerBeforeRemoval = vi.fn(() => calls.push('refocus'));
    const open = vi.fn();
    const focus = vi.fn();
    const onLeave = vi.fn();
    const retry = vi.fn(() => calls.push('retry'));
    const retryFn = o.retryFn === undefined ? null : o.retryFn;
    const opts: CngxInputHostHandlersOptions = {
      focusState: { markFocused, markBlurred },
      focusWithin: { refocusOwnerBeforeRemoval },
      openOn: () => o.mode,
      open,
      suppressOpenOnFocus: () => o.suppressed ?? false,
      disabled: () => o.disabled ?? false,
      panelOpen: () => o.panelOpen ?? false,
      focus,
      inputEl: () => input,
      nestedInteractive: o.nestedInteractive,
      blurLeave:
        o.withBlurLeave === false
          ? undefined
          : { host, clearOnBlur: () => o.clearOnBlur ?? true, onLeave },
      retryFn: () => retryFn,
      retry,
    };
    return {
      handlers: createInputHostHandlers(opts),
      calls,
      markFocused,
      markBlurred,
      open,
      focus,
      onLeave,
      retry,
      retryFn,
    };
  }

  function blurTo(related: Element | null): FocusEvent {
    return new FocusEvent('blur', { relatedTarget: related });
  }

  describe('handleFocus', () => {
    it.each<Mode>(['focus', 'click+focus'])('marks focused and opens under openOn %s', (mode) => {
      const { handlers, markFocused, open } = setup({ mode });
      handlers.handleFocus();
      expect(markFocused).toHaveBeenCalledTimes(1);
      expect(open).toHaveBeenCalledTimes(1);
    });

    it.each<Mode>(['click', undefined])('marks focused without opening under openOn %s', (mode) => {
      const { handlers, markFocused, open } = setup({ mode });
      handlers.handleFocus();
      expect(markFocused).toHaveBeenCalledTimes(1);
      expect(open).not.toHaveBeenCalled();
    });

    it('does not open while the post-close focus restore suppresses it', () => {
      const { handlers, markFocused, open } = setup({ mode: 'focus', suppressed: true });
      handlers.handleFocus();
      expect(markFocused).toHaveBeenCalledTimes(1);
      expect(open).not.toHaveBeenCalled();
    });
  });

  describe('handleBlur', () => {
    it('runs the variant callback when focus leaves the host', () => {
      const { handlers, markBlurred, onLeave } = setup();
      handlers.handleBlur(blurTo(outside));
      expect(markBlurred).toHaveBeenCalledTimes(1);
      expect(onLeave).toHaveBeenCalledTimes(1);
    });

    it('runs the variant callback when there is no related target', () => {
      const { handlers, onLeave } = setup();
      handlers.handleBlur(blurTo(null));
      expect(onLeave).toHaveBeenCalledTimes(1);
      handlers.handleBlur();
      expect(onLeave).toHaveBeenCalledTimes(2);
    });

    it('keeps the state when focus moves to an element inside the host', () => {
      const { handlers, markBlurred, onLeave } = setup();
      handlers.handleBlur(blurTo(panelButton));
      expect(markBlurred).toHaveBeenCalledTimes(1);
      expect(onLeave).not.toHaveBeenCalled();
    });

    it('skips the variant callback when clearOnBlur is false', () => {
      const { handlers, markBlurred, onLeave } = setup({ clearOnBlur: false });
      handlers.handleBlur(blurTo(outside));
      expect(markBlurred).toHaveBeenCalledTimes(1);
      expect(onLeave).not.toHaveBeenCalled();
    });

    it('only marks blurred for a variant without a post-blur action', () => {
      const { handlers, markBlurred, onLeave } = setup({ withBlurLeave: false });
      handlers.handleBlur(blurTo(outside));
      expect(markBlurred).toHaveBeenCalledTimes(1);
      expect(onLeave).not.toHaveBeenCalled();
    });
  });

  describe('handleRetry', () => {
    it('refocuses the owner, runs retryFn, then emits retry', () => {
      const retryFn = vi.fn();
      const { handlers, calls } = setup({
        retryFn: () => {
          calls.push('retryFn');
          retryFn();
        },
      });
      handlers.handleRetry();
      expect(retryFn).toHaveBeenCalledTimes(1);
      expect(calls).toEqual(['refocus', 'retryFn', 'retry']);
    });

    it('still refocuses and emits when no retryFn is set', () => {
      const { handlers, calls } = setup({ retryFn: null });
      handlers.handleRetry();
      expect(calls).toEqual(['refocus', 'retry']);
    });
  });

  describe('handleWrapperClick', () => {
    it('focuses the input and opens a closed panel', () => {
      const { handlers, focus, open } = setup();
      handlers.handleWrapperClick(new MouseEvent('click'));
      expect(focus).toHaveBeenCalledTimes(1);
      expect(open).toHaveBeenCalledTimes(1);
    });

    it('focuses without reopening an open panel', () => {
      const { handlers, focus, open } = setup({ panelOpen: true });
      handlers.handleWrapperClick();
      expect(focus).toHaveBeenCalledTimes(1);
      expect(open).not.toHaveBeenCalled();
    });

    it('does nothing while disabled', () => {
      const { handlers, focus, open } = setup({ disabled: true });
      handlers.handleWrapperClick(new MouseEvent('click'));
      expect(focus).not.toHaveBeenCalled();
      expect(open).not.toHaveBeenCalled();
    });

    describe('with nestedInteractive', () => {
      function clickOn(target: Element): MouseEvent {
        const event = new MouseEvent('click', { bubbles: true });
        target.dispatchEvent(event);
        return event;
      }

      it('leaves a click on a nested control alone', () => {
        const { handlers, focus, open } = setup({ nestedInteractive: '.nested' });
        handlers.handleWrapperClick(clickOn(chipRemove));
        expect(focus).not.toHaveBeenCalled();
        expect(open).not.toHaveBeenCalled();
      });

      it('still opens on a click on the own input although it matches the selector', () => {
        const { handlers, focus, open } = setup({ nestedInteractive: 'input, .nested' });
        handlers.handleWrapperClick(clickOn(input));
        expect(focus).toHaveBeenCalledTimes(1);
        expect(open).toHaveBeenCalledTimes(1);
      });

      it('opens on a click that matches no nested control', () => {
        const { handlers, open } = setup({ nestedInteractive: '.nested' });
        handlers.handleWrapperClick(clickOn(host));
        expect(open).toHaveBeenCalledTimes(1);
      });
    });

    it('ignores the click target when no nestedInteractive selector is given', () => {
      const { handlers, open } = setup();
      const event = new MouseEvent('click', { bubbles: true });
      chipRemove.dispatchEvent(event);
      handlers.handleWrapperClick(event);
      expect(open).toHaveBeenCalledTimes(1);
    });
  });
});
