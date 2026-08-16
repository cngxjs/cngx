import { parseKeyCombo } from '@cngx/core/utils';
import { describe, expect, it, vi } from 'vitest';

import { createPaletteKeybinding } from './palette-keybinding';

describe('createPaletteKeybinding', () => {
  it('calls onOpen when the combo is pressed', () => {
    const onOpen = vi.fn();
    const keybinding = createPaletteKeybinding(parseKeyCombo('mod+k'), onOpen, false);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    expect(onOpen).toHaveBeenCalledTimes(1);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    expect(onOpen).toHaveBeenCalledTimes(2);

    keybinding.teardown();
  });

  it('ignores non-matching keys', () => {
    const onOpen = vi.fn();
    const keybinding = createPaletteKeybinding(parseKeyCombo('mod+k'), onOpen, false);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'j', ctrlKey: true }));
    expect(onOpen).not.toHaveBeenCalled();

    keybinding.teardown();
  });

  it('stops calling onOpen after teardown', () => {
    const onOpen = vi.fn();
    const keybinding = createPaletteKeybinding(parseKeyCombo('mod+k'), onOpen, false);
    keybinding.teardown();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    expect(onOpen).not.toHaveBeenCalled();
  });
});
