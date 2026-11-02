import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

// Coverage guard for pixel snapping of icon glyph boxes. The micro tier draws
// on whole device pixels only when the svg box itself is a whole number of
// pixels, so the base rule in `icon-svg.component.css` rounds it with
// `round(nearest, <size>, 1px)`. Any later rule that sizes a glyph svg
// directly beats that base rule and un-snaps the box without a visible
// failure: the button family, the paginator chevrons and the timeline marker
// each did. This guard scans every stylesheet for a rule whose selector
// reaches an svg and that sets a box length without `round(..., 1px)`.
//
// A rule that resolves to whole pixels by construction (1em of a font size
// that is itself rounded) or that only caps media (an auto inline size next to
// a max block size) is enrolled below with a one-clause reason. The ratchet
// admits only those two reasons.

const REPO_ROOT = resolve(__dirname, '..', '..', '..');

/** Rules that size a glyph svg without rounding, each with its reason. */
const SNAP_EXCEPTIONS: ReadonlyArray<{ file: string; selector: string; note: string }> = [
  {
    file: 'projects/common/display/icon/icon.component.css',
    selector: ':scope > svg',
    note: 'rounded font: 1em of the cngx-icon host font size, which rounds to whole pixels',
  },
  {
    file: 'projects/common/menu-button/menu-button.component.css',
    selector: ':scope svg',
    note: 'rounded font: 1em of the caret cngx-icon font size, which rounds to whole pixels',
  },
  {
    file: 'projects/common/theming/components/cngx-button-group.css',
    selector: '.cngx-button-group__addon > :is(img, svg, picture, video, canvas)',
    note: 'media cap: caps the block size and keeps the ratio, the box comes from the media',
  },
];

const ALLOWED_REASONS = ['rounded font:', 'media cap:'];

const exceptionKeys = new Set(SNAP_EXCEPTIONS.map((entry) => `${entry.file} ${entry.selector}`));

const GLYPH_SELECTOR = /\bsvg\b|\.cngx-icon-svg(?![\w-])|\.cngx-icon-glyph(?![\w-])/;
const BOX_LENGTH = /(?:^|;)\s*((?:min-|max-)?(?:inline-size|block-size|width|height))\s*:\s*([^;]+)/g;

export interface UnsnappedDeclaration {
  readonly selector: string;
  readonly property: string;
  readonly value: string;
}

/**
 * Pure scanner over one stylesheet's text. Exported so the negative fixtures
 * below prove the guard can fail. Comments and SCSS interpolations are
 * stripped first, so prose and `#{$var}` braces never read as rules. Only
 * innermost blocks are scanned: their selector is the one the declarations
 * apply to.
 */
export function scanGlyphBoxes(source: string, scss = false): UnsnappedDeclaration[] {
  let css = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/#\{[^}]*\}/g, 'X');
  if (scss) {
    css = css.replace(/(^|[^:])\/\/[^\n]*/g, '$1');
  }
  const out: UnsnappedDeclaration[] = [];
  for (const block of css.matchAll(/([^{};]+)\{([^{}]*)\}/g)) {
    const selector = block[1].trim().replace(/\s+/g, ' ');
    if (!GLYPH_SELECTOR.test(selector)) {
      continue;
    }
    for (const declaration of block[2].matchAll(BOX_LENGTH)) {
      const value = declaration[2].trim();
      if (/\bround\(\s*nearest\b[\s\S]*,\s*1px\s*\)/.test(value)) {
        continue;
      }
      out.push({ selector, property: declaration[1], value });
    }
  }
  return out;
}

const walkStylesheets = (relDir: string): string[] => {
  const out: string[] = [];
  for (const entry of readdirSync(resolve(REPO_ROOT, relDir))) {
    const rel = `${relDir}/${entry}`;
    if (statSync(resolve(REPO_ROOT, rel)).isDirectory()) {
      if (entry === 'examples') {
        continue;
      }
      out.push(...walkStylesheets(rel));
    } else if (/\.(?:css|scss)$/.test(entry) && !entry.includes('.spec.')) {
      out.push(rel);
    }
  }
  return out;
};

const STYLESHEETS = walkStylesheets('projects');
const scanned = STYLESHEETS.map((file) => ({
  file,
  findings: scanGlyphBoxes(readFileSync(resolve(REPO_ROOT, file), 'utf-8'), file.endsWith('.scss')),
}));

describe('glyph-box snap contract', () => {
  it('finds stylesheets to scan', () => {
    expect(STYLESHEETS.length).toBeGreaterThan(50);
  });

  it('rounds every glyph svg box to whole pixels', () => {
    const unsnapped = scanned.flatMap(({ file, findings }) =>
      findings
        .filter((finding) => !exceptionKeys.has(`${file} ${finding.selector}`))
        .map((finding) => `${file}: ${finding.selector} { ${finding.property}: ${finding.value} }`),
    );
    expect(unsnapped).toEqual([]);
  });

  it('keeps every exception pointing at a live rule', () => {
    const stale = SNAP_EXCEPTIONS.filter(
      (entry) =>
        !scanned.some(
          ({ file, findings }) =>
            file === entry.file && findings.some((finding) => finding.selector === entry.selector),
        ),
    ).map((entry) => `${entry.file} ${entry.selector}`);
    expect(stale).toEqual([]);
  });
});

describe('glyph-box snap exception ratchet', () => {
  it('admits unrounded glyph boxes only for a rounded font or a media cap', () => {
    const otherReasons = SNAP_EXCEPTIONS.filter(
      (entry) => !ALLOWED_REASONS.some((reason) => entry.note.startsWith(reason)),
    ).map((entry) => `${entry.file} ${entry.selector}`);
    expect(otherReasons).toEqual([]);
  });
});

describe('glyph-box snap scanner', () => {
  it('reports an unrounded svg box', () => {
    expect(scanGlyphBoxes('.x > svg { inline-size: 1.25em; block-size: 1.25em; }')).toEqual([
      { selector: '.x > svg', property: 'inline-size', value: '1.25em' },
      { selector: '.x > svg', property: 'block-size', value: '1.25em' },
    ]);
  });

  it('reports an unrounded box on the icon svg class and on a max size', () => {
    const css = '.cngx-icon-svg { width: 0.7em; } .y svg { max-block-size: 2em; }';
    expect(scanGlyphBoxes(css).map((finding) => finding.property)).toEqual([
      'width',
      'max-block-size',
    ]);
  });

  it('reports a round() that does not snap to 1px', () => {
    expect(scanGlyphBoxes('.x svg { width: round(nearest, 1.25em, 2px); }')).toHaveLength(1);
  });

  it('accepts a box rounded to whole pixels', () => {
    const css =
      '.x > svg { inline-size: round(nearest, var(--cngx-x-size, 1.25em), 1px); block-size: round(nearest, 60%, 1px); }';
    expect(scanGlyphBoxes(css)).toEqual([]);
  });

  it('ignores rules that do not reach an svg', () => {
    expect(scanGlyphBoxes('.cngx-icon-svg__micro { width: 1em; } .x img { width: 1em; }')).toEqual(
      [],
    );
  });

  it('ignores rules inside a comment', () => {
    expect(scanGlyphBoxes('/* .x svg { width: 1em; } */ .y { color: red; }')).toEqual([]);
  });

  it('reads the selector through an SCSS interpolation and line comment', () => {
    const scss = '// .z svg { width: 1em; }\n.a #{$sel} > svg { block-size: 1.5em; }';
    expect(scanGlyphBoxes(scss, true)).toEqual([
      { selector: '.a X > svg', property: 'block-size', value: '1.5em' },
    ]);
  });
});
