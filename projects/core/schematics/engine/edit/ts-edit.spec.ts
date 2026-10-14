import { describe, expect, it } from 'vitest';

import {
  addToArrayLiteral,
  type ArraySelector,
  countArrayLiterals,
  hasArrayLiteral,
  insertAfterImports,
  promoteTypeOnlyImport,
  readProviderCalls,
  topLevelBindings,
} from './ts-edit';

const ROOT_PROVIDERS: ArraySelector = { kind: 'root-providers' };

const DEFAULT: ArraySelector = { kind: 'default-export' };
const ITEM = '...cngx.configs.recommended';

const FLAT_CONFIG = `import cngx from '@cngx/eslint-plugin';

export default [
  { ignores: ['dist'] },
  js.configs.recommended,
];
`;

describe('addToArrayLiteral', () => {
  it('appends to a multi-line default export and keeps the trailing comma', () => {
    expect(addToArrayLiteral(FLAT_CONFIG, DEFAULT, ITEM)).toBe(`import cngx from '@cngx/eslint-plugin';

export default [
  { ignores: ['dist'] },
  js.configs.recommended,
  ${ITEM},
];
`);
  });

  it('keeps the CRLF line endings of the file', () => {
    const crlf = FLAT_CONFIG.replace(/\n/g, '\r\n');

    expect(addToArrayLiteral(crlf, DEFAULT, ITEM)).toBe(
      crlf.replace('  js.configs.recommended,\r\n', `  js.configs.recommended,\r\n  ${ITEM},\r\n`),
    );
  });

  it('appends inline to a single-line array', () => {
    expect(addToArrayLiteral('export default [a, b];\n', DEFAULT, ITEM)).toBe(`export default [a, b, ${ITEM}];\n`);
  });

  it('fills an empty array', () => {
    expect(addToArrayLiteral('module.exports = [];\n', DEFAULT, ITEM)).toBe(`module.exports = [${ITEM}];\n`);
  });

  it('finds the array argument of a wrapper call', () => {
    expect(addToArrayLiteral('export default defineConfig([a]);\n', DEFAULT, ITEM)).toBe(
      `export default defineConfig([a, ${ITEM}]);\n`,
    );
  });

  it('selects a named variable', () => {
    const content = 'const other = [x];\nconst config = [a];\nexport default config;\n';

    expect(addToArrayLiteral(content, { kind: 'variable', name: 'config' }, ITEM)).toBe(
      `const other = [x];\nconst config = [a, ${ITEM}];\nexport default config;\n`,
    );
  });

  it('selects the root providers array, one element per line', () => {
    const config = `export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    { provide: TitleStrategy, useClass: AppTitleStrategy },
  ],
};
`;

    expect(addToArrayLiteral(config, ROOT_PROVIDERS, 'provideA11yPreferences()')).toBe(
      `export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    { provide: TitleStrategy, useClass: AppTitleStrategy },
    provideA11yPreferences(),
  ],
};
`,
    );
  });

  it('is idempotent', () => {
    const once = addToArrayLiteral(FLAT_CONFIG, DEFAULT, ITEM);

    expect(addToArrayLiteral(once, DEFAULT, ITEM)).toBe(once);
  });

  it('throws when the array is missing', () => {
    expect(() => addToArrayLiteral('export default config;\n', DEFAULT, ITEM)).toThrow('No array literal found');
  });
});

describe('hasArrayLiteral', () => {
  it('reports whether the selector resolves to an array', () => {
    expect(hasArrayLiteral(FLAT_CONFIG, DEFAULT)).toBe(true);
    expect(hasArrayLiteral('export default config;\n', DEFAULT)).toBe(false);
    expect(hasArrayLiteral('const config = [];\n', { kind: 'variable', name: 'missing' })).toBe(false);
  });
});

describe('countArrayLiterals', () => {
  it('counts the providers arrays of every root config shape', () => {
    const shapes = [
      'export const appConfig: ApplicationConfig = { providers: [] };',
      'export const appConfig = { providers: [] } satisfies ApplicationConfig;',
      'export const appConfig = ({ providers: [] }) as ApplicationConfig;',
      '@NgModule({ providers: [] }) export class AppModule {}',
      'bootstrapApplication(App, { providers: [] });',
    ];

    expect(shapes.map((content) => countArrayLiterals(content, ROOT_PROVIDERS))).toEqual([1, 1, 1, 1, 1]);
  });

  it('skips providers arrays outside a root config and a root config without an array', () => {
    const content = `const routes: Routes = [{ path: '', providers: [provideAdmin()] }];
const untyped = { providers: [] };
export const appConfig: ApplicationConfig = { providers: rootProviders };
`;

    expect(countArrayLiterals(content, ROOT_PROVIDERS)).toBe(0);
  });

  it('counts each root config, so two read as ambiguous', () => {
    const content = `export const serverConfig: ApplicationConfig = { providers: [] };
export const appConfig: ApplicationConfig = { providers: [{ provide: X, useValue: { providers: [] } }] };
`;

    expect(countArrayLiterals(content, ROOT_PROVIDERS)).toBe(2);
  });

  it('reads 0 or 1 for the other selectors', () => {
    expect(countArrayLiterals(FLAT_CONFIG, DEFAULT)).toBe(1);
    expect(countArrayLiterals('export const x = 1;', DEFAULT)).toBe(0);
  });
});

