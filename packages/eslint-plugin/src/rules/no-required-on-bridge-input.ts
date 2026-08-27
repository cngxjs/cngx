import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';
import { RULE_METADATA } from '../metadata';
import { isMemberCall } from './ast-utils';
import { createRule } from './create-rule';

const META = RULE_METADATA['no-required-on-bridge-input'];

const STATEFUL_TOKEN = 'CNGX_STATEFUL';

function hasOptionalTrue(arg: TSESTree.CallExpressionArgument | undefined): boolean {
  if (arg?.type !== AST_NODE_TYPES.ObjectExpression) {
    return false;
  }
  return arg.properties.some(
    (p) =>
      p.type === AST_NODE_TYPES.Property &&
      ((p.key.type === AST_NODE_TYPES.Identifier && p.key.name === 'optional') ||
        (p.key.type === AST_NODE_TYPES.Literal && p.key.value === 'optional')) &&
      p.value.type === AST_NODE_TYPES.Literal &&
      p.value.value === true,
  );
}

/** inject(CNGX_STATEFUL, ...) or inject(X, { optional: true }) - the optional fallback shape. */
function isOptionalFallbackInject(value: TSESTree.Expression | null | undefined): boolean {
  if (
    value?.type !== AST_NODE_TYPES.CallExpression ||
    value.callee.type !== AST_NODE_TYPES.Identifier ||
    value.callee.name !== 'inject'
  ) {
    return false;
  }
  const [token, options] = value.arguments;
  if (token?.type === AST_NODE_TYPES.Identifier && token.name === STATEFUL_TOKEN) {
    return true;
  }
  return hasOptionalTrue(options);
}

/** input.required(...) */
function isRequiredInput(value: TSESTree.Expression | null | undefined): boolean {
  return isMemberCall(value, 'input', 'required');
}

/**
 * Flags `input.required(...)` on a class that injects an optional fallback token
 * (`CNGX_STATEFUL`, or any `inject(X, { optional: true })`). A bridge directive
 * backed by an optional fallback must keep its input optional with an
 * empty-string transform; a required input breaks the fallback path.
 */
export const noRequiredOnBridgeInput = createRule({
  name: META.id,
  meta: {
    type: 'problem',
    docs: { description: 'Disallow input.required() on a directive with an optional fallback token.' },
    schema: [],
    messages: META.messages,
  },
  defaultOptions: [],
  create(context) {
    return {
      ClassBody(node): void {
        let isBridge = false;
        const requiredInputs: TSESTree.PropertyDefinition[] = [];
        for (const member of node.body) {
          if (member.type !== AST_NODE_TYPES.PropertyDefinition) {
            continue;
          }
          if (isOptionalFallbackInject(member.value)) {
            isBridge = true;
          }
          if (isRequiredInput(member.value)) {
            requiredInputs.push(member);
          }
        }
        if (!isBridge) {
          return;
        }
        for (const field of requiredInputs) {
          context.report({ node: field, messageId: 'requiredOnBridgeInput' });
        }
      },
    };
  },
});
