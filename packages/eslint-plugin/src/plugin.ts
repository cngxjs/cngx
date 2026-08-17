import type { ESLint, Linter } from 'eslint';

/**
 * The `@cngx/eslint-plugin` plugin object.
 *
 * Defined as a named export so specs and future internal tooling consume it as
 * plain ESM. The package entry (`index.ts`) re-exports it via `export =` so the
 * flat-config default import resolves to the plugin directly; see the header in
 * `index.ts` for why `export default` would break under CJS output.
 *
 * Rules land here as later phases register them; Phase 1 ships the scaffold with
 * empty configs and the metadata seam.
 */
export const plugin: ESLint.Plugin = {
  meta: {
    name: '@cngx/eslint-plugin',
    // Version is not duplicated here; package.json is the single source of
    // truth. ESLint reads the installed package version when it needs one.
  },
  rules: {},
};

// Flat configs reference the plugin object itself so `plugins: { cngx: plugin }`
// stays a single shared instance across recommended/all.
const recommended: Linter.Config[] = [
  {
    name: 'cngx/recommended',
    plugins: { cngx: plugin },
    rules: {},
  },
];

const all: Linter.Config[] = [
  {
    name: 'cngx/all',
    plugins: { cngx: plugin },
    rules: {},
  },
];

plugin.configs = { recommended, all };
