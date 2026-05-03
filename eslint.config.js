// @ts-check
/* global __dirname */
const tseslint = require('typescript-eslint');
const angular = require('@angular-eslint/eslint-plugin');
const angularTemplate = require('@angular-eslint/eslint-plugin-template');
const templateParser = require('@angular-eslint/template-parser');
const sheriff = require('@softarc/eslint-plugin-sheriff');

module.exports = tseslint.config(

    // ── TypeScript source files ──────────────────────────────────────────────
    {
        files: ['**/*.ts'],
        extends: [
            ...tseslint.configs.recommended,
            ...tseslint.configs.recommendedTypeChecked,
            ...tseslint.configs.stylisticTypeChecked,
        ],
        plugins: {
            '@angular-eslint': angular,
        },
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                projectService: true,
                // @ts-ignore
                tsconfigRootDir: __dirname,
            },
        },
        rules: {
            // Angular-specific rules
            '@angular-eslint/no-empty-lifecycle-method': 'error',
            '@angular-eslint/no-output-rename': 'error',
            '@angular-eslint/no-output-on-prefix': 'error',
            '@angular-eslint/prefer-standalone': 'error',
            '@angular-eslint/use-lifecycle-interface': 'error',
            '@angular-eslint/component-selector': [
                'error',
                { type: 'element', prefix: 'cngx', style: 'kebab-case' },
            ],
            '@angular-eslint/directive-selector': [
                'error',
                { type: 'attribute', prefix: 'cngx', style: 'camelCase' },
            ],

            // TypeScript rules
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/no-floating-promises': 'error',
            '@typescript-eslint/consistent-type-imports': [
                'error',
                { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
            ],
            
            curly: ['error', 'all'],
            'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
            eqeqeq: ['error', 'always', { null: 'ignore' }],
            'no-return-await': 'off',
            '@typescript-eslint/return-await': ['error', 'in-try-catch'],
        },
    },

    // ── libs: no class suffixes, require host metadata, cngx prefix ──────────
    {
        files: ['projects/core/**/*.ts', 'projects/forms/**/*.ts', 'projects/ui/**/*.ts', 'projects/common/**/*.ts'],
        rules: {
            '@angular-eslint/component-class-suffix': 'off',
            '@angular-eslint/directive-class-suffix': 'off',
            '@angular-eslint/pipe-class-suffix': 'off',
            '@angular-eslint/prefer-host-metadata-property': 'error',
        },
    },

    // ── chart layer/axis atoms: attribute selectors on <svg:g> hosts ─────────
    // The `[cngxAxis]`, `[cngxLine]`, `[cngxArea]`, `[cngxBar]`, `[cngxScatter]`,
    // `[cngxThreshold]`, `[cngxBand]` components are intentionally attribute-only:
    // an element selector inside `<svg>` would create an XHTML-namespaced custom
    // element whose SVG-namespaced children would not lay out (jsdom is permissive
    // and would mask this). Allow either element or attribute selectors here so
    // the attribute-form components pass while preset components like
    // `<cngx-sparkline>` (still elements) continue to be enforced.
    {
        files: [
            'projects/common/chart/src/axis/**/*.ts',
            'projects/common/chart/src/layers/**/*.ts',
        ],
        rules: {
            '@angular-eslint/component-selector': [
                'error',
                { type: ['element', 'attribute'], prefix: 'cngx', style: 'camelCase' },
            ],
        },
    },

    // ── HTML templates ────────────────────────────────────────────────────────
    {
        files: ['**/*.html'],
        plugins: {
            '@angular-eslint/template': angularTemplate,
        },
        languageOptions: {
            parser: templateParser,
        },
        rules: {
            '@angular-eslint/template/banana-in-box': 'error',
            '@angular-eslint/template/no-negated-async': 'error',
            '@angular-eslint/template/eqeqeq': 'error',
            '@angular-eslint/template/no-any': 'error',
            '@angular-eslint/template/use-track-by-function': 'warn',
        },
    },

    // ── External-package allowlists ──────────────────────────────────────────
    // Sheriff filters externals out before the dep-rule check, so the
    // "common ↛ @angular/material" / "utils ↛ @angular/*" invariants from
    // CLAUDE.md are enforced here rather than in sheriff.config.ts. Keep
    // these in sync with the per-lib `lib:*` rules in sheriff.config.ts.
    {
        files: ['projects/utils/**/*.ts'],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        {
                            group: ['@angular/*', '@angular/*/**'],
                            message: '@cngx/utils is TypeScript-only — no @angular dependencies allowed.',
                        },
                    ],
                },
            ],
        },
    },
    {
        files: [
            'projects/common/**/*.ts',
            'projects/data-display/treetable/**/*.ts',
            'projects/data-display/src/**/*.ts',
        ],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        {
                            group: ['@angular/material', '@angular/material/**'],
                            message: '@cngx/common and @cngx/data-display (excluding mat-treetable) must not depend on @angular/material.',
                        },
                    ],
                },
            ],
        },
    },

    // ── Sheriff architecture enforcement ─────────────────────────────────────
    // Reads sheriff.config.ts at the workspace root. Applies to library
    // sources and dev-app demos so that demos cannot reach into a library's
    // internals. Specs/e2e/playwright.config.ts stay globally ignored.
    {
        files: ['projects/**/*.ts', 'dev-app/**/*.ts'],
        plugins: { '@softarc/sheriff': sheriff },
        rules: {
            '@softarc/sheriff/dependency-rule': 'error',
            '@softarc/sheriff/encapsulation': 'error',
        },
    },

    // ── dev-app: relax non-Sheriff rules ─────────────────────────────────────
    // dev-app was previously globally ignored. Removing it from the global
    // ignore list is required to give Sheriff bite there, but the demos have
    // never been linted against the library's strict TS rules. Keep those
    // rules off until a separate cleanup pass; Sheriff is the only rule that
    // matters here for now.
    {
        files: ['dev-app/**/*.ts'],
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-floating-promises': 'off',
            '@typescript-eslint/consistent-type-imports': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/return-await': 'off',
            '@typescript-eslint/no-unsafe-assignment': 'off',
            '@typescript-eslint/no-unsafe-member-access': 'off',
            '@typescript-eslint/no-unsafe-call': 'off',
            '@typescript-eslint/no-unsafe-return': 'off',
            '@typescript-eslint/no-unsafe-argument': 'off',
            '@typescript-eslint/no-misused-promises': 'off',
            '@typescript-eslint/restrict-template-expressions': 'off',
            '@typescript-eslint/no-redundant-type-constituents': 'off',
            '@typescript-eslint/no-base-to-string': 'off',
            '@typescript-eslint/prefer-nullish-coalescing': 'off',
            '@typescript-eslint/prefer-optional-chain': 'off',
            '@typescript-eslint/dot-notation': 'off',
            '@typescript-eslint/no-empty-function': 'off',
            '@typescript-eslint/no-inferrable-types': 'off',
            '@typescript-eslint/no-empty-object-type': 'off',
            '@typescript-eslint/no-require-imports': 'off',
            '@typescript-eslint/unbound-method': 'off',
            '@typescript-eslint/require-await': 'off',
            '@typescript-eslint/no-unnecessary-type-assertion': 'off',
            '@typescript-eslint/prefer-promise-reject-errors': 'off',
            '@typescript-eslint/array-type': 'off',
            curly: 'off',
            '@angular-eslint/component-selector': 'off',
            '@angular-eslint/directive-selector': 'off',
            '@angular-eslint/no-empty-lifecycle-method': 'off',
            '@angular-eslint/use-lifecycle-interface': 'off',
            '@angular-eslint/no-output-on-prefix': 'off',
            '@angular-eslint/no-output-rename': 'off',
            '@angular-eslint/prefer-standalone': 'off',
            'no-console': 'off',
        },
    },

    // ── Ignored paths ─────────────────────────────────────────────────────────
    {
        ignores: ['dist/', 'node_modules/', '.angular/', 'out-tsc/', 'docs/', '**/*.spec.ts', 'playwright.config.ts', 'e2e/', 'sheriff.config.ts'],
    },

  // Re-enable rules that Prettier disables but we want to enforce.
  // dev-app is excluded — its overrides above keep curly off until the
  // demos are cleaned up in a separate pass.
  {
    files: ['**/*.ts'],
    ignores: ['dev-app/**/*.ts'],
    rules: {
      curly: ['error', 'all'],
    },
  },
);
