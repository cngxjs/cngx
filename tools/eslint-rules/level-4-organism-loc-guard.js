'use strict';

/**
 * Custom ESLint rule — caps the source-line count of an Angular
 * `@Component` / `@Directive` class body. Pillar 3 contract for
 * Level-4 organism shells in `cngx`: when a class body grows past
 * the threshold, decompose into a Level-2 helper factory (extract
 * shared brain into `@cngx/common/<lib>` per the
 * `reference_atomic_decompose` pattern).
 *
 * "Source line" = a line inside the class body that is NOT blank
 * and NOT comment-only. Decorators, blank lines, and JSDoc / `//`
 * lines do not count.
 *
 * Default threshold: 150. Override via rule options:
 *
 *   'local/level-4-organism-loc-guard': ['error', { threshold: 150 }]
 *
 * @category eslint-rules
 */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Cap class body source lines for Angular @Component / @Directive ' +
        'classes. Forces decompose to Level-2 helpers when the body grows ' +
        'past the threshold.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          threshold: { type: 'number', minimum: 1 },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      tooLong:
        'Class body has {{count}} source lines; threshold is {{threshold}}. ' +
        'Extract logic into a Level-2 helper factory under @cngx/common/<lib>.',
    },
  },

  create(context) {
    const threshold = context.options[0]?.threshold ?? 150;
    const sourceCode = context.sourceCode ?? context.getSourceCode();
    const lines = sourceCode.lines;

    function isOrganismDecorator(decorator) {
      const expr = decorator.expression;
      if (expr?.type !== 'CallExpression') {
        return false;
      }
      const callee = expr.callee;
      return (
        callee?.type === 'Identifier' &&
        (callee.name === 'Component' || callee.name === 'Directive')
      );
    }

    function countSourceLines(startLine, endLine) {
      let count = 0;
      // Class body opening brace and closing brace lines themselves
      // don't count (`{` and `}` alone aren't "source"). The for-loop
      // iterates strictly between the body delimiters.
      for (let lineNo = startLine + 1; lineNo < endLine; lineNo++) {
        const text = lines[lineNo - 1];
        if (text === undefined) {
          continue;
        }
        const trimmed = text.trim();
        if (trimmed === '') {
          continue;
        }
        if (trimmed.startsWith('//')) {
          continue;
        }
        // JSDoc + block-comment continuation lines (`*`, `/*`, `*/`)
        // count as comment-only.
        if (
          trimmed.startsWith('*') ||
          trimmed.startsWith('/*') ||
          trimmed === '*/'
        ) {
          continue;
        }
        count++;
      }
      return count;
    }

    function check(node) {
      const decorators = node.decorators ?? [];
      if (!decorators.some(isOrganismDecorator)) {
        return;
      }
      const body = node.body;
      if (!body?.loc) {
        return;
      }
      const count = countSourceLines(body.loc.start.line, body.loc.end.line);
      if (count > threshold) {
        context.report({
          node: body,
          messageId: 'tooLong',
          data: { count, threshold },
        });
      }
    }

    return {
      ClassDeclaration: check,
      ClassExpression: check,
    };
  },
};
