import { describe, expect, it } from 'vitest';

import { addToArrayLiteral, type ArraySelector, hasArrayLiteral } from './ts-edit';

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
