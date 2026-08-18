import * as templateParser from '@angular-eslint/template-parser';
import * as parser from '@typescript-eslint/parser';
import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';

// Wire RuleTester's lifecycle onto vitest's globals-free API.
RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

/**
 * A RuleTester on the TypeScript parser with no type-check program - every cngx
 * rule is syntactic, so the specs stay fast and need no `project` wiring.
 */
export function createRuleTester(): RuleTester {
  return new RuleTester({
    languageOptions: {
      parser,
      ecmaVersion: 2022,
      sourceType: 'module',
    },
  });
}

/** A RuleTester on the Angular template parser, for `*.html` template-AST rules. */
export function createTemplateRuleTester(): RuleTester {
  return new RuleTester({
    languageOptions: {
      parser: templateParser,
    },
  });
}
