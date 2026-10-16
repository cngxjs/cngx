import { declaredRange, hasArrayLiteral, type PackageManifest, type Tree } from '../../engine';

export interface EslintConfigFacts {
  readonly path: string;
  readonly module: 'esm' | 'cjs';
  /** The default export is an array literal, bare or wrapped in `defineConfig([...])`. */
  readonly editable: boolean;
  /** `@cngx/eslint-plugin` is already loaded. */
  readonly wired: boolean;
}

/** An `.eslintrc*` config ESLint 9 no longer reads. */
export interface LegacyEslintConfigFacts {
  readonly path: string;
}

/** The ESLint packages the app declares; the plugin runs on ESLint 9 or later. */
export interface EslintStackFacts {
  /**
   * The highest major the declared `eslint` range admits (`^8 || ^9` is 9);
   * `undefined` when none is declared or the range is open upward or
   * unreadable, so an unknown range never blocks.
   */
  readonly eslintMajor: number | undefined;
  /** `@angular-eslint/template-parser` is declared; the plugin loads it for templates. */
  readonly templateParser: boolean;
  /** `typescript-eslint`, `@typescript-eslint/parser` or `angular-eslint` is declared. */
  readonly typescriptParser: boolean;
  /** The declared `angular-eslint` range; the template parser follows its version line. */
  readonly angularEslint: string | undefined;
  /**
   * The highest major of the template parser line the app ends up on: its own
   * declared range, else the `angular-eslint` one; `undefined` when neither is
   * declared or the range is open upward or unreadable.
   */
  readonly templateParserMajor: number | undefined;
}

const ESLINT_FLAT_CONFIGS = [
  'eslint.config.js',
  'eslint.config.mjs',
  'eslint.config.cjs',
  'eslint.config.ts',
  'eslint.config.mts',
  'eslint.config.cts',
];

const ESLINT_LEGACY_CONFIGS = [
  '.eslintrc',
  '.eslintrc.json',
  '.eslintrc.js',
  '.eslintrc.cjs',
  '.eslintrc.yaml',
  '.eslintrc.yml',
];

const TYPESCRIPT_PARSERS = ['typescript-eslint', '@typescript-eslint/parser', 'angular-eslint'];

export function detectLegacyEslintConfig(tree: Tree): LegacyEslintConfigFacts | undefined {
  const path = ESLINT_LEGACY_CONFIGS.find((candidate) => tree.exists(candidate));
  return path === undefined ? undefined : { path };
}

export function detectEslintConfig(tree: Tree): EslintConfigFacts | undefined {
  const path = ESLINT_FLAT_CONFIGS.find((candidate) => tree.exists(candidate));
  if (path === undefined) {
    return undefined;
  }
  const content = tree.readText(path);
  // `.js` and `.ts` follow their syntax; the explicit extensions fix the format.
  const esm = /\.m[jt]s$/.test(path) || (/\.[jt]s$/.test(path) && /^\s*(import\s|export\s)/m.test(content));
  return {
    path,
    module: esm ? 'esm' : 'cjs',
    editable: hasArrayLiteral(content, { kind: 'default-export' }),
    wired: content.includes('@cngx/eslint-plugin'),
  };
}

// `A - B` reaches B; `<N` reaches N - 1 (`<9.1` still reaches 9), `<=N`
// reaches N; `^X`, `~X` and `X.x` stay on X; `>`/`>=` alone are open.
// A prerelease or build suffix (`-rc.1`, `+sha`) is consumed with its
// version, so its digits never read as a version of their own.
function highestMajorOf(alternative: string): number | undefined {
  const hyphen = /^\S+\s+-\s+v?(\d+)/.exec(alternative);
  if (hyphen !== null) {
    return Number(hyphen[1]);
  }
  const uppers: number[] = [];
  let pinned: number | undefined;
  for (const [, operator, major, rest] of alternative.matchAll(/(<=|<|>=|>|\^|~|=)?\s*v?(\d+)((?:\.(?:\d+|[xX*]))*)(?:[-+][0-9A-Za-z.+-]*)?/g)) {
    if (operator === '<') {
      uppers.push(/[1-9]/.test(rest) ? Number(major) : Number(major) - 1);
    } else if (operator === '<=') {
      uppers.push(Number(major));
    } else if (operator !== '>' && operator !== '>=') {
      pinned = Number(major);
    }
  }
  return uppers.length > 0 ? Math.min(...uppers) : pinned;
}

function highestMajor(range: string | undefined): number | undefined {
  if (range === undefined) {
    return undefined;
  }
  let highest = 0;
  for (const alternative of range.split('||')) {
    const major = highestMajorOf(alternative.trim());
    if (major === undefined) {
      return undefined;
    }
    highest = Math.max(highest, major);
  }
  return highest;
}

export function detectEslintStack(manifest: PackageManifest): EslintStackFacts {
  return {
    eslintMajor: highestMajor(declaredRange(manifest, 'eslint')),
    templateParser: declaredRange(manifest, '@angular-eslint/template-parser') !== undefined,
    typescriptParser: TYPESCRIPT_PARSERS.some((name) => declaredRange(manifest, name) !== undefined),
    angularEslint: declaredRange(manifest, 'angular-eslint'),
    templateParserMajor: highestMajor(
      declaredRange(manifest, '@angular-eslint/template-parser') ?? declaredRange(manifest, 'angular-eslint'),
    ),
  };
}
