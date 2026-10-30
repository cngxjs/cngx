// Source of expected values: the `--from` row of the "Process and invocation"
// matrix in cngx-cli-core-phase-4-plan.md (CRLF, multi-line, aliased imports and
// `import type` extract like LF; Windows paths go through node:path).

import { win32 } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { extractCngxNames, readCngxNames } from './from-file.js';

const SOURCE = [
  "import { Component } from '@angular/core';",
  "import { CngxSelect, CngxOption as Option } from '@cngx/forms/select';",
  'import {',
  '  CngxPopover,',
  '  CngxTooltip as Tip,',
  "} from '@cngx/common/popover';",
  "import type { CngxAsyncState } from '@cngx/core/utils';",
  "import { type CNGX_SELECT_CONFIG, CngxSelect as Again } from \"@cngx/forms/select\";",
  "import '@cngx/themes/material.css';",
  "import * as cngx from '@cngx/ui';",
  '',
].join('\n');

const EXPECTED = ['CngxSelect', 'CngxOption', 'CngxPopover', 'CngxTooltip', 'CngxAsyncState', 'CNGX_SELECT_CONFIG'];

describe('extractCngxNames', () => {
  it('extracts named @cngx imports, resolving aliases, deduplicated in source order', () => {
    expect(extractCngxNames(SOURCE)).toEqual(EXPECTED);
  });

  it('extracts CRLF sources identically to LF', () => {
    expect(extractCngxNames(SOURCE.replace(/\n/g, '\r\n'))).toEqual(EXPECTED);
  });

  it('ignores side-effect, namespace and non-cngx imports', () => {
    expect(extractCngxNames("import '@cngx/themes';\nimport * as x from '@cngx/ui';\nimport { A } from '@angular/core';\n")).toEqual([]);
  });

  it('keeps the names after a comment inside a multi-line import', () => {
    const source = "import {\n  CngxSelect, // the select\n  CngxChip,\n  /* b */ CngxBadge,\n} from '@cngx/ui';\r\n";

    expect(extractCngxNames(source)).toEqual(['CngxSelect', 'CngxChip', 'CngxBadge']);
  });

  it('ignores a commented-out import and keeps a URL string intact', () => {
    const source = [
      "// import { CngxOld } from '@cngx/core';",
      "/* import { CngxGone } from '@cngx/ui'; */",
      "const docs = 'https://example.com/a//b';",
      "import { CngxSelect } from '@cngx/forms/select';",
    ].join('\n');

    expect(extractCngxNames(source)).toEqual(['CngxSelect']);
  });

  it('keeps a regex literal that contains comment markers', () => {
    const source = [
      'const glob = /[/*]/;',
      'const url = /https?:\\/\\/x/g;',
      'const half = total / 2; // a division, then a comment',
      "import { CngxSelect } from '@cngx/forms/select';",
      'export const re = (s: string) => /\\/*/.test(s);',
      "import { CngxChip } from '@cngx/ui';",
    ].join('\n');

    expect(extractCngxNames(source)).toEqual(['CngxSelect', 'CngxChip']);
  });

  it('reads the named part of a default-plus-named import', () => {
    expect(extractCngxNames("import Def, { CngxSelect } from '@cngx/forms/select';")).toEqual(['CngxSelect']);
  });

  it('tolerates a trailing comma', () => {
    expect(extractCngxNames("import { CngxSelect, } from '@cngx/forms/select';")).toEqual(['CngxSelect']);
  });
});

describe('readCngxNames', () => {
  it('reads a C:\\ path as given, built with path.win32', () => {
    const path = win32.join('C:\\', 'work', 'app', 'app.component.ts');
    const readFile = vi.fn(() => SOURCE);

    expect(readCngxNames(path, readFile)).toEqual(EXPECTED);
    expect(readFile).toHaveBeenCalledWith('C:\\work\\app\\app.component.ts');
  });

  it('lets a read failure through to the caller', () => {
    const readFile = () => {
      throw new Error('ENOENT: no such file');
    };

    expect(() => readCngxNames('missing.ts', readFile)).toThrow('ENOENT');
  });
});
