import { describe, it, expect } from 'vitest';
import { matchesKeyCombo, parseKeyCombo } from './keyboard.util';

function press(
  key: string,
  mods: Partial<{ ctrl: boolean; meta: boolean; shift: boolean; alt: boolean }> = {},
): KeyboardEvent {
  return new KeyboardEvent('keydown', {
    key,
    ctrlKey: mods.ctrl ?? false,
    metaKey: mods.meta ?? false,
    shiftKey: mods.shift ?? false,
    altKey: mods.alt ?? false,
  });
}

describe('matchesKeyCombo modifier exactness', () => {
  it("bare 'b' matches an unmodified press and rejects every modifier chord", () => {
    const b = parseKeyCombo('b');
    expect(matchesKeyCombo(press('b'), b, false)).toBe(true);
    expect(matchesKeyCombo(press('b', { meta: true }), b, true)).toBe(false); // Cmd+b
    expect(matchesKeyCombo(press('b', { ctrl: true }), b, false)).toBe(false); // Ctrl+b
    expect(matchesKeyCombo(press('B', { shift: true }), b, false)).toBe(false); // Shift+b
    expect(matchesKeyCombo(press('b', { alt: true }), b, false)).toBe(false); // Alt+b
  });

  it("'mod+b' resolves to the platform primary and rejects a bare b", () => {
    const mod = parseKeyCombo('mod+b');
    expect(matchesKeyCombo(press('b', { meta: true }), mod, true)).toBe(true); // Cmd+b on mac
    expect(matchesKeyCombo(press('b', { ctrl: true }), mod, false)).toBe(true); // Ctrl+b elsewhere
    expect(matchesKeyCombo(press('b'), mod, true)).toBe(false);
    expect(matchesKeyCombo(press('b'), mod, false)).toBe(false);
  });

  it("'ctrl+shift+k' rejects Ctrl+k without shift", () => {
    const combo = parseKeyCombo('ctrl+shift+k');
    expect(matchesKeyCombo(press('k', { ctrl: true, shift: true }), combo, false)).toBe(true);
    expect(matchesKeyCombo(press('k', { ctrl: true }), combo, false)).toBe(false);
  });

  it("bare '?' is shift-agnostic but ctrl/meta stay strict", () => {
    const q = parseKeyCombo('?');
    // Shift+/ is the press that produces event.key === '?'.
    expect(matchesKeyCombo(press('?', { shift: true }), q, false)).toBe(true);
    // A layout that yields '?' without Shift matches too.
    expect(matchesKeyCombo(press('?'), q, false)).toBe(true);
    // A meta chord is still rejected.
    expect(matchesKeyCombo(press('?', { meta: true }), q, true)).toBe(false);
  });

  it("'shift+?' still requires the shift key", () => {
    const combo = parseKeyCombo('shift+?');
    expect(matchesKeyCombo(press('?', { shift: true }), combo, false)).toBe(true);
    expect(matchesKeyCombo(press('?'), combo, false)).toBe(false);
  });
});
