import { describe, expect, it, vi } from 'vitest';

import { createActivationKeyHandler } from './activation-key';

function keydown(key: string): KeyboardEvent {
  return new KeyboardEvent('keydown', { key, cancelable: true });
}

describe('createActivationKeyHandler', () => {
  it('activates and cancels the key on a non-button host', () => {
    const activate = vi.fn();
    const handle = createActivationKeyHandler(document.createElement('div'), activate);
    const event = keydown(' ');

    handle(event);

    expect(activate).toHaveBeenCalledWith(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it('leaves the key to a native button, which activates through its click', () => {
    const activate = vi.fn();
    const handle = createActivationKeyHandler(document.createElement('button'), activate);
    const event = keydown('Enter');

    handle(event);

    expect(activate).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it('leaves Enter / Space from a focused descendant to that control', () => {
    const activate = vi.fn();
    const host = document.createElement('th');
    const inner = document.createElement('button');
    host.appendChild(inner);
    const handle = createActivationKeyHandler(host, activate);
    host.addEventListener('keydown', handle);

    for (const key of ['Enter', ' ']) {
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
      inner.dispatchEvent(event);
      expect(event.defaultPrevented, key).toBe(false);
    }
    expect(activate).not.toHaveBeenCalled();
  });

  it('activates once while Space is held: auto-repeat only cancels the scroll', () => {
    const activate = vi.fn();
    const handle = createActivationKeyHandler(document.createElement('div'), activate);
    const first = keydown(' ');
    const repeat = new KeyboardEvent('keydown', { key: ' ', cancelable: true, repeat: true });

    handle(first);
    handle(repeat);

    expect(activate).toHaveBeenCalledOnce();
    expect(repeat.defaultPrevented).toBe(true);
  });
});
