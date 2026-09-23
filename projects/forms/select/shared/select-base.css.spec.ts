import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Source-text guard for the field-skin rule set. The nine variants share ONE
// rule set in `select-base.css` (already in every variant's `styleUrls`), so
// the guard's job is twofold: prove the shared set names all nine triggers,
// and prove no variant has re-grown a private copy. The focus rule can only
// be checked here - the headless geometry run has no document focus, so
// `:focus-visible` / `:focus-within` never match there.

const VARIANTS = [
  'select',
  'multi-select',
  'combobox',
  'typeahead',
  'tree-select',
  'action-select',
  'action-multi-select',
  'reorderable-multi-select',
  'select-shell',
] as const;

const VARIANT_FILES: Readonly<Record<(typeof VARIANTS)[number], string>> = {
  select: 'single-select/select',
  'multi-select': 'multi-select/multi-select',
  combobox: 'combobox/combobox',
  typeahead: 'typeahead/typeahead',
  'tree-select': 'tree-select/tree-select',
  'action-select': 'action-select/action-select',
  'action-multi-select': 'action-multi-select/action-multi-select',
  'reorderable-multi-select': 'reorderable-multi-select/reorderable-multi-select',
  'select-shell': 'select-shell/select-shell',
};

function read(relative: string): string {
  return readFileSync(resolve(process.cwd(), `projects/forms/select/${relative}`), 'utf8');
}

const SHARED = read('shared/select-base.css');

describe('select-family field-skin rule set', () => {
  it('covers every shipped variant', () => {
    expect(VARIANTS.length).toBe(9);
  });

  it.each(VARIANTS)('names the %s trigger', (ns) => {
    expect(SHARED).toContain(`.cngx-${ns}__trigger`);
  });

  it.each(VARIANTS)('names the %s host', (ns) => {
    expect(SHARED).toContain(`.cngx-${ns}`);
  });

  it('draws the fill surface and underline from the shared field tokens', () => {
    expect(SHARED).toContain("[data-skin='fill']");
    expect(SHARED).toContain('--cngx-field-underline-color');
    expect(SHARED).toContain('--cngx-field-fill-bg');
  });

  it('strips chrome for bare', () => {
    expect(SHARED).toContain("[data-skin='bare']");
  });

  it('replaces the focus outline with the underline', () => {
    expect(SHARED).toContain(':is(:focus-visible, :focus-within)');
    expect(SHARED).toContain('--cngx-field-underline-focus-color');
    expect(SHARED).toContain('--cngx-field-underline-size');
  });

  it('exempts a trigger nested in a skinned affix row', () => {
    expect(SHARED).toContain(':not(.cngx-field-affix-row[data-skin] > *)');
  });

  it('derives the skin padding from the density scale', () => {
    expect(SHARED).toContain('--cngx-select-skin-padding-block: var(--cngx-space-sm)');
    expect(SHARED).toContain('--cngx-select-skin-padding-inline: var(--cngx-space-md)');
    expect(SHARED).toContain('--cngx-select-skin-padding-bare: var(--cngx-space-xs)');
  });

  it('restores a focus indicator under forced colours, unlayered and outside @scope', () => {
    const media = SHARED.indexOf('@media (forced-colors: active)');
    expect(media).toBeGreaterThan(-1);
    expect(media).toBeGreaterThan(SHARED.lastIndexOf('@layer cngx.components'));
    expect(SHARED.slice(media)).toContain('outline: 2px solid Highlight');
  });

  // The whole point of the shared set: a variant that re-grows its own copy
  // reintroduces the nine-places-to-fix-one-bug problem.
  it.each(VARIANTS)('keeps %s free of a private skin block', (ns) => {
    expect(read(`${VARIANT_FILES[ns]}.component.css`)).not.toContain('data-skin');
  });

  // Usage, not mentions: select-base.css documents which bridge token maps
  // onto a cngx token in prose, which is fine. A `var(--mat-sys-*)` read is
  // not - that belongs in @cngx/themes.
  it.each(VARIANTS)('reads no Material system token in the %s stylesheet', (ns) => {
    expect(read(`${VARIANT_FILES[ns]}.component.css`)).not.toContain('var(--mat-sys-');
  });

  it('reads no Material system token in the shared stylesheet', () => {
    expect(SHARED).not.toContain('var(--mat-sys-');
  });
});