describe('topLevelBindings', () => {
  const declared = { module: undefined, typeOnly: false };
  const from = (module: string, typeOnly = false) => ({ module, typeOnly });

  it('maps imported names to their module and declared names to no module', () => {
    const content = `import def, { a, b as c } from 'm';
import * as ns from 'n';
import 'side-effect';
class K {}
function f() {}
const v = 1, w = 2;
export interface I {}
`;

    expect([...topLevelBindings(content)]).toEqual([
      ['def', from('m')],
      ['a', from('m')],
      ['c', from('m')],
      ['ns', from('n')],
      ['K', declared],
      ['f', declared],
      ['v', declared],
      ['w', declared],
      ['I', declared],
    ]);
  });

  it('marks type-only imports and reads destructured names and import-equals as declared', () => {
    const content = `import type { A } from 'm';
import { type B, C } from 'm';
import D = require('d');
const { e, f: [g, ...h] } = source;
`;

    expect([...topLevelBindings(content)]).toEqual([
      ['A', from('m', true)],
      ['B', from('m', true)],
      ['C', from('m')],
      ['D', declared],
      ['e', declared],
      ['g', declared],
      ['h', declared],
    ]);
  });
});

describe('promoteTypeOnlyImport', () => {
  it('drops the inline type modifier of the name', () => {
    expect(promoteTypeOnlyImport("import { type a, b } from 'm';\n", 'a', 'm')).toBe("import { a, b } from 'm';\n");
  });

  it('turns a type-only clause into a value import and keeps the other names as types', () => {
    expect(promoteTypeOnlyImport("import type { A, b } from 'm';\n", 'b', 'm')).toBe(
      "import { type A, b } from 'm';\n",
    );
  });

  it('leaves a value import, another module and a missing name alone', () => {
    const content = "import { b } from 'm';\nimport type { c } from 'n';\n";

    expect(promoteTypeOnlyImport(content, 'b', 'm')).toBe(content);
    expect(promoteTypeOnlyImport(content, 'c', 'm')).toBe(content);
    expect(promoteTypeOnlyImport(content, 'x', 'm')).toBe(content);
  });
});

