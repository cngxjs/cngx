import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Source-text tier for the field-skin stylesheet. Guards the cascade rules a
// computed read cannot see: density derivation, the @media placement that
// decides whether the forced-colors override actually wins, and the
// :scope-only outline suppression that keeps an interactive affix button's
// own focus ring alive inside a filled box. The computed tier lives in
// `cngx-field-skin.geometry.spec.ts` and runs in a real Chromium.

const SOURCE = readFileSync(
  resolve(process.cwd(), 'projects/forms/theming/components/cngx-field-skin.css'),
  'utf8',
);

describe('cngx-field-skin.css', () => {
  it('derives every spacing token from the scale', () => {
    expect(SOURCE).toContain('--cngx-field-fill-padding-block: var(--cngx-space-sm)');
    expect(SOURCE).toContain('--cngx-field-fill-padding-inline: var(--cngx-space-md)');
    expect(SOURCE).toContain('--cngx-field-bare-padding: var(--cngx-space-xs)');
  });

  it('registers the underline size as an inheriting length', () => {
    const block = SOURCE.slice(
      SOURCE.indexOf('@property --cngx-field-underline-size'),
      SOURCE.indexOf('@layer cngx.components'),
    );
    expect(block).toContain("syntax: '<length>'");
    // inherits:true so a single :root override retunes every field; a
    // non-inheriting knob would be dead at the registration boundary.
    expect(block).toContain('inherits: true');
  });

  it('keeps the forced-colors block outside @scope and unlayered', () => {
    const media = SOURCE.indexOf('@media (forced-colors: active)');
    expect(media).toBeGreaterThan(-1);
    expect(media).toBeGreaterThan(SOURCE.lastIndexOf('@scope'));
    expect(media).toBeGreaterThan(SOURCE.lastIndexOf('@layer cngx.components'));
    expect(SOURCE.slice(media)).not.toContain('@scope');
    expect(SOURCE.slice(media)).not.toContain('@layer');
  });

  it('nests no @media inside a @scope block', () => {
    // Everything from the first @scope up to the forced-colors block is the
    // scoped region; the previous test pins that block last.
    const scoped = SOURCE.slice(
      SOURCE.indexOf('@scope'),
      SOURCE.indexOf('@media (forced-colors: active)'),
    );
    expect(scoped).not.toContain('@media');
  });

  it('suppresses the reset outline only on the scope root', () => {
    const lines = SOURCE.split('\n');
    const heads = lines
      .map((line, i) => (line.includes('outline: none') ? lines[i - 1].trim() : null))
      .filter((head): head is string => head !== null);
    expect(heads.length).toBeGreaterThan(0);
    for (const head of heads) {
      expect(head.startsWith(':scope')).toBe(true);
    }
  });

  it('repaints the surface under UA autofill', () => {
    expect(SOURCE).toContain(':scope:autofill');
  });

  it('keeps Material system tokens out of the default stylesheet', () => {
    expect(SOURCE).not.toContain('--mat-sys-');
  });
});
