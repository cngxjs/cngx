import { describe, expect, it } from 'vitest';

import { addToArrayLiteral, type ArraySelector, countPropertyArrays, hasArrayLiteral, topLevelBindings } from './ts-edit';

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

  it('selects the first property of that name holding an array, one element per line', () => {
    const config = `export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    { provide: TitleStrategy, useClass: AppTitleStrategy },
  ],
};
`;

    expect(addToArrayLiteral(config, { kind: 'property', name: 'providers' }, 'provideA11yPreferences()')).toBe(
      `export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    { provide: TitleStrategy, useClass: AppTitleStrategy },
    provideA11yPreferences(),
  ],
};
`,
    );
    expect(hasArrayLiteral('export const x = { providers: provide() };', { kind: 'property', name: 'providers' })).toBe(
      false,
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

describe('countPropertyArrays', () => {
  it('counts every property of that name holding an array, nested ones included', () => {
    const content = `const a = { providers: [] };
export const config = { providers: [{ deps: [], providers: [] }], imports: [] };
const b = { providers: provide() };
`;

    expect(countPropertyArrays(content, 'providers')).toBe(3);
    expect(countPropertyArrays(content, 'imports')).toBe(1);
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
