import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

/**
 * Shared call-shape helpers for the rule implementations. Two shapes recur
 * across rules - a plain `name(...)` call and a `object.property(...)` member
 * call (`input.required(...)`) - so they live here once instead of per rule.
 */

/** `name(...)` */
export function isCalleeIdentifier(value: TSESTree.Expression | null | undefined, name: string): boolean {
  return (
    value?.type === AST_NODE_TYPES.CallExpression &&
    value.callee.type === AST_NODE_TYPES.Identifier &&
    value.callee.name === name
  );
}

/** `object.property(...)` */
export function isMemberCall(
  value: TSESTree.Expression | null | undefined,
  object: string,
  property: string,
): boolean {
  return (
    value?.type === AST_NODE_TYPES.CallExpression &&
    value.callee.type === AST_NODE_TYPES.MemberExpression &&
    value.callee.object.type === AST_NODE_TYPES.Identifier &&
    value.callee.object.name === object &&
    value.callee.property.type === AST_NODE_TYPES.Identifier &&
    value.callee.property.name === property
  );
}
