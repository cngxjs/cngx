import { describe, expect, it } from 'vitest';

import { addToArrayLiteral, type ArraySelector, countArrayLiterals, hasArrayLiteral, topLevelBindings } from './ts-edit';

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
  it('maps imported names to their module and declared names to undefined', () => {
    const content = `import def, { a, b as c } from 'm';
import * as ns from 'n';
import 'side-effect';
class K {}
function f() {}
const v = 1, w = 2;
export interface I {}
`;

    expect([...topLevelBindings(content)]).toEqual([
      ['def', 'm'],
      ['a', 'm'],
      ['c', 'm'],
      ['ns', 'n'],
      ['K', undefined],
      ['f', undefined],
      ['v', undefined],
      ['w', undefined],
      ['I', undefined],
    ]);
  });
});
