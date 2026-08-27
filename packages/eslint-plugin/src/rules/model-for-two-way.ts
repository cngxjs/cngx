import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';
import { RULE_METADATA } from '../metadata';
import { isCalleeIdentifier, isMemberCall } from './ast-utils';
import { createRule } from './create-rule';

const META = RULE_METADATA['model-for-two-way'];

/** input(...) or input.required(...) */
function isInputCall(value: TSESTree.Expression | null | undefined): boolean {
  return isCalleeIdentifier(value, 'input') || isMemberCall(value, 'input', 'required');
}

/**
 * Flags a class that declares both `input(x)` and `output(xChange)`. That pair
 * compiles but only binds one-way; a two-way bindable value is a single
 * `model()`. Pairs on the declared field names (the common authoring shape);
 * alias-renamed bindings are out of scope.
 */
export const modelForTwoWay = createRule({
  name: META.id,
  meta: {
    type: 'problem',
    docs: { description: 'Prefer model() over an input()/output() pair for two-way binding.' },
    schema: [],
    messages: META.messages,
  },
  defaultOptions: [],
  create(context) {
    return {
      ClassBody(node): void {
        const inputs = new Map<string, TSESTree.PropertyDefinition>();
        const outputs = new Set<string>();
        for (const member of node.body) {
          if (member.type !== AST_NODE_TYPES.PropertyDefinition || member.key.type !== AST_NODE_TYPES.Identifier) {
            continue;
          }
          if (isInputCall(member.value)) {
            inputs.set(member.key.name, member);
          } else if (isCalleeIdentifier(member.value, 'output')) {
            outputs.add(member.key.name);
          }
        }
        for (const [name, field] of inputs) {
          if (outputs.has(`${name}Change`)) {
            context.report({ node: field, messageId: 'useModelForTwoWay' });
          }
        }
      },
    };
  },
});