describe('insertAfterImports', () => {
  const STATEMENT = "import cngx from '@cngx/eslint-plugin';";

  it('inserts after the closing line of a multi-line named import', () => {
    const content = `import js from '@eslint/js';
import {
  a,
  b,
} from 'x';

export default [];
`;

    expect(insertAfterImports(content, STATEMENT)).toBe(`import js from '@eslint/js';
import {
  a,
  b,
} from 'x';
${STATEMENT}

export default [];
`);
  });

  it('inserts after a multi-line destructured require and a require property access', () => {
    const content = `const js = require('@eslint/js').default;
const {
  defineConfig,
} = require('eslint/config');

module.exports = defineConfig([]);
`;

    expect(insertAfterImports(content, 'const cngx = require("p");')).toBe(`const js = require('@eslint/js').default;
const {
  defineConfig,
} = require('eslint/config');
const cngx = require("p");

module.exports = defineConfig([]);
`);
  });

  it('counts a type-only import and an import equals declaration', () => {
    expect(insertAfterImports("import type { A } from 'a';\nconst b = 1;\n", STATEMENT)).toBe(
      `import type { A } from 'a';\n${STATEMENT}\nconst b = 1;\n`,
    );
    expect(insertAfterImports("import a = require('a');\nconst b = 1;\n", STATEMENT)).toBe(
      `import a = require('a');\n${STATEMENT}\nconst b = 1;\n`,
    );
  });

  it('ignores an import inside a comment and keeps a trailing comment on its import', () => {
    const content = `import a from 'a'; // keep
/*
import b from 'b';
*/
export default [];
`;

    expect(insertAfterImports(content, STATEMENT)).toBe(`import a from 'a'; // keep
${STATEMENT}
/*
import b from 'b';
*/
export default [];
`);
  });

  it('inserts after a block comment that opens on the last import line', () => {
    const content = `import a from 'a'; /* first
second */
export default [];
`;

    expect(insertAfterImports(content, STATEMENT)).toBe(`import a from 'a'; /* first
second */
${STATEMENT}
export default [];
`);
  });

  it('moves code that shares the last import line below the inserted statement', () => {
    expect(insertAfterImports("import a from 'a'; export default [\n  a,\n];\n", STATEMENT)).toBe(
      `import a from 'a';\n${STATEMENT}\nexport default [\n  a,\n];\n`,
    );
    expect(insertAfterImports("const a = require('a'); /* c */ module.exports = [a];\n", 'const p = require("p");')).toBe(
      "const a = require('a'); /* c */\nconst p = require(\"p\");\nmodule.exports = [a];\n",
    );
    expect(insertAfterImports("'use strict'; module.exports = [];\n", 'const p = require("p");')).toBe(
      "'use strict';\nconst p = require(\"p\");\nmodule.exports = [];\n",
    );
  });

  it('keeps a shebang and the directive prologue first in a file without imports', () => {
    expect(insertAfterImports('#!/usr/bin/env node\nmodule.exports = [];\n', 'const p = require("p");')).toBe(
      '#!/usr/bin/env node\nconst p = require("p");\nmodule.exports = [];\n',
    );
    expect(insertAfterImports("#!/usr/bin/env node\n'use strict'; // strict\nmodule.exports = [];\n", 'const p = require("p");')).toBe(
      "#!/usr/bin/env node\n'use strict'; // strict\nconst p = require(\"p\");\nmodule.exports = [];\n",
    );
    expect(insertAfterImports('"use strict";\nconst x = require("x");\n', 'const p = require("p");')).toBe(
      '"use strict";\nconst x = require("x");\nconst p = require("p");\n',
    );
  });

  it('prepends when the file imports nothing, keeping CRLF line endings', () => {
    expect(insertAfterImports('export default [];\n', STATEMENT)).toBe(`${STATEMENT}\nexport default [];\n`);
    expect(insertAfterImports("import a from 'a';\r\nexport default [];\r\n", STATEMENT)).toBe(
      `import a from 'a';\r\n${STATEMENT}\r\nexport default [];\r\n`,
    );
  });
});

describe('readProviderCalls', () => {
  it('names every provide call in source order, nested and namespaced ones included', () => {
    const content = `export const appConfig = {
  providers: [provideRouter(routes), provideCngxI18n(withPack(pack)), ngHttp.provideHttpClient(withFetch())],
};
`;

    expect(readProviderCalls(content).names).toEqual(['provideRouter', 'provideCngxI18n', 'provideHttpClient']);
  });

  it('skips calls in comments and strings and a bare provide', () => {
    const content = `// provideFeedback()
/* provideToasts() */
const label = 'provideAlerts(';
provide(token);
`;

    expect(readProviderCalls(content)).toEqual({ names: [], languagePack: undefined });
  });

  it('reads the pack passed to withPack inside provideCngxI18n, bare or namespaced', () => {
    expect(readProviderCalls('const p = [provideCngxI18n(withPack(CNGX_LANGUAGE_DE))];').languagePack).toEqual({
      text: 'CNGX_LANGUAGE_DE',
      name: 'CNGX_LANGUAGE_DE',
    });
    expect(readProviderCalls('const p = [provideCngxI18n(withLabels(x), withPack(cngxLanguagePack))];').languagePack).toEqual({
      text: 'cngxLanguagePack',
      name: 'cngxLanguagePack',
    });
    expect(readProviderCalls('const p = [i18n.provideCngxI18n(i18n.withPack(lang.cngxLanguagePack))];').languagePack).toEqual({
      text: 'lang.cngxLanguagePack',
      name: 'cngxLanguagePack',
    });
  });

  it('names the exported symbol behind an aliased import', () => {
    const content = `import { cngxLanguagePack as pack } from './cngx-language';
export const providers = [provideCngxI18n(withPack(pack))];
`;

    expect(readProviderCalls(content).languagePack).toEqual({ text: 'pack', name: 'cngxLanguagePack' });
  });

  it('reads no pack without the provider, without a pack, or for a withPack elsewhere', () => {
    expect(readProviderCalls('const p = [provideRouter(routes)];').languagePack).toBeUndefined();
    expect(readProviderCalls('const p = [provideCngxI18n()];').languagePack).toBeUndefined();
    expect(readProviderCalls('const p = [provideOther(withPack(X))]; // provideCngxI18n(withPack(Y))').languagePack).toBeUndefined();
  });
});
