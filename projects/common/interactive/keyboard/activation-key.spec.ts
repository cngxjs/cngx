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
});
