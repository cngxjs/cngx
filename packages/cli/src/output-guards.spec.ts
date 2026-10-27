// Source: the success criteria "0 imports of @modelcontextprotocol/sdk under
// packages/cli" and "stdout piped: never ANSI"; each guard gets a planted defect.
import { describe, expect, it } from 'vitest';
import { assertNoAnsi, findSdkImports } from './output-guards.js';

// Built by concatenation so this spec file itself never matches the SDK scan.
const SDK = '@modelcontext' + 'protocol/sdk';

describe('assertNoAnsi', () => {
  it('accepts plain markdown', () => {
    expect(() => assertNoAnsi('# CngxSelect\n\n|a|b|\n')).not.toThrow();
  });

  it.each([
    ['a colour sequence', 'ok \u001b[31mred\u001b[0m'],
    ['a cursor sequence', '\u001b[2K\u001b[1G done'],
    ['a hyperlink', '\u001b]8;;https://x\u0007x\u001b]8;;\u0007'],
  ])('fails %s', (_, text) => {
    expect(() => assertNoAnsi(text)).toThrow('ANSI escape sequence');
  });
});

describe('findSdkImports', () => {
  it('passes source without the SDK', () => {
    expect(findSdkImports([{ path: 'a.ts', source: "import { z } from 'zod';\n" }])).toEqual([]);
  });

  it.each([
    ['a static import', `import { McpServer } from '${SDK}/server/mcp.js';`],
    ['a type import', `import type { CallToolResult } from "${SDK}/types.js";`],
    ['a side-effect import', `import '${SDK}';`],
    ['a dynamic import', `const m = await import('${SDK}/server/stdio.js');`],
    ['a re-export', `export { McpServer } from '${SDK}/server/mcp.js';`],
    ['a require', `const sdk = require('${SDK}');`],
  ])('fails %s', (_, source) => {
    expect(findSdkImports([{ path: 'planted.ts', source }])).toEqual(['planted.ts']);
  });
});
