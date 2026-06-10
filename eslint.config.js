// @ts-check
/* global __dirname */
const tseslint = require('typescript-eslint');
const angular = require('@angular-eslint/eslint-plugin');
const angularTemplate = require('@angular-eslint/eslint-plugin-template');
const templateParser = require('@angular-eslint/template-parser');
const sheriff = require('@softarc/eslint-plugin-sheriff');
const localRules = require('./tools/eslint-rules');

module.exports = tseslint.config(

    // TypeScript source files 
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

    // libs: no class suffixes, require host metadata, cngx prefix 
    {
        files: ['projects/core/**/*.ts', 'projects/forms/**/*.ts', 'projects/ui/**/*.ts', 'projects/common/**/*.ts'],
        rules: {
            '@angular-eslint/component-class-suffix': 'off',
            '@angular-eslint/directive-class-suffix': 'off',
            '@angular-eslint/pipe-class-suffix': 'off',
            '@angular-eslint/prefer-host-metadata-property': 'error',
        },
    },

    // chart layer/axis atoms: attribute selectors on <svg:g> hosts 
    // The `[cngxAxis]`, `[cngxLine]`, `[cngxArea]`, `[cngxBar]`, `[cngxScatter]`,
    // `[cngxThreshold]`, `[cngxBand]` components are intentionally attribute-only:
    // an element selector inside `<svg>` would create an XHTML-namespaced custom
    // element whose SVG-namespaced children would not lay out (jsdom is permissive
    // and would mask this). Allow either element or attribute selectors here so
    // the attribute-form components pass while preset components like
    // `<cngx-sparkline>` (still elements) continue to be enforced.
    {
        files: [
            'projects/common/chart/axis/**/*.ts',
            'projects/common/chart/layers/**/*.ts',
        ],
        rules: {
            '@angular-eslint/component-selector': [
                'error',
                { type: ['element', 'attribute'], prefix: 'cngx', style: 'camelCase' },
            ],
        },
    },

    // HTML templates 
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

    // External-package allowlists ──
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
        files: ['projects/common/**/*.ts', 'projects/data-display/**/*.ts'],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        {
                            group: ['@angular/material', '@angular/material/**'],
                            message: '@cngx/common and @cngx/data-display must not depend on @angular/material.',
                        },
                    ],
                },
            ],
        },
    },

    // Sheriff architecture enforcement.
    // Reads sheriff.config.ts at the workspace root. Applies to library
    // sources only. Examples (stories + Angular app) are globally ignored.
    {
        files: ['projects/**/*.ts'],
        plugins: { '@softarc/sheriff': sheriff },
        rules: {
            '@softarc/sheriff/dependency-rule': 'error',
            '@softarc/sheriff/encapsulation': 'error',
        },
    },

    // Ignored paths
    {
        ignores: ['dist/', 'node_modules/', '.angular/', 'out-tsc/', 'docs/', '**/*.spec.ts', 'playwright.config.ts', 'e2e/', 'sheriff.config.ts', 'projects/**/examples/**', 'examples/**'],
    },

    // Re-enable rules that Prettier disables but we want to enforce.
    {
        files: ['**/*.ts'],
        rules: {
            curly: ['error', 'all'],
        },
    },

    // Level-4 organism class-body LOC guard. Pillar 3 contract:
    // organism shells stay thin (under 150 source lines of class
    // body) so brain logic decomposes into Level-2 helper factories
    // under @cngx/common/<lib>. Scoped to component/directive files
    // in the five organism libs.
    {
        files: [
            'projects/ui/tabs/**/*.component.ts',
            'projects/ui/tabs/**/*.directive.ts',
            'projects/ui/stepper/**/*.component.ts',
            'projects/ui/stepper/**/*.directive.ts',
            'projects/ui/mat-stepper/**/*.component.ts',
            'projects/ui/mat-stepper/**/*.directive.ts',
            'projects/ui/mat-tabs/**/*.component.ts',
            'projects/ui/mat-tabs/**/*.directive.ts',
        ],
        plugins: { local: localRules },
        rules: {
            // Threshold ratchet history (150 → 180 → 200 → 205) and
            // per-bump rationale: `.internal/architektur/tabs-accepted-debt.md §8`.
            'local/level-4-organism-loc-guard': ['error', { threshold: 205 }],
        },
    },

    // Examples generator — plain ESM, no Angular / no TypeScript. Light
    // hygiene rules so the script stays linted alongside the rest of the
    // codebase. Add new files under scripts/examples-gen/ to extend coverage.
    {
        files: ['scripts/examples-gen/**/*.mjs'],
        languageOptions: {
            ecmaVersion: 2024,
            sourceType: 'module',
            globals: {
                console: 'readonly',
                process: 'readonly',
                URL: 'readonly',
                RegExp: 'readonly',
            },
        },
        rules: {
            'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            'no-undef': 'error',
            'prefer-const': 'error',
            'no-var': 'error',
            eqeqeq: ['error', 'always', { null: 'ignore' }],
        },
    },
);
