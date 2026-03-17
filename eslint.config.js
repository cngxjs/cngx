// @ts-check
/* global __dirname */
const tseslint = require('typescript-eslint');
const angular = require('@angular-eslint/eslint-plugin');
const angularTemplate = require('@angular-eslint/eslint-plugin-template');
const templateParser = require('@angular-eslint/template-parser');

module.exports = tseslint.config(
    // ── TypeScript source files ──────────────────────────────────────────────
    {
        files: ['**/*.ts'],
        extends: [
            ...tseslint.configs.recommended,
        ],
        plugins: {
            '@angular-eslint': angular,
        },
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                project: [
                    'tsconfig.json',
                    'tsconfig.spec.json',
                    'projects/*/tsconfig.lib.json',
                    'projects/*/tsconfig.spec.json',
                    'projects/dev-app/tsconfig.app.json',
                ],
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

    // ── dev-app: use "app" prefix instead of "cngx" ──────────────────────────
    {
        files: ['projects/dev-app/**/*.ts'],
        rules: {
            '@angular-eslint/component-selector': [
                'error',
                { type: 'element', prefix: 'app', style: 'kebab-case' },
            ],
            '@angular-eslint/directive-selector': [
                'error',
                { type: 'attribute', prefix: 'app', style: 'camelCase' },
            ],
            '@angular-eslint/component-class-suffix': 'off',
        },
    },

    // ── Spec files (relaxed rules) ────────────────────────────────────────────
    {
        files: ['**/*.spec.ts'],
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-floating-promises': 'off',
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

    // ── Ignored paths ─────────────────────────────────────────────────────────
    {
        ignores: ['dist/', 'node_modules/', '.angular/', 'out-tsc/', 'docs/'],
    },
);
