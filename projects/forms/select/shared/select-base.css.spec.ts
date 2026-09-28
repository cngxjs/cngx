import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Source-text guard for the field-skin rule set. The nine variants share ONE
// rule set in `select-base.css` (already in every variant's `styleUrls`),
// keyed on the `.cngx-field-trigger` class every template carries, so the
// guard's job is twofold: prove all nine templates carry the class in the
// position the host-bound roots expect, and prove no variant has re-grown a
// private copy. The focus rule can only
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

function scopeBlock(head: string): string {
  const at = SHARED.indexOf(head);
  expect(at).toBeGreaterThan(-1);
  return SHARED.slice(at, SHARED.indexOf('\n  }\n', at));
}

const VOID_ELEMENTS = new Set(['input', 'img', 'br', 'hr', 'col', 'source', 'wbr']);

// Element depth of the `.cngx-field-trigger` element, counting the template's
// single root element as depth 0. Control-flow blocks (`@if`, `@let`) render
// no element, so only tags count.
function depthOfTrigger(template: string): number {
  const markup = template.replace(/<!--[\s\S]*?-->/g, '');
  let depth = 0;
  for (const [, closing, tag, attrs, selfClosing] of markup.matchAll(
    /<(\/?)([a-zA-Z][\w-]*)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>/g,
  )) {
    if (closing) {
      depth--;
      continue;
    }
    if (/class="[^"]*\bcngx-field-trigger\b/.test(attrs)) {
      return depth;
    }
    if (!selfClosing && !VOID_ELEMENTS.has(tag.toLowerCase())) {
      depth++;
    }
  }
  return -1;
}

describe('select-family field-skin rule set', () => {
  it('covers every shipped variant', () => {
    expect(VARIANTS.length).toBe(9);
  });

  it.each(VARIANTS)('puts the shared trigger class on the %s trigger', (ns) => {
    const template = read(`${VARIANT_FILES[ns]}.component.html`);
    expect(template).toContain(`class="cngx-${ns}__trigger cngx-field-trigger"`);
  });

  // The skin roots bind to the host with `> * > .cngx-field-trigger`, so a
  // template refactor that wraps the trigger one level deeper must fail here,
  // not silently drop the skin.
  it.each(VARIANTS)('keeps the %s trigger a grandchild of the host', (ns) => {
    expect(depthOfTrigger(read(`${VARIANT_FILES[ns]}.component.html`))).toBe(1);
  });

  it('draws the fill surface and underline from the shared field tokens', () => {
    const fill = scopeBlock("@scope ([data-skin='fill'] > * > .cngx-field-trigger)");
    expect(fill).toContain('--cngx-field-underline-color');
    expect(fill).toContain('--cngx-field-fill-bg');
  });

  it('keeps a select nested in a box inert on the bare root only', () => {
    expect(SHARED).toContain(
      "@scope ([data-skin='bare']:not(.cngx-field-box > *) > * > .cngx-field-trigger)",
    );
    expect(SHARED).toContain("@scope ([data-skin='fill'] > * > .cngx-field-trigger)");
    expect(SHARED).not.toContain('.cngx-field-affix-row');
  });

  it('replaces the focus outline with the underline', () => {
    const fill = scopeBlock("@scope ([data-skin='fill'] > * > .cngx-field-trigger)");
    expect(fill).toContain(':scope.cngx-field-trigger:is(:focus-visible, :focus-within)');
    expect(fill).toContain('--cngx-field-underline-focus-color');
    expect(fill).toContain('--cngx-field-underline-size');
  });

  it('resets a trigger nested in a field box inside cngx.components', () => {
    const selector = '.cngx-field-box[data-skin] > [data-skin] > * > .cngx-field-trigger {';
    const at = SHARED.indexOf(selector);
    expect(at).toBeGreaterThan(SHARED.indexOf('@layer cngx.components'));
    expect(at).toBeLessThan(SHARED.indexOf('@keyframes'));
    const body = SHARED.slice(at, SHARED.indexOf('}', at));
    for (const declaration of ['min-height: 0', 'padding: 0', 'border: 0']) {
      expect(body).toContain(declaration);
    }
    expect(body).not.toContain('outline');
  });

  // The box rings for its main control only; a select that is an affix keeps
  // its own trigger ring, so only non-affix hosts lose the outline.
  it('drops the trigger ring only for a select that is not an affix', () => {
    const flat = SHARED.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
    const rule = flat.slice(flat.indexOf('.cngx-field-box[data-skin] > [data-skin]:not('));
    const head = rule.slice(0, rule.indexOf('{'));
    expect(head).toContain(':not(.cngx-field-prefix, .cngx-field-suffix)');
    expect(rule.slice(rule.indexOf('{'), rule.indexOf('}'))).toContain('outline: none');
  });

  it('binds every trigger selector to the host, never to an ancestor', () => {
    const flat = SHARED.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
    const uses = [...flat.matchAll(/([^{};]*)\.cngx-field-trigger/g)].map((match) => match[1]);
    expect(uses.length).toBeGreaterThan(0);
    for (const prefix of uses) {
      // Inside a host-bound @scope, `:scope.cngx-field-trigger` is the root.
      const boundToHost = prefix.trimEnd().endsWith('> * >') || prefix.trimEnd().endsWith(':scope');
      expect(boundToHost).toBe(true);
    }
  });

  it('derives the shared box padding from the density scale', () => {
    expect(SHARED).toContain('--cngx-field-padding-block: var(--cngx-space-sm)');
    expect(SHARED).toContain('--cngx-field-padding-inline: var(--cngx-space-md)');
    expect(SHARED).not.toContain('--cngx-select-skin-padding');
  });

  it('drops the chip-strip underline reserve', () => {
    expect(SHARED).not.toContain('padding-block-end: calc(');
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
