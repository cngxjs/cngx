import { parseKeyCombo } from '@cngx/core/utils';
import { describe, expect, it } from 'vitest';

import { createPaletteKeybinding } from './palette-keybinding';

describe('createPaletteKeybinding', () => {
  it('pulses triggered when the combo is pressed', () => {
    const keybinding = createPaletteKeybinding(parseKeyCombo('mod+k'), false);
    expect(keybinding.triggered()).toBe(0);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    expect(keybinding.triggered()).toBe(1);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    expect(keybinding.triggered()).toBe(2);

    keybinding.teardown();
  });

  it('ignores non-matching keys', () => {
    const keybinding = createPaletteKeybinding(parseKeyCombo('mod+k'), false);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'j', ctrlKey: true }));
    expect(keybinding.triggered()).toBe(0);
    keybinding.teardown();
  });

  it('stops pulsing after teardown', () => {
    const keybinding = createPaletteKeybinding(parseKeyCombo('mod+k'), false);
    keybinding.teardown();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    expect(keybinding.triggered()).toBe(0);
  });
});
