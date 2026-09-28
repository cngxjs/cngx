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
    // regular focus ring instead of a drawn indicator. The one edge it draws
    // is the dotted disabled baseline, which no fill state uses.
    const bare = SOURCE.slice(
      SOURCE.indexOf("@scope (:is(input, textarea, select)[data-skin='bare']"),
      SOURCE.indexOf('/* Nested controls'),
    );
    expect(bare).not.toContain('box-shadow');
    expect(bare).not.toContain('outline: none');
    const edges = [...bare.matchAll(/border-block-end-style: (\w+)/g)].map((m) => m[1]);
    expect(edges).toEqual(['dotted']);
  });

  it('tints the bare error text with the danger text token and rings it inset', () => {
    const bare = SOURCE.slice(
      SOURCE.indexOf("@scope (:is(input, textarea, select)[data-skin='bare']"),
      SOURCE.indexOf('/* Nested controls'),
    )
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ');
    expect(bare).toContain('--cngx-field-bare-error-text-color, var( --cngx-color-danger-text,');
    expect(bare).toContain('outline-offset: -1px');
    expect(bare).toContain(
      '--cngx-field-ring-offset: calc(-1 * var(--cngx-field-ring-width, 2px))',
    );
    expect(bare).not.toContain('opacity');
  });

  it('uses the registered danger default as the only danger fallback literal', () => {
    const literals = [...SOURCE.matchAll(/--cngx-color-danger, (oklch\([^)]*\))/g)].map(
      (m) => m[1],
    );
    expect(literals.length).toBeGreaterThan(0);
    expect(new Set(literals)).toEqual(new Set(['oklch(0.6 0.18 25)']));
  });

  it('draws a system-colour edge on a resting bare field under forced colours', () => {
    const media = SOURCE.slice(SOURCE.indexOf('@media (forced-colors: active)'));
    const flat = media.replace(/\s+/g, ' ');
    expect(flat).toContain(
      ".cngx-field-box[data-skin='bare'] { border: var(--cngx-field-border-width, 1px) solid FieldText; }",
    );
  });

  it('gives the fill surface and both line colours a default in every scheme block', () => {
    const tokens = SOURCE.slice(
      SOURCE.indexOf('@layer cngx.tokens'),
      SOURCE.indexOf('@layer cngx.components'),
    );
    const blocks = [...tokens.matchAll(/(?::root|\.dark|\.light)[^{*`]*\{([^}]*)\}/g)].map(
      (match) => match[1],
    );
    expect(blocks.length).toBe(4);
    for (const block of blocks) {
      expect(block).toContain('--cngx-field-fill-bg:');
      // A var() resolves where it is declared, so each block re-reads the
      // scheme's own rung instead of inheriting the root's resolved colour.
      expect(block).toContain('--cngx-field-underline-color: var(--cngx-color-text-muted);');
      expect(block).toContain(
        '--cngx-field-underline-focus-color: var(--cngx-color-primary-strong);',
      );
    }
  });

  // The hover surface is derived at the use site from the resting surface; a
  // default assignment would pin a root-resolved colour that a surface
  // override on a subtree never reaches.
  it('derives the hover surface from the resting surface instead of a default', () => {
    const tokens = SOURCE.slice(
      SOURCE.indexOf('@layer cngx.tokens'),
      SOURCE.indexOf('@layer cngx.components'),
    );
    expect(tokens).not.toContain('--cngx-field-fill-bg-hover:');
    const hover = SOURCE.slice(SOURCE.indexOf(':scope:hover {'));
    const body = hover.slice(0, hover.indexOf('}')).replace(/\s+/g, ' ');
    expect(body).toContain('--cngx-field-fill-bg-hover, color-mix( in oklab,');
    expect(body).toContain('var( --cngx-field-fill-bg,');
    expect(body).toContain('border-block-end-color: var(--cngx-color-text');
  });

  it('keeps the error underline after the focus underline so focus never repaints it', () => {
    const fill = SOURCE.slice(
      SOURCE.indexOf("@scope (:is(input, textarea, select)[data-skin='fill']"),
      SOURCE.indexOf("@scope (:is(input, textarea, select)[data-skin='bare']"),
    );
    const focus = fill.indexOf(':scope:is(:focus-visible, :focus-within):where(');
    const error = fill.indexOf(":scope:is([aria-invalid='true'], [data-invalid]),");
    expect(focus).toBeGreaterThan(-1);
    expect(error).toBeGreaterThan(focus);
    const body = fill.slice(error, fill.indexOf('}', error)).replace(/\s+/g, ' ');
    expect(body).toContain(
      'box-shadow: inset 0 calc(-1 * var(--cngx-field-underline-size, 2px)) 0',
    );
  });

  it('fades a disabled fill field by colour, never by opacity', () => {
    const fill = SOURCE.slice(
      SOURCE.indexOf("@scope (:is(input, textarea, select)[data-skin='fill']"),
      SOURCE.indexOf("@scope (:is(input, textarea, select)[data-skin='bare']"),
    );
    const at = fill.indexOf(':scope:is(:disabled, [data-disabled]),');
    const body = fill.slice(at, fill.indexOf('}', at));
    expect(body).toContain('border-block-end-style: dashed');
    expect(body).toContain('38%');
    expect(body).not.toContain('opacity');
  });

  it('snaps the fill transitions under reduced motion, unlayered and outside @scope', () => {
    const media = SOURCE.indexOf('@media (prefers-reduced-motion: reduce)');
    expect(media).toBeGreaterThan(SOURCE.lastIndexOf('@scope'));
    expect(media).toBeGreaterThan(SOURCE.lastIndexOf('@layer cngx.components'));
    const block = SOURCE.slice(media);
    expect(block).toContain(".cngx-field-box[data-skin='fill']");
    expect(block).toContain('transition: none');
    expect(block).not.toContain('@layer');
  });

  // Focus in an affix (a button, or a composite picker's trigger) is marked by
  // the affix's own ring; the box ring and the fill underline mark the main
  // control only, so the two never show the same indicator.
  it('keeps the box ring and the fill underline off focus inside an affix', () => {
    const optOut = ':not(\n        :has(:is(.cngx-field-prefix, .cngx-field-suffix):focus-within)';
    const fillOptOut =
      ':where(\n        :not(:has(:is(.cngx-field-prefix, .cngx-field-suffix):focus-within))';
    const affix = readFileSync(
      resolve(process.cwd(), 'projects/forms/theming/components/cngx-field-affix.css'),
      'utf8',
    );
    expect(SOURCE).toContain(`:scope:is(:focus-visible, :focus-within)${fillOptOut}`);
    expect(affix).toContain(`:focus-within${optOut}`);
  });

  // getComputedStyle does not report the UA search pseudo-elements reliably,
  // so the rule is guarded as source: box children only, a standalone search
  // input keeps the browser-native cancel glyph.
  it('hides the UA search cancel glyph for box children only', () => {
    const flat = SOURCE.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
    expect(flat).toContain(
      ".cngx-field-box[data-skin] > input[type='search']::-webkit-search-cancel-button { display: none; }",
    );
    const cancelRules = [...flat.matchAll(/([^{}]*)::-webkit-search-cancel-button/g)];
    expect(cancelRules.length).toBe(1);
    expect(cancelRules[0][1].trim().startsWith('.cngx-field-box[data-skin] >')).toBe(true);
  });

  it('gives the lone fill and bare control the field placeholder colour', () => {
    for (const skin of ['fill', 'bare']) {
      const scope = SOURCE.slice(
        SOURCE.indexOf(`@scope (:is(input, textarea, select)[data-skin='${skin}']`),
      );
      const block = scope.slice(0, scope.indexOf('\n  }\n')).replace(/\s+/g, ' ');
      expect(block).toContain(':scope::placeholder, :scope > :is(input, textarea)::placeholder {');
      expect(block).toContain('--cngx-field-placeholder-color, var(--cngx-color-text-muted');
    }
  });

  it('repaints the surface under UA autofill', () => {
    expect(SOURCE).toContain(':scope:autofill');
  });

  it('keeps Material system tokens out of the default stylesheet', () => {
    expect(SOURCE).not.toContain('--mat-sys-');
  });
});
