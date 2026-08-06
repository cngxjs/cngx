import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// jsdom models neither CSS `@property { inherits }` semantics nor the
// `(any-pointer: coarse)` media feature, so the behavioural floor proof
// runs in the examples e2e harness (real Chromium). These specs guard
// the source-CSS contract those probes depend on.

const readCss = (name: string): string =>
  readFileSync(resolve(__dirname, name), 'utf-8');

describe('--cngx-target-min touch-target floor token', () => {
  const css = readCss('system-tokens.css');

  it('registers inherits: true so a [data-touch] ancestor can cascade the floor', () => {
    const block = css.match(/@property --cngx-target-min\s*{[^}]+}/);
    expect(block, '@property --cngx-target-min registration not found').not.toBeNull();
    expect(block![0]).toContain('inherits: true');
    expect(block![0]).not.toContain('inherits: false');
  });

  it('defaults to a 0px floor so the use-site max() fallback stays inert until lifted', () => {
    const block = css.match(/@property --cngx-target-min\s*{[^}]+}/);
    expect(block![0]).toContain('initial-value: 0px');
  });

  it('lifts the floor to 44px under (any-pointer: coarse), excluding the opt-out signals', () => {
    const media = css.match(/@media \(any-pointer: coarse\)\s*{[^]*?}\s*}/);
    expect(media, '(any-pointer: coarse) media block not found').not.toBeNull();
    expect(media![0]).toContain(":root:not([data-touch='off']):not(.cngx-touch-off)");
    expect(media![0]).toContain('--cngx-target-min: 44px');
  });

  it('declares the explicit opt-in block with its class twin', () => {
    const block = css.match(/\[data-touch='on'],\s*\.cngx-touch-on\s*{[^}]+}/);
    expect(block, "[data-touch='on'] opt-in block not found").not.toBeNull();
    expect(block![0]).toContain('--cngx-target-min: 44px');
  });

  it('declares the explicit opt-out block with its class twin', () => {
    const block = css.match(/\[data-touch='off'],\s*\.cngx-touch-off\s*{[^}]+}/);
    expect(block, "[data-touch='off'] opt-out block not found").not.toBeNull();
    expect(block![0]).toContain('--cngx-target-min: 0px');
  });
});

describe('--cngx-target-gap adjacent-target spacing token', () => {
  const css = readCss('system-tokens.css');

  it('registers inherits: true so a [data-touch] ancestor can cascade the gap', () => {
    const block = css.match(/@property --cngx-target-gap\s*{[^}]+}/);
    expect(block, '@property --cngx-target-gap registration not found').not.toBeNull();
    expect(block![0]).toContain('inherits: true');
    expect(block![0]).not.toContain('inherits: false');
  });

  it('defaults to a 0px gap so the use-site max() fallback stays inert until lifted', () => {
    const block = css.match(/@property --cngx-target-gap\s*{[^}]+}/);
    expect(block![0]).toContain('initial-value: 0px');
  });

  it('lifts the gap to 8px under (any-pointer: coarse), excluding the opt-out signals', () => {
    const media = css.match(/@media \(any-pointer: coarse\)\s*{[^]*?}\s*}/);
    expect(media, '(any-pointer: coarse) media block not found').not.toBeNull();
    expect(media![0]).toContain(":root:not([data-touch='off']):not(.cngx-touch-off)");
    expect(media![0]).toContain('--cngx-target-gap: 8px');
  });

  it('declares the explicit opt-in block with its class twin', () => {
    const block = css.match(/\[data-touch='on'],\s*\.cngx-touch-on\s*{[^}]+}/);
    expect(block, "[data-touch='on'] opt-in block not found").not.toBeNull();
    expect(block![0]).toContain('--cngx-target-gap: 8px');
  });

  it('declares the explicit opt-out block with its class twin', () => {
    const block = css.match(/\[data-touch='off'],\s*\.cngx-touch-off\s*{[^}]+}/);
    expect(block, "[data-touch='off'] opt-out block not found").not.toBeNull();
    expect(block![0]).toContain('--cngx-target-gap: 0px');
  });
});
