import { Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect } from 'vitest';
import {
  CNGX_NESTED_INTERACTIVE_SELECTOR,
  matchesKeyCombo,
  parseKeyCombo,
  provideNestedInteractiveSelector,
  resolveAriaKeyShortcuts,
  resolveKeyComboParts,
  resolveMacPlatform,
} from './keyboard.util';

function press(
  key: string,
  mods: Partial<{
    ctrl: boolean;
    meta: boolean;
    shift: boolean;
    alt: boolean;
    composing: boolean;
    code: string;
    altGraph: boolean;
  }> = {},
): KeyboardEvent {
  return new KeyboardEvent('keydown', {
    key,
    code: mods.code ?? '',
    modifierAltGraph: mods.altGraph ?? false,
    ctrlKey: mods.ctrl ?? false,
    metaKey: mods.meta ?? false,
    shiftKey: mods.shift ?? false,
    altKey: mods.alt ?? false,
    isComposing: mods.composing ?? false,
  });
}

describe('parseKeyCombo', () => {
  it('parses modifiers and key case-insensitively', () => {
    expect(parseKeyCombo('Ctrl+Shift+K')).toEqual({
      key: 'k',
      ctrl: true,
      meta: false,
      mod: false,
      shift: true,
      alt: false,
    });
  });

  it("treats a trailing '+' as the literal plus key", () => {
    expect(parseKeyCombo('mod++')).toEqual({
      key: '+',
      ctrl: false,
      meta: false,
      mod: true,
      shift: false,
      alt: false,
    });
  });

  it("parses a bare '+' as the plus key with no modifiers", () => {
    expect(parseKeyCombo('+').key).toBe('+');
  });
});

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

describe('matchesKeyCombo IME composition', () => {
  it('never matches a keydown fired during composition', () => {
    const combo = parseKeyCombo('mod+b');
    expect(matchesKeyCombo(press('b', { meta: true, composing: true }), combo, true)).toBe(false);
    // The identical press outside composition matches.
    expect(matchesKeyCombo(press('b', { meta: true }), combo, true)).toBe(true);
  });

  it('rejects a composing bare-key press even when the key text matches', () => {
    const combo = parseKeyCombo('k');
    expect(matchesKeyCombo(press('k', { composing: true }), combo, false)).toBe(false);
  });
});

describe("matchesKeyCombo literal '+' key", () => {
  it("'mod++' matches the platform primary with the plus key", () => {
    const combo = parseKeyCombo('mod++');
    // '+' is Shift+'=' on many layouts - the glyph encodes Shift, so the
    // punctuation shift-agnostic rule applies.
    expect(matchesKeyCombo(press('+', { meta: true, shift: true }), combo, true)).toBe(true);
    expect(matchesKeyCombo(press('+', { ctrl: true }), combo, false)).toBe(true);
    expect(matchesKeyCombo(press('+'), combo, true)).toBe(false);
  });
});

describe('matchesKeyCombo AltGr guard', () => {
  it('rejects AltGr character input off macOS even though the physical key matches', () => {
    const combo = parseKeyCombo('ctrl+alt+e');
    // Windows reports AltGr as Ctrl+Alt; the code fallback alone would accept KeyE.
    const altGr = press('€', { code: 'KeyE', ctrl: true, alt: true, altGraph: true });
    expect(matchesKeyCombo(altGr, combo, false)).toBe(false);
    const chord = press('€', { code: 'KeyE', ctrl: true, alt: true });
    expect(matchesKeyCombo(chord, combo, false)).toBe(true);
  });

  it('matches a bare punctuation combo typed through AltGr', () => {
    // German layout: AltGr+Q types '@', reported as Ctrl+Alt with AltGraph.
    const at = press('@', { code: 'KeyQ', ctrl: true, alt: true, altGraph: true });
    expect(matchesKeyCombo(at, parseKeyCombo('@'), false)).toBe(true);
    expect(matchesKeyCombo(at, parseKeyCombo('q'), false)).toBe(false);
    expect(matchesKeyCombo(at, parseKeyCombo('mod+@'), false)).toBe(false);
    const withMeta = press('@', {
      code: 'KeyQ',
      ctrl: true,
      alt: true,
      meta: true,
      altGraph: true,
    });
    expect(matchesKeyCombo(withMeta, parseKeyCombo('@'), false)).toBe(false);
  });

  it('is off on macOS, where Option is alt and there is no AltGr key', () => {
    const combo = parseKeyCombo('alt+b');
    expect(matchesKeyCombo(press('∫', { code: 'KeyB', alt: true }), combo, true)).toBe(true);
    expect(
      matchesKeyCombo(press('∫', { code: 'KeyB', alt: true, altGraph: true }), combo, true),
    ).toBe(true);
  });
});

