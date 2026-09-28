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
  it('derives the shared box padding pair from the scale in both skins', () => {
    for (const skin of ['fill', 'bare']) {
      const scope = SOURCE.slice(SOURCE.indexOf(`[data-skin='${skin}']`));
      const root = scope.slice(0, scope.indexOf('}'));
      expect(root).toContain('--cngx-field-padding-block: var(--cngx-space-sm)');
      expect(root).toContain('--cngx-field-padding-inline: var(--cngx-space-md)');
    }
    expect(SOURCE).not.toContain('--cngx-field-fill-padding');
    expect(SOURCE).not.toContain('--cngx-field-bare-padding');
  });

  // A DOM child of a box gets no skin paint whatever its own data-skin says:
  // a control the box does not see as a direct content child (projected
  // through ng-content) keeps its own resolved skin, and the CSS must not
  // paint it anyway.
  it('keeps every skin scope root off a control nested in a box', () => {
    const roots = [...SOURCE.matchAll(/@scope \(([^{]*)\) \{/g)].map((match) => match[1]);
    expect(roots.length).toBe(2);
    for (const root of roots) {
      const controlRoot = root.split(', .cngx-field-box')[0];
      expect(controlRoot).toContain(':not(.cngx-field-box > *)');
    }
  });

  it('keys state on the box and bounds the native fallback to direct children', () => {
    expect(SOURCE).not.toContain('.cngx-field--error *');
    expect(SOURCE).not.toContain('.cngx-field--disabled *');
    expect(SOURCE).not.toContain(':has(:disabled)');
    expect(SOURCE).not.toMatch(/:has\(\[aria-invalid/);
    expect(SOURCE).toContain('[data-invalid]');
    expect(SOURCE).toContain('[data-disabled]');
    expect(SOURCE).toContain('[data-readonly]');
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

  it('suppresses the reset outline only on the scope root or a control nested in a box', () => {
    // The box draws the ring for the control inside it; an interactive affix
    // button is never a nested :is(input, textarea, select) and must always
    // keep its own focus ring.
    const rules = SOURCE.replace(/\/\*[\s\S]*?\*\//g, '')
      .split('}')
      .filter((rule) => rule.includes('outline: none'))
      .map((rule) => {
        const head = rule.slice(0, rule.lastIndexOf('{', rule.indexOf('outline: none')));
        return head.slice(head.lastIndexOf('{') + 1).trim();
      });
    expect(rules.length).toBeGreaterThan(0);
    for (const selector of rules) {
      const nestedControl = selector.startsWith(
        '.cngx-field-box[data-skin] > :is(input, textarea, select)',
      );
      expect(selector.startsWith(':scope') || nestedControl).toBe(true);
    }
  });

  it('resets a nested control to transparent with the box floor', () => {
    const reset = SOURCE.slice(
      SOURCE.indexOf('.cngx-field-box[data-skin] > :is(input, textarea, select),'),
    );
    const body = reset.slice(reset.indexOf('{'), reset.indexOf('}')).replace(/\s+/g, ' ');
    for (const declaration of [
      'padding: 0',
      'border: 0',
      'background: transparent',
      'box-shadow: none',
      'color: inherit',
      '2 * var(--cngx-field-border-width, 1px)',
    ]) {
      expect(body).toContain(declaration);
    }
  });

  it('keeps the bare scope free of any underline and of outline suppression', () => {
    // Bare has to read differently from fill: no line in any state, and the
    // regular cngx.reset focus ring instead of a drawn indicator.
    const bare = SOURCE.slice(
      SOURCE.indexOf("@scope (:is(input, textarea, select)[data-skin='bare']"),
      SOURCE.indexOf('/* Nested controls'),
    );
    expect(bare).not.toContain('box-shadow');
    expect(bare).not.toContain('border-block-end');
    expect(bare).not.toContain('outline: none');
  });

  it('gives the fill surface and focus colour a light and a dark default', () => {
    const tokens = SOURCE.slice(
      SOURCE.indexOf('@layer cngx.tokens'),
      SOURCE.indexOf('@layer cngx.components'),
    );
    const dark = tokens.slice(tokens.indexOf('@media (prefers-color-scheme: dark)'));
    for (const token of [
      '--cngx-field-fill-bg:',
      '--cngx-field-fill-bg-hover:',
      '--cngx-field-underline-focus-color:',
    ]) {
      expect(tokens).toContain(token);
      expect(dark).toContain(token);
    }
    expect(tokens).toContain("[data-color-scheme='dark']");
    expect(tokens).toContain("[data-color-scheme='light']");
  });

  // Focus in an affix (a button, or a composite picker's trigger) is marked by
  // the affix's own ring; the box ring and the fill underline mark the main
  // control only, so the two never show the same indicator.
  it('keeps the box ring and the fill underline off focus inside an affix', () => {
    const optOut = ':not(\n        :has(:is(.cngx-field-prefix, .cngx-field-suffix):focus-within)';
    const affix = readFileSync(
      resolve(process.cwd(), 'projects/forms/theming/components/cngx-field-affix.css'),
      'utf8',
    );
    expect(SOURCE).toContain(`:scope:is(:focus-visible, :focus-within)${optOut}`);
    expect(affix).toContain(`:focus-within${optOut}`);
  });

  it('repaints the surface under UA autofill', () => {
    expect(SOURCE).toContain(':scope:autofill');
  });

  it('keeps Material system tokens out of the default stylesheet', () => {
    expect(SOURCE).not.toContain('--mat-sys-');
  });
});
