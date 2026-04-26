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
        ignores: ['dist/', 'node_modules/', '.angular/', 'out-tsc/', 'docs/', 'dev-app/', '**/*.spec.ts', 'playwright.config.ts', 'e2e/', 'sheriff.config.ts'],
    },

  // Re-enable rules that Prettier disables but we want to enforce
  {
    files: ['**/*.ts'],
    rules: {
      curly: ['error', 'all'],
    },
  },
);