describe('matchesKeyCombo physical-key fallback', () => {
  it('matches a Shift+digit press whose key is the shifted glyph', () => {
    const combo = parseKeyCombo('shift+1');
    expect(matchesKeyCombo(press('!', { code: 'Digit1', shift: true }), combo, false)).toBe(true);
  });

  it('a bare digit combo still rejects the shifted press', () => {
    const combo = parseKeyCombo('1');
    expect(matchesKeyCombo(press('!', { code: 'Digit1', shift: true }), combo, false)).toBe(false);
  });

  it('never trusts the code when the layout still produces a Latin letter (QWERTZ)', () => {
    // QWERTZ: the key labelled Y sits on the US Z position.
    const shiftY = press('Y', { code: 'KeyZ', shift: true });
    expect(matchesKeyCombo(shiftY, parseKeyCombo('shift+z'), false)).toBe(false);
    expect(matchesKeyCombo(shiftY, parseKeyCombo('shift+y'), false)).toBe(true);
    expect(
      matchesKeyCombo(press('y', { code: 'KeyZ', alt: true }), parseKeyCombo('alt+z'), false),
    ).toBe(false);
  });

  it('falls back to the physical US position on a non-Latin layout', () => {
    const combo = parseKeyCombo('alt+z');
    expect(matchesKeyCombo(press('я', { code: 'KeyZ', alt: true }), combo, false)).toBe(true);
  });

  it('does not fall back without Alt or Shift', () => {
    const combo = parseKeyCombo('mod+z');
    expect(matchesKeyCombo(press('я', { code: 'KeyZ', ctrl: true }), combo, false)).toBe(false);
  });
});

describe('resolveKeyComboParts', () => {
  it('orders modifiers ctrl alt shift meta on every platform', () => {
    const combo = parseKeyCombo('meta+shift+alt+ctrl+k');
    expect(resolveKeyComboParts(combo, true)).toEqual([
      'ctrl',
      'alt',
      'shift',
      'meta',
      { key: 'k' },
    ]);
    expect(resolveKeyComboParts(combo, false)).toEqual([
      'ctrl',
      'alt',
      'shift',
      'meta',
      { key: 'k' },
    ]);
  });

  it('resolves mod per platform', () => {
    const combo = parseKeyCombo('mod+shift+k');
    expect(resolveKeyComboParts(combo, true)).toEqual(['shift', 'meta', { key: 'k' }]);
    expect(resolveKeyComboParts(combo, false)).toEqual(['ctrl', 'shift', { key: 'k' }]);
  });

  it('lists a modifier once when mod resolves to a modifier the combo also names', () => {
    expect(resolveKeyComboParts(parseKeyCombo('mod+ctrl+k'), false)).toEqual([
      'ctrl',
      { key: 'k' },
    ]);
  });

  it('returns only the key for a bare combo', () => {
    expect(resolveKeyComboParts(parseKeyCombo('?'), false)).toEqual([{ key: '?' }]);
  });
});

describe('resolveAriaKeyShortcuts', () => {
  const aria = (combo: string, isMac: boolean): string =>
    resolveAriaKeyShortcuts(parseKeyCombo(combo), isMac);

  it('serialises mod per platform with an upper-case letter', () => {
    expect(aria('mod+k', false)).toBe('Control+K');
    expect(aria('mod+k', true)).toBe('Meta+K');
  });

  it("serialises the literal '+' key as Plus", () => {
    expect(aria('mod++', false)).toBe('Control+Plus');
    expect(aria('mod++', true)).toBe('Meta+Plus');
  });

  it('puts modifiers in canonical order before the key', () => {
    expect(aria('mod+shift+?', false)).toBe('Control+Shift+?');
    expect(aria('mod+shift+?', true)).toBe('Shift+Meta+?');
  });

  it('serialises bare and named keys as UI Events key values', () => {
    expect(aria('?', false)).toBe('?');
    expect(aria('escape', false)).toBe('Escape');
    expect(aria('alt+arrowup', false)).toBe('Alt+ArrowUp');
    expect(aria('space', false)).toBe('Space');
    expect(aria('ctrl+pagedown', false)).toBe('Control+PageDown');
    expect(aria('f2', false)).toBe('F2');
  });
});

