import { describe, expect, it } from 'vitest';
import { stripComments } from './from-file.js';

// Doctor cannot import the CLI, so it carries a JavaScript port of the `--from`
// stripper. This spec keeps the two copies one rule. The dynamic import keeps
// `typecheck:tooling` off the untyped `.mjs` (doctor-module.d.ts declares only
// cngx-doctor.mjs), the same way IN_TREE_DOCTOR does in cli-adapter.spec.ts.
const { stripTsComments } = (await import(new URL('../../doctor/doctor/checks.mjs', import.meta.url).href)) as {
  stripTsComments(source: string): string;
};

type Stripper = (source: string) => string;

const CORPUS: Readonly<Record<string, string>> = {
  'line comment': "import { A } from '@cngx/a'; // import { B } from '@cngx/b';\nconst x = 1;\n",
  'block comment': "/* import { B } from '@cngx/b'; */\nimport { A } from '@cngx/a';\n",
  'comment inside an import list': "import { A, /* B, */ C } from '@cngx/a';\n",
  '/* in a regex literal': "const r = /\\/*/;\nimport { A } from '@cngx/a';\n// */\n",
  '// in a string': "const s = 'a // b';\nimport { A } from '@cngx/a';\n",
  '// in a URL': "fetch('https://x'); withToasts();\n",
  '/* in a glob string': "const glob = 'src/*.ts';\nimport { A } from '@cngx/a';\n// */\n",
  'template literal with ${}': 'const t = `a ${b} // c`;\nimport { A } from "@cngx/a";\n',
  'division a / b / c': "const d = a / b / c;\nimport { A } from '@cngx/a';\n",
  'unclosed /*': "import { A } from '@cngx/a';\n/* never closed\nimport { B } from '@cngx/b';\n",
};

function differingCases(corpus: Readonly<Record<string, string>>, a: Stripper, b: Stripper): string[] {
  return Object.entries(corpus)
    .filter(([, source]) => a(source) !== b(source))
    .map(([name]) => name);
}

describe('doctor comment stripper parity', () => {
  it('the doctor port strips every corpus entry exactly like the --from stripper', () => {
    expect(differingCases(CORPUS, stripComments, stripTsComments)).toEqual([]);
  });

  it('tells a different stripper apart (the regex stripper doctor used before the port)', () => {
    const naive: Stripper = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
    expect(differingCases(CORPUS, stripComments, naive)).toEqual(
      expect.arrayContaining(['/* in a regex literal', '// in a string', '// in a URL']),
    );
  });
});
