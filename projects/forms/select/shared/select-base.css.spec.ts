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
    const fill = scopeBlock(
      "@scope ([data-skin='fill']:not(.cngx-field-box > *) > * > .cngx-field-trigger)",
    );
    expect(fill).toContain('--cngx-field-underline-color');
    expect(fill).toContain('--cngx-field-fill-bg');
  });

  it('keeps a select nested in a box inert on both skin roots', () => {
    expect(SHARED).toContain(
      "@scope ([data-skin='bare']:not(.cngx-field-box > *) > * > .cngx-field-trigger)",
    );
    expect(SHARED).toContain(
      "@scope ([data-skin='fill']:not(.cngx-field-box > *) > * > .cngx-field-trigger)",
    );
    expect(SHARED).not.toContain('.cngx-field-affix-row');
  });

  it('replaces the focus outline with the underline', () => {
    const fill = scopeBlock(
      "@scope ([data-skin='fill']:not(.cngx-field-box > *) > * > .cngx-field-trigger)",
    );
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

  it('applies the fill recipes to the trigger: hover, 2px error underline, colour-only disabled', () => {
    const fill = scopeBlock(
      "@scope ([data-skin='fill']:not(.cngx-field-box > *) > * > .cngx-field-trigger)",
    ).replace(/\s+/g, ' ');
    expect(fill).toContain(':scope.cngx-field-trigger:hover {');
    expect(fill).toContain('--cngx-field-fill-bg-hover, color-mix( in oklab,');
    const error = fill.slice(fill.indexOf(":scope.cngx-field-trigger:is( [aria-invalid='true']"));
    expect(error.slice(0, error.indexOf('}'))).toContain(
      'box-shadow: inset 0 calc(var(--cngx-field-border-width, 1px) - var(--cngx-field-underline-size, 2px)) 0',
    );
    const disabled = fill.slice(
      fill.indexOf(":scope.cngx-field-trigger:is([aria-disabled='true']"),
    );
    const body = disabled.slice(0, disabled.indexOf('}'));
    expect(body).toContain('38%');
    expect(body).not.toContain('opacity');
    expect(fill).toContain('--cngx-color-primary-strong');
  });

  // The resting line is the bottom border; an inset shadow alone would paint
  // the focus colour above it and leave the border showing underneath.
  it('paints the trigger border and the shadow in the focus colour as one line', () => {
    const fill = scopeBlock(
      "@scope ([data-skin='fill']:not(.cngx-field-box > *) > * > .cngx-field-trigger)",
    )
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ');
    const focus = fill.slice(
      fill.indexOf(':scope.cngx-field-trigger:is(:focus-visible, :focus-within) {'),
    );
    const body = focus.slice(0, focus.indexOf('}'));
    expect(body).toContain('border-block-end-color: var( --cngx-field-underline-focus-color,');
    expect(body).toContain(
      'calc(var(--cngx-field-border-width, 1px) - var(--cngx-field-underline-size, 2px))',
    );
  });

  it('defaults the placeholder to the muted text colour in every scheme', () => {
    const assignments = [...SHARED.matchAll(/--cngx-select-placeholder-color: ([^;]+);/g)].map(
      (m) => m[1],
    );
    // :root delegation plus the OS-dark, explicit-dark and explicit-light blocks
    expect(assignments).toEqual(Array(4).fill('var(--cngx-color-text-muted)'));
  });

  it('derives the shared box padding from the density scale', () => {
    expect(SHARED).toContain('--cngx-field-padding-block: var(--cngx-space-sm)');
    expect(SHARED).toContain('--cngx-field-padding-inline: var(--cngx-space-md)');
    expect(SHARED).not.toContain('--cngx-select-skin-padding');
  });

  it('mixes the bare error text in oklab so it stays red', () => {
    const bare = scopeBlock(
      "@scope ([data-skin='bare']:not(.cngx-field-box > *) > * > .cngx-field-trigger)",
    );
    expect(bare).toContain('in oklab');
    expect(bare).not.toMatch(/in oklch,\s*var\(--cngx-color-danger/);
  });

  it('applies the bare recipes to the trigger: danger text, inset rings, colour-only disabled', () => {
    const bare = scopeBlock(
      "@scope ([data-skin='bare']:not(.cngx-field-box > *) > * > .cngx-field-trigger)",
    ).replace(/\s+/g, ' ');
    expect(bare).toContain('--cngx-field-bare-error-text-color, var( --cngx-color-danger-text,');
    expect(bare).toContain('outline-offset: -1px');
    expect(bare).toContain('outline-offset: calc(-1 * var(--cngx-field-ring-width, 2px))');
    const disabled = bare.slice(
      bare.indexOf(":scope.cngx-field-trigger:is([aria-disabled='true']"),
    );
    const body = disabled.slice(0, disabled.indexOf('}'));
    expect(body).toContain('border-block-end-style: dotted');
    expect(body).not.toContain('opacity');
  });

  it('uses the registered danger default as the only skin danger fallback literal', () => {
    const skins = SHARED.slice(SHARED.indexOf('/* ── Field skins'));
    const literals = [...skins.matchAll(/--cngx-color-danger, (oklch\([^)]*\))/g)].map((m) => m[1]);
    expect(literals.length).toBeGreaterThan(0);
    expect(new Set(literals)).toEqual(new Set(['oklch(0.6 0.18 25)']));
  });

  it('draws a system-colour edge on a resting bare trigger under forced colours', () => {
    const media = SHARED.slice(SHARED.lastIndexOf('@media (forced-colors: active)'));
    expect(media.replace(/\s+/g, ' ')).toContain(
      "[data-skin='bare']:not(.cngx-field-box > *) > * > .cngx-field-trigger { border: var(--cngx-field-border-width, 1px) solid FieldText; }",
    );
  });

  // Bare hugs its content (no preferred width) unless a container sets the
  // bare inline-size token; without a fallback, an unset token computes to
  // auto, so the content width survives.
  it('sizes a bare select from its content or the container token, keyed on the host', () => {
    const flat = SHARED.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
    expect(flat).toContain("[data-skin='bare']:has(> * > .cngx-field-trigger)::before { display: none; }");
    expect(flat).toContain(
      "[data-skin='bare']:not(.cngx-field-box > *):has(> * > .cngx-field-trigger) { inline-size: var(--cngx-field-bare-inline-size); }",
    );
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

// Disabled and resting states are painted by colour, never opacity, so the
// family ships no opacity knob: a registered one would promise an override
// that nothing reads.
describe('select-family opacity tokens', () => {
  const STYLESHEETS = [
    'shared/select-base.css',
    'tree-select/tree-select-panel.component.css',
    'declarative/option.component.css',
    'declarative/optgroup.component.css',
    ...VARIANTS.map((variant) => `${VARIANT_FILES[variant]}.component.css`),
  ];

  it.each(STYLESHEETS)('%s registers and reads no opacity token', (file) => {
    const code = read(file);
    expect(code).not.toMatch(/@property --cngx-[a-z-]*opacity\b/);
    expect(code).not.toMatch(/var\(\s*--cngx-[a-z-]*opacity\b/);
  });
});