describe('combo key vocabulary', () => {
  // [combo key, event.key the browser reports, aria-keyshortcuts token]
  const NAMED_KEYS: readonly (readonly [string, string, string])[] = [
    ['space', ' ', 'Space'],
    ['esc', 'Escape', 'Escape'],
    ['escape', 'Escape', 'Escape'],
    ['enter', 'Enter', 'Enter'],
    ['tab', 'Tab', 'Tab'],
    ['backspace', 'Backspace', 'Backspace'],
    ['delete', 'Delete', 'Delete'],
    ['insert', 'Insert', 'Insert'],
    ['home', 'Home', 'Home'],
    ['end', 'End', 'End'],
    ['pageup', 'PageUp', 'PageUp'],
    ['pagedown', 'PageDown', 'PageDown'],
    ['arrowup', 'ArrowUp', 'ArrowUp'],
    ['arrowdown', 'ArrowDown', 'ArrowDown'],
    ['arrowleft', 'ArrowLeft', 'ArrowLeft'],
    ['arrowright', 'ArrowRight', 'ArrowRight'],
    ['contextmenu', 'ContextMenu', 'ContextMenu'],
    ['capslock', 'CapsLock', 'CapsLock'],
    ['numlock', 'NumLock', 'NumLock'],
    ['scrolllock', 'ScrollLock', 'ScrollLock'],
    ['printscreen', 'PrintScreen', 'PrintScreen'],
    ['pause', 'Pause', 'Pause'],
    ['f2', 'F2', 'F2'],
    ['+', '+', 'Plus'],
  ];

  it('every key the serialiser names also matches the press it advertises', () => {
    for (const [comboKey, eventKey, token] of NAMED_KEYS) {
      const combo = parseKeyCombo(comboKey);
      expect(resolveAriaKeyShortcuts(combo, false), comboKey).toBe(token);
      expect(matchesKeyCombo(press(eventKey), combo, false), comboKey).toBe(true);
    }
  });

  it('keeps a single character whose upper case is two characters', () => {
    expect(resolveAriaKeyShortcuts(parseKeyCombo('alt+ß'), false)).toBe('Alt+ß');
    expect(resolveAriaKeyShortcuts(parseKeyCombo('ä'), false)).toBe('Ä');
  });

  it("parses the 'esc' alias to the UI Events value 'escape'", () => {
    expect(parseKeyCombo('mod+esc').key).toBe('escape');
  });
});

describe('resolveMacPlatform', () => {
  const nav = (fields: { platform?: string; userAgentData?: { platform?: string } }): Navigator =>
    fields as unknown as Navigator;

  it('reads navigator.platform', () => {
    expect(resolveMacPlatform(nav({ platform: 'MacIntel' }))).toBe(true);
    expect(resolveMacPlatform(nav({ platform: 'Win32' }))).toBe(false);
  });

  it('prefers userAgentData.platform over navigator.platform', () => {
    expect(
      resolveMacPlatform(nav({ platform: 'Win32', userAgentData: { platform: 'macOS' } })),
    ).toBe(true);
    expect(
      resolveMacPlatform(nav({ platform: 'MacIntel', userAgentData: { platform: 'Windows' } })),
    ).toBe(false);
  });

  it('falls back to navigator.platform when the client hint is empty', () => {
    expect(resolveMacPlatform(nav({ platform: 'MacIntel', userAgentData: { platform: '' } }))).toBe(
      true,
    );
  });

  it('resolves iOS and iPadOS as Apple platforms', () => {
    expect(resolveMacPlatform(nav({ platform: 'iPad' }))).toBe(true);
    expect(resolveMacPlatform(nav({ platform: 'iPhone' }))).toBe(true);
    expect(resolveMacPlatform(nav({ platform: 'Linux armv8l' }))).toBe(false);
  });

  it('resolves an absent navigator to false', () => {
    expect(resolveMacPlatform(undefined)).toBe(false);
  });
});

describe('CNGX_NESTED_INTERACTIVE_SELECTOR', () => {
  const matches = (selector: string, html: string): boolean => {
    const host = document.createElement('div');
    host.innerHTML = html;
    return host.firstElementChild!.matches(selector);
  };

  it('names the native controls, editable regions and the widget roles by default', () => {
    const selector = TestBed.inject(CNGX_NESTED_INTERACTIVE_SELECTOR);
    for (const html of [
      '<button></button>',
      '<a href="#"></a>',
      '<input />',
      '<summary></summary>',
      '<span contenteditable="true"></span>',
      '<span contenteditable=""></span>',
      '<span role="radio"></span>',
      '<span role="tab"></span>',
      '<span role="slider"></span>',
      '<span role="menuitemradio"></span>',
    ]) {
      expect(matches(selector, html), html).toBe(true);
    }
    for (const html of [
      '<a></a>',
      '<span contenteditable="false"></span>',
      '<span role="option"></span>',
    ]) {
      expect(matches(selector, html), html).toBe(false);
    }
  });

  it('provideNestedInteractiveSelector extends the default list', () => {
    TestBed.configureTestingModule({ providers: [provideNestedInteractiveSelector('app-rating')] });
    const selector = TestBed.inject(CNGX_NESTED_INTERACTIVE_SELECTOR);
    expect(matches(selector, '<app-rating></app-rating>')).toBe(true);
    expect(matches(selector, '<button></button>')).toBe(true);
  });

  it('a nested provider extends its parent, not the default', () => {
    TestBed.configureTestingModule({ providers: [provideNestedInteractiveSelector('app-rating')] });
    const child = Injector.create({
      providers: provideNestedInteractiveSelector('[role="spinbutton"]'),
      parent: TestBed.inject(Injector),
    });
    const selector = child.get(CNGX_NESTED_INTERACTIVE_SELECTOR);
    expect(matches(selector, '<app-rating></app-rating>')).toBe(true);
    expect(matches(selector, '<span role="spinbutton"></span>')).toBe(true);
  });
});
