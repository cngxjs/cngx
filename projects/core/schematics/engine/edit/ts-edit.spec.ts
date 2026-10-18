import { describe, expect, it } from 'vitest';

import { readFixture } from '../../testing/run-schematic';
import {
  addToArrayLiteral,
  type ArraySelector,
  countArrayLiterals,
  declaresClass,
  ensureArrayProperty,
  hasArrayElement,
  hasArrayLiteral,
  importsModule,
  insertAfterImports,
  promoteTypeOnlyImport,
  readDecorator,
  readProviderCalls,
  reexportSources,
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

describe('importsModule', () => {
  it('reads import, import-equals and require of the module, commented-out lines aside', () => {
    expect(importsModule("import cngx from '@cngx/eslint-plugin';\n", '@cngx/eslint-plugin')).toBe(true);
    expect(importsModule("import cngx = require('@cngx/eslint-plugin');\n", '@cngx/eslint-plugin')).toBe(true);
    expect(importsModule("const { configs } = require('@cngx/eslint-plugin').default;\n", '@cngx/eslint-plugin')).toBe(true);
    expect(importsModule("// import cngx from '@cngx/eslint-plugin';\n", '@cngx/eslint-plugin')).toBe(false);
    expect(importsModule("const name = '@cngx/eslint-plugin';\n", '@cngx/eslint-plugin')).toBe(false);
  });

  it('reads a dynamic import, awaited and in parentheses', () => {
    expect(importsModule("const cngx = (await import('@cngx/eslint-plugin')).default;\n", '@cngx/eslint-plugin')).toBe(true);
    expect(importsModule("const cngx = await import('@cngx/eslint-plugin');\n", '@cngx/eslint-plugin')).toBe(true);
    expect(importsModule("const { configs } = (require('@cngx/eslint-plugin'));\n", '@cngx/eslint-plugin')).toBe(true);
    expect(importsModule("const cngx = (await import('@cngx/other')).default;\n", '@cngx/eslint-plugin')).toBe(false);
  });
});

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

  it('fills an empty multi-line array without leaving a whitespace-only line before the bracket', () => {
    const content = 'export default [\n    \n];\n';

    expect(addToArrayLiteral(content, DEFAULT, ITEM)).toBe(`export default [\n  ${ITEM}\n];\n`);
    expect(addToArrayLiteral(content.replace(/\n/g, '\r\n'), DEFAULT, ITEM)).toBe(
      `export default [\r\n  ${ITEM}\r\n];\r\n`,
    );
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

describe('declaresClass', () => {
  it('finds a top-level class declaration, exported or not', () => {
    expect(declaresClass('export class App {}\n', 'App')).toBe(true);
    expect(declaresClass('class App {}\n', 'App')).toBe(true);
  });

  it('ignores the word class in comments, strings and other names', () => {
    const content = `// the class App lives elsewhere
const note = 'class App';
export class AppShell {}
export interface App {}
`;

    expect(declaresClass(content, 'App')).toBe(false);
  });
});

describe('reexportSources', () => {
  it('prefers the named re-export over star re-exports', () => {
    const content = "export * from './a';\nexport { App, Other } from './app';\n";

    expect(reexportSources(content, 'App')).toEqual(['./app']);
  });

  it('falls back to every star re-export, skipping named ones for other names', () => {
    const content = "export * from './a';\nexport { Other } from './other';\nexport * as ns from './ns';\nexport * from './b';\n";

    expect(reexportSources(content, 'App')).toEqual(['./a', './b']);
  });

  it('ignores re-exports in comments and aliased re-exports', () => {
    const content = "// export { App } from './commented';\nexport { Root as App } from './root';\n";

    expect(reexportSources(content, 'App')).toEqual([]);
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

    expect(readProviderCalls(content).languagePack).toEqual({
      text: 'pack',
      name: 'cngxLanguagePack',
      module: './cngx-language',
    });
  });

  it('resolves aliased provider callees and a namespace import to their module', () => {
    const content = `import { provideCngxI18n as i18n, withPack as pack } from '@cngx/core/i18n';
import * as lang from '../cngx-language';
export const providers = [i18n(pack(lang.cngxLanguagePack))];
`;

    expect(readProviderCalls(content)).toEqual({
      names: ['provideCngxI18n'],
      languagePack: { text: 'lang.cngxLanguagePack', name: 'cngxLanguagePack', module: '../cngx-language' },
    });
  });

  it('reads no pack without the provider, without a pack, or for a withPack elsewhere', () => {
    expect(readProviderCalls('const p = [provideRouter(routes)];').languagePack).toBeUndefined();
    expect(readProviderCalls('const p = [provideCngxI18n()];').languagePack).toBeUndefined();
    expect(readProviderCalls('const p = [provideOther(withPack(X))]; // provideCngxI18n(withPack(Y))').languagePack).toBeUndefined();
  });
});

const APP: ArraySelector = { kind: 'decorator-imports', className: 'App' };
const TESTBED: ArraySelector = { kind: 'testbed-providers' };

const NGMODULE = `import { NgModule } from '@angular/core';

@NgModule({
  declarations: [
    App
  ],
  imports: [
    BrowserModule
  ],
  bootstrap: [App]
})
export class AppModule { }
`;

const NO_IMPORTS = `import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.html'
})
export class App {}
`;

describe('readDecorator', () => {
  const APP = `import { Component } from '@angular/core';

/** The class App, with a template that says class too. */
@Component({
  selector: 'app-root',
  'templateUrl': './app.html',
  template: '<p>it\\'s the class list</p>',
  imports: [RouterOutlet, ...SHARED],
  host: HOST,
})
export class App {}
`;

  it('reads the properties of the decorator object, whatever the text around it says', () => {
    const reading = readDecorator(APP, 'App', 'Component');
    const properties = reading.kind === 'object' ? reading.properties : undefined;
    const template = properties?.get('template');

    expect(properties?.get('templateUrl')).toMatchObject({ kind: 'string', text: './app.html', quoted: true });
    expect(template).toMatchObject({ kind: 'string', text: "<p>it\\'s the class list</p>", quoted: true });
    expect(template?.kind === 'string' && APP.slice(template.start, template.end)).toBe("<p>it\\'s the class list</p>");
    expect(properties?.get('imports')).toEqual({ kind: 'array', elements: ['RouterOutlet', '...SHARED'] });
    expect(properties?.get('host')).toEqual({ kind: 'other' });
  });

  it('tells a backtick string from an interpolating one', () => {
    const plain = readDecorator("@Component({ template: `<p></p>` })\nexport class App {}\n", 'App', 'Component');
    const interpolating = readDecorator('@Component({ template: `${X}` })\nexport class App {}\n', 'App', 'Component');

    expect(plain.kind === 'object' && plain.properties.get('template')).toMatchObject({ kind: 'string', quoted: false });
    expect(interpolating.kind === 'object' && interpolating.properties.get('template')).toEqual({ kind: 'other' });
  });

  it('reads a decorator without an object literal, another decorator and a missing class apart', () => {
    expect(readDecorator('@Component(ROOT)\nexport class App {}\n', 'App', 'Component')).toEqual({ kind: 'no-object' });
    expect(readDecorator('@NgModule({})\nexport class App {}\n', 'App', 'Component')).toEqual({ kind: 'absent' });
    expect(readDecorator("// class App\nconst x = '@Component({}) class App';\n", 'App', 'Component')).toEqual({ kind: 'absent' });
  });

  it('reads identifier and string-literal keys alike and a shorthand property as other', () => {
    const reading = readDecorator('@Component({ "imports": [A], selector, \'template\': `<p></p>` })\nexport class App {}\n', 'App', 'Component');
    const properties = reading.kind === 'object' ? reading.properties : undefined;

    expect(properties?.get('imports')).toEqual({ kind: 'array', elements: ['A'] });
    expect(properties?.get('template')).toMatchObject({ kind: 'string', quoted: false });
    expect(properties?.get('selector')).toEqual({ kind: 'other' });
  });

  it('reads an object with a spread, a computed key or a key written twice, and a doubled decorator, as unreadable', () => {
    const read = (decorators: string) => readDecorator(`${decorators}\nexport class App {}\n`, 'App', 'Component');

    expect(read('@Component({ ...BASE, imports: [] })')).toEqual({ kind: 'unreadable', cause: 'dynamic' });
    expect(read("@Component({ ['imports']: [] })")).toEqual({ kind: 'unreadable', cause: 'dynamic' });
    expect(read("@Component({ imports: [], 'imports': [A] })")).toEqual({ kind: 'unreadable', cause: 'duplicate' });
    expect(read('@Component({ imports: [] })\n@Component({ imports: [] })')).toEqual({ kind: 'unreadable', cause: 'duplicate' });
  });
});

describe('decorator imports', () => {
  const stockApp = readFixture('scaffold-21')['src/app/app.ts'];

  it('adds to the imports of the @Component on the named class only', () => {
    const content = `${stockApp}\n@Component({ selector: 'app-other', imports: [] })\nexport class Other {}\n`;
    const edited = addToArrayLiteral(content, APP, 'CngxToastOutlet');

    expect(edited).toContain('imports: [RouterOutlet, CngxToastOutlet],');
    expect(edited).toContain("@Component({ selector: 'app-other', imports: [] })");
  });

  it('adds to the imports of an @NgModule, keeping its multi-line layout', () => {
    expect(addToArrayLiteral(NGMODULE, { kind: 'decorator-imports', className: 'AppModule' }, 'CngxToastOutlet')).toContain(
      '  imports: [\n    BrowserModule,\n    CngxToastOutlet\n  ],',
    );
  });

  it('reads an element of the array, not only the array', () => {
    expect(hasArrayLiteral(stockApp, APP)).toBe(true);
    expect(hasArrayElement(stockApp, APP, 'RouterOutlet')).toBe(true);
    expect(hasArrayElement(stockApp, APP, 'CngxToastOutlet')).toBe(false);
    expect(hasArrayElement(stockApp, { kind: 'decorator-imports', className: 'Missing' }, 'RouterOutlet')).toBe(false);
  });

  it('adds a missing imports property after the last one', () => {
    const edited = ensureArrayProperty(NO_IMPORTS, APP);

    expect(edited).toContain("  templateUrl: './app.html',\n  imports: []\n})");
    expect(addToArrayLiteral(edited, APP, 'CngxToastOutlet')).toContain('  imports: [CngxToastOutlet]\n');
  });

  it('adds a missing imports property to a one-line and an empty decorator object', () => {
    expect(ensureArrayProperty("@Component({ selector: 'app-root' })\nexport class App {}\n", APP)).toContain(
      "@Component({ selector: 'app-root', imports: [] })",
    );
    expect(ensureArrayProperty('@Component({})\nexport class App {}\n', APP)).toContain('@Component({ imports: [] })');
  });

  it('leaves an existing imports property alone, also one that is not an array literal', () => {
    const shared = NO_IMPORTS.replace("templateUrl: './app.html'", "templateUrl: './app.html',\n  imports: SHARED");

    expect(ensureArrayProperty(stockApp, APP)).toBe(stockApp);
    expect(ensureArrayProperty(shared, APP)).toBe(shared);
    expect(hasArrayLiteral(shared, APP)).toBe(false);
  });
});

describe('decorator properties, one lookup for readers and editors', () => {
  const stockApp = readFixture('scaffold-21')['src/app/app.ts'];
  const NGMODULE_HOST: ArraySelector = { kind: 'decorator-imports', className: 'AppModule' };

  it.each(["'imports'", '"imports"'])('reads and fills a %s key of a component and an NgModule', (key) => {
    const component = stockApp.replace('imports:', `${key}:`);
    const ngModule = NGMODULE.replace('imports:', `${key}:`);

    expect(hasArrayLiteral(component, APP)).toBe(true);
    expect(hasArrayElement(component, APP, 'RouterOutlet')).toBe(true);
    expect(ensureArrayProperty(component, APP)).toBe(component);
    expect(addToArrayLiteral(component, APP, 'CngxToastOutlet')).toContain(`${key}: [RouterOutlet, CngxToastOutlet],`);
    expect(hasArrayElement(ngModule, NGMODULE_HOST, 'BrowserModule')).toBe(true);
    expect(ensureArrayProperty(ngModule, NGMODULE_HOST)).toBe(ngModule);
  });

  it.each([
    ['a spread', '  ...BASE,\n'],
    ['a computed key', "  ['imports']: [RouterOutlet],\n"],
    ['a shorthand imports', '  imports,\n'],
    ['an identifier imports', '  imports: IMPORTS,\n'],
    ['imports written twice', '  imports: [RouterOutlet],\n  imports: [],\n'],
  ])('never reads or writes a decorator object with %s', (_name, imports) => {
    const content = stockApp.replace('  imports: [RouterOutlet],\n', imports);

    expect(hasArrayLiteral(content, APP)).toBe(false);
    expect(hasArrayElement(content, APP, 'RouterOutlet')).toBe(false);
    expect(ensureArrayProperty(content, APP)).toBe(content);
    expect(() => addToArrayLiteral(content, APP, 'CngxToastOutlet')).toThrow();
  });

  it('never writes into a TestBed object with a spread or providers written twice', () => {
    const spread = 'TestBed.configureTestingModule({ ...BASE, imports: [App] });\n';
    const twice = "TestBed.configureTestingModule({ providers: [], 'providers': [] });\n";
    const quoted = "TestBed.configureTestingModule({ imports: [App], 'providers': [] });\n";

    expect(ensureArrayProperty(spread, TESTBED)).toBe(spread);
    expect(hasArrayLiteral(twice, TESTBED)).toBe(false);
    expect(ensureArrayProperty(twice, TESTBED)).toBe(twice);
    expect(ensureArrayProperty(quoted, TESTBED)).toBe(quoted);
    expect(addToArrayLiteral(quoted, TESTBED, 'provideX()')).toContain("'providers': [provideX()]");
  });
});

describe('TestBed providers', () => {
  const stockSpec = readFixture('scaffold-21')['src/app/app.spec.ts'];

  it('adds a providers array after the imports of the stock spec, keeping its trailing comma', () => {
    const edited = ensureArrayProperty(stockSpec, TESTBED);

    expect(edited).toContain('      imports: [App],\n      providers: [],\n    }).compileComponents();');
    expect(addToArrayLiteral(edited, TESTBED, 'provideFeedback(withToasts(), withBanners())')).toContain(
      '      providers: [provideFeedback(withToasts(), withBanners())],\n',
    );
  });

  it('fills providers that are already there', () => {
    const content = 'TestBed.configureTestingModule({ imports: [App], providers: [provideRouter([])] });\n';

    expect(ensureArrayProperty(content, TESTBED)).toBe(content);
    expect(hasArrayElement(content, TESTBED, 'provideRouter([])')).toBe(true);
    expect(addToArrayLiteral(content, TESTBED, 'provideX()')).toContain('providers: [provideRouter([]), provideX()]');
  });

  it('reports providers that are not an array literal and a spec without configureTestingModule', () => {
    const shared = 'TestBed.configureTestingModule({ providers: SHARED });\n';
    const none = "describe('x', () => {});\n";

    expect(hasArrayLiteral(shared, TESTBED)).toBe(false);
    expect(ensureArrayProperty(shared, TESTBED)).toBe(shared);
    expect(ensureArrayProperty(none, TESTBED)).toBe(none);
    expect(hasArrayLiteral(none, TESTBED)).toBe(false);
  });

  it('keeps CRLF line endings when it adds the property', () => {
    const crlf = stockSpec.replace(/\n/g, '\r\n');

    expect(ensureArrayProperty(crlf, TESTBED)).toContain('      imports: [App],\r\n      providers: [],\r\n');
  });
});
