import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Density-derivation guard for the declarative select building blocks and the
 * panel message states. The SET-from-scale wiring is not observable in jsdom,
 * so this pins it statically off the raw CSS: every compactness token derives
 * from `--cngx-space-*` at its default host, matching how the data-mode panel
 * option already derives (select-base.css:939).
 */

const SELECT_DIR = resolve(__dirname);

function css(rel: string): string {
  return readFileSync(resolve(SELECT_DIR, rel), 'utf8');
}

/** token -> the CSS file(s) that must SET it from the scale. */
function assertScaleSet(fileCss: string, token: string): void {
  expect(fileCss, `${token} must be SET from --cngx-space-*`).toMatch(
    new RegExp(`${token.replace(/-/g, '\\-')}:\\s*var\\(--cngx-space-`),
  );
}

describe('declarative optgroup + select-search density derivation', () => {
  it('derives the optgroup header padding on both the declarative and base headers (kept locked)', () => {
    assertScaleSet(css('declarative/optgroup.component.css'), '--cngx-select-optgroup-padding');
    assertScaleSet(css('shared/select-base.css'), '--cngx-select-optgroup-padding');
  });

  it('derives the select-search host + input padding from the scale', () => {
    const searchCss = css('declarative/select-search.component.css');
    assertScaleSet(searchCss, '--cngx-select-search-padding');
    assertScaleSet(searchCss, '--cngx-select-search-input-padding');
  });
});
