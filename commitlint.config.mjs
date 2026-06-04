// Local commit-message gate (husky commit-msg hook). The hard gate is the
// PR-title check in CI - this catches bad messages before they are pushed.
//
// Conventional Commits, with the cngx scope allow-list. Types and scopes match
// CONTRIBUTING.md; scopes come from the shared module so commitlint and the
// PR-title Action stay aligned.

import { ALL_SCOPES } from './scripts/changelog-scopes.mjs';

/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'perf', 'refactor', 'docs', 'test', 'build', 'ci', 'chore', 'revert'],
    ],
    'scope-enum': [2, 'always', ALL_SCOPES],
    'scope-empty': [2, 'never'],
    'subject-case': [2, 'never', ['sentence-case', 'start-case', 'pascal-case', 'upper-case']],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 100],
  },
};
