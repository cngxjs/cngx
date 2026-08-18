import { ESLintUtils } from '@typescript-eslint/utils';

/**
 * Shared `RuleCreator` for every cngx rule. The doc URL points at the per-rule
 * reference page (authored in a later phase); ESLint only stores it as
 * `meta.docs.url`.
 */
export const createRule = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/cngxjs/cngx/blob/main/packages/eslint-plugin/docs/rules/${name}.md`,
);
