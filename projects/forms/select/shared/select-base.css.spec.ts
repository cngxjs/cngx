import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Source-text guard for the per-variant field-skin blocks. All nine variant
// stylesheets must carry the same four rules against the same four
// `--cngx-field-*` tokens, so one `withFieldSkin(...)` really does cover the
// whole family and no variant drifts into its own token set. The focus rule
// in particular can only be checked here: the headless geometry run has no
// document focus, so `:focus-visible` / `:focus-within` never match there.

const VARIANTS: ReadonlyArray<{ file: string; ns: string }> = [
  { file: 'single-select/select', ns: 'cngx-select' },
  { file: 'multi-select/multi-select', ns: 'cngx-multi-select' },
  { file: 'combobox/combobox', ns: 'cngx-combobox' },
  { file: 'typeahead/typeahead', ns: 'cngx-typeahead' },
  { file: 'tree-select/tree-select', ns: 'cngx-tree-select' },
  { file: 'action-select/action-select', ns: 'cngx-action-select' },
  { file: 'action-multi-select/action-multi-select', ns: 'cngx-action-multi-select' },
  {
    file: 'reorderable-multi-select/reorderable-multi-select',
    ns: 'cngx-reorderable-multi-select',
  },
  { file: 'select-shell/select-shell', ns: 'cngx-select-shell' },
];

function read(file: string): string {
  return readFileSync(
    resolve(process.cwd(), `projects/forms/select/${file}.component.css`),
    'utf8',
  );
}

describe('select-family field-skin blocks', () => {
  it('covers every shipped variant', () => {
    expect(VARIANTS.length).toBe(9);
  });

  it.each(VARIANTS)('$ns draws the fill surface and underline', ({ file, ns }) => {
    const css = read(file);
    expect(css).toContain(`:scope[data-skin='fill']`);
    expect(css).toContain(`.${ns}__trigger`);
    expect(css).toContain('--cngx-field-underline-color');
    expect(css).toContain('--cngx-field-fill-bg');
  });

  it.each(VARIANTS)('$ns strips chrome for bare', ({ file }) => {
    expect(read(file)).toContain(`:scope[data-skin='bare']`);
  });

  it.each(VARIANTS)('$ns replaces the focus outline with the underline', ({ file }) => {
    const css = read(file);
    expect(css).toContain(':is(:focus-visible, :focus-within)');
    expect(css).toContain('--cngx-field-underline-focus-color');
    expect(css).toContain('--cngx-field-underline-size');
  });

  it.each(VARIANTS)('$ns exempts a trigger nested in a skinned affix row', ({ file }) => {
    expect(read(file)).toContain(':not(.cngx-field-affix-row[data-skin] > *)');
  });

  it.each(VARIANTS)('$ns keeps Material system tokens out of the component CSS', ({ file }) => {
    expect(read(file)).not.toContain('--mat-sys-');
  });
});
