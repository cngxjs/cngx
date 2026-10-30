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
