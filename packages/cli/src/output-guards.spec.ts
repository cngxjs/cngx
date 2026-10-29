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
    ['an ST-terminated hyperlink', '\u001b]8;;https://x\u001b\\x\u001b]8;;\u001b\\'],
    ['a colon sub-parameter colour', '\u001b[38:2:255:0:0mred'],
    ['a CSI with a non-letter final', '\u001b[2~'],
    ['a CSI with an intermediate byte', '\u001b[1 q'],
    ['an 8-bit CSI', 'ok \u009b31mred'],
    ['an 8-bit OSC', '\u009d0;title\u009c'],
    ['a DCS string', '\u001bP1$r0m\u001b\\'],
    ['a two-byte ESC sequence', '\u001bc reset'],
    ['a lone ESC at the end', 'done\u001b'],
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
    ['a backtick dynamic import', `const m = await import(\`${SDK}/server/mcp.js\`);`],
    ['a require.resolve', `const p = require.resolve('${SDK}');`],
    ['a createRequire load (GP9)', `const sdk = createRequire(import.meta.url)("${SDK}");`],
  ])('fails %s', (_, source) => {
    expect(findSdkImports([{ path: 'planted.ts', source }])).toEqual(['planted.ts']);
  });
});
