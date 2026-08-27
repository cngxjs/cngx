import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';
import { RULE_METADATA } from '../metadata';
import { isMemberCall } from './ast-utils';
import { createRule } from './create-rule';

const META = RULE_METADATA['no-required-on-bridge-input'];

/** The bridge fallback tokens recognised out of the box. */
const DEFAULT_FALLBACK_TOKENS = ['CNGX_STATEFUL'];

export interface BridgeInputOptions {
  /** Fallback token names that make a class a bridge. Defaults to CNGX_STATEFUL. */
  tokens?: string[];
}

/**
 * `inject(<fallback token>, ...)` - the bridge shape. Deliberately keyed on the
 * NAMED token, not on any `inject(X, { optional: true })`: components inject
 * plenty of unrelated optional tokens (config, ancestors), and a class doing so
 * with a genuinely required pure-data input is not a bridge. The Bridge-Input
 * doctrine leaves pure data inputs untouched, so the trigger must not
 * over-approximate past the tokens that actually carry the fallback state.
 */
function isFallbackInject(value: TSESTree.Expression | null | undefined, tokens: ReadonlySet<string>): boolean {
  if (
    value?.type !== AST_NODE_TYPES.CallExpression ||
    value.callee.type !== AST_NODE_TYPES.Identifier ||
    value.callee.name !== 'inject'
  ) {
    return false;
  }
  const [token] = value.arguments;
  return token?.type === AST_NODE_TYPES.Identifier && tokens.has(token.name);
}

/** input.required(...) */
function isRequiredInput(value: TSESTree.Expression | null | undefined): boolean {
  return isMemberCall(value, 'input', 'required');
}

/**
 * Flags `input.required(...)` on a class that injects a named bridge fallback
 * token (`CNGX_STATEFUL` by default; extend via the `tokens` option for custom
 * equivalents). A bridge directive backed by an optional fallback must keep its
 * input optional with an empty-string transform; a required input breaks the
 * fallback path. Within such a class every `input.required()` is flagged - the
 * rule cannot tell the bridge input from a data input statically, and a bridge
 * atom's inputs are its bridge surface by design.
 */
export const noRequiredOnBridgeInput = createRule<[BridgeInputOptions], keyof typeof META.messages>({
  name: META.id,
  meta: {
    type: 'problem',
    docs: { description: 'Disallow input.required() on a directive with an optional fallback token.' },
    schema: [
      {
        type: 'object',
        properties: {
          tokens: {
            type: 'array',
            items: { type: 'string' },
            description: 'Fallback token names that mark a class as a bridge. Defaults to ["CNGX_STATEFUL"].',
          },
        },
        additionalProperties: false,
      },
    ],
    messages: META.messages,
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const tokens = new Set(options.tokens ?? DEFAULT_FALLBACK_TOKENS);
    return {
      ClassBody(node): void {
        let isBridge = false;
        const requiredInputs: TSESTree.PropertyDefinition[] = [];
        for (const member of node.body) {
          if (member.type !== AST_NODE_TYPES.PropertyDefinition) {
            continue;
          }
          if (isFallbackInject(member.value, tokens)) {
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
