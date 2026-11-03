import { Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect } from 'vitest';
import {
  CNGX_NESTED_INTERACTIVE_SELECTOR,
  matchesKeyCombo,
  parseKeyCombo,
  provideNestedInteractiveSelector,
} from './keyboard.util';

function press(
  key: string,
  mods: Partial<{ ctrl: boolean; meta: boolean; shift: boolean; alt: boolean; composing: boolean }> = {},
): KeyboardEvent {
  return new KeyboardEvent('keydown', {
    key,
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

  it("rejects a composing bare-key press even when the key text matches", () => {
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
    for (const html of ['<a></a>', '<span contenteditable="false"></span>', '<span role="option"></span>']) {
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
