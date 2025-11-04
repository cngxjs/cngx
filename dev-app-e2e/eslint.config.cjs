const cypress = require('eslint-plugin-cypress');

module.exports = [
  {
    files: ['**/*.cy.{ts,js}', 'cypress.config.{ts,js}'],
    plugins: {
      cypress: cypress,
    },
    rules: {
      ...cypress.configs.recommended.rules,
    },
  },
  {
    ignores: [
      '**/dist',
      '**/out-tsc',
      '**/vite.config.*.timestamp*',
      '**/vitest.config.*.timestamp*',
    ],
  },
];
