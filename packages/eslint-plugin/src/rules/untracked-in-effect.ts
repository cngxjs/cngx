import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';
import { RULE_METADATA } from '../metadata';
import { createRule } from './create-rule';

const META = RULE_METADATA['untracked-in-effect'];

const SIGNAL_FACTORIES = new Set([
  'signal',
  'computed',
  'input',
  'model',
  'linkedSignal',
  'viewChild',
  'viewChildren',
  'contentChild',
  'contentChildren',
]);
const ALLOWED_CLASS = 'CngxAsyncContainer';
const ALLOW_MARKER = 'cngx-allow-effect-writes';

/** Walk a call's callee chain down to its root object (through member and call links). */
function calleeRoot(callee: TSESTree.MemberExpression): TSESTree.Node {
  let current: TSESTree.Node = callee.object;
  for (;;) {
    if (current.type === AST_NODE_TYPES.MemberExpression) {
      current = current.object;
    } else if (
      current.type === AST_NODE_TYPES.CallExpression &&
      current.callee.type === AST_NODE_TYPES.MemberExpression
    ) {
      current = current.callee.object;
    } else {
      return current;
    }
  }
}

function isCallTo(node: TSESTree.Node, name: string): node is TSESTree.CallExpression {
  return (
    node.type === AST_NODE_TYPES.CallExpression &&
    node.callee.type === AST_NODE_TYPES.Identifier &&
    node.callee.name === name
  );
}

function isFunctionNode(node: TSESTree.Node): boolean {
  return (
    node.type === AST_NODE_TYPES.ArrowFunctionExpression ||
    node.type === AST_NODE_TYPES.FunctionExpression
  );
}

/** The nearest ancestor `effect(fn)` whose callback lexically contains `node`. */
function enclosingEffect(node: TSESTree.Node, ancestors: TSESTree.Node[]): TSESTree.CallExpression | null {
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const a = ancestors[i];
    if (!isCallTo(a, 'effect')) {
      continue;
    }
    const callback = a.arguments[0];
    if (!callback || !isFunctionNode(callback)) {
      continue;
    }
    if (callback.range[0] <= node.range[0] && node.range[1] <= callback.range[1]) {
      return a;
    }
  }
  return null;
}

function wrappedInUntracked(ancestors: TSESTree.Node[], effectCall: TSESTree.CallExpression): boolean {
  return ancestors.some(
    (a) => isCallTo(a, 'untracked') && a.range[0] >= effectCall.range[0] && a.range[1] <= effectCall.range[1],
  );
}

function enclosingClass(ancestors: TSESTree.Node[]): TSESTree.ClassDeclaration | TSESTree.ClassExpression | null {
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const a = ancestors[i];
    if (a.type === AST_NODE_TYPES.ClassDeclaration || a.type === AST_NODE_TYPES.ClassExpression) {
      return a;
    }
  }
  return null;
}

function isSignalFactoryCall(init: TSESTree.Expression | null | undefined): boolean {
  if (init?.type !== AST_NODE_TYPES.CallExpression) {
    return false;
  }
  const callee = init.callee;
  if (callee.type === AST_NODE_TYPES.Identifier) {
    return SIGNAL_FACTORIES.has(callee.name);
  }
  // input.required(), model.required(), viewChild.required(), ...
  return (
    callee.type === AST_NODE_TYPES.MemberExpression &&
    callee.object.type === AST_NODE_TYPES.Identifier &&
    SIGNAL_FACTORIES.has(callee.object.name) &&
    callee.property.type === AST_NODE_TYPES.Identifier &&
    callee.property.name === 'required'
  );
}

function signalFieldNames(
  classNode: TSESTree.ClassDeclaration | TSESTree.ClassExpression,
): Set<string> {
  const names = new Set<string>();
  for (const member of classNode.body.body) {
    if (
      member.type === AST_NODE_TYPES.PropertyDefinition &&
      member.key.type === AST_NODE_TYPES.Identifier &&
      isSignalFactoryCall(member.value)
    ) {
      names.add(member.key.name);
    }
  }
  return names;
}

/**
 * Advisory rule: a call rooted at `this` inside an `effect()` callback that is
 * not wrapped in `untracked()` may subscribe the effect to the callee dedup
 * signals and loop. Signal reads, DOM calls and service calls are statically
 * indistinguishable, so this ships opt-in (`all`/`warn`) with narrowing to cut
 * the obvious false positives: the `CngxAsyncContainer` exception, a
 * `cngx-allow-effect-writes` marker, and single-level reads of locally declared
 * signal fields.
 */
export const untrackedInEffect = createRule({
  name: META.id,
  meta: {
    type: 'suggestion',
    docs: { description: 'Wrap service/side-effect calls inside effect() in untracked().' },
    schema: [],
    messages: META.messages,
  },
  defaultOptions: [],
  create(context) {
    const { sourceCode } = context;

    const hasAllowMarker = (
      classNode: TSESTree.ClassDeclaration | TSESTree.ClassExpression | null,
      effectCall: TSESTree.CallExpression,
    ): boolean => {
      const carries = (node: TSESTree.Node): boolean =>
        sourceCode.getCommentsBefore(node).some((c) => c.value.includes(ALLOW_MARKER));
      if (carries(effectCall)) {
        return true;
      }
      if (!classNode) {
        return false;
      }
      if (carries(classNode)) {
        return true;
      }
      return sourceCode
        .getAllComments()
        .some(
          (c) =>
            c.value.includes(ALLOW_MARKER) &&
            c.range[0] >= classNode.range[0] &&
            c.range[1] <= classNode.range[1],
        );
    };

    return {
      CallExpression(node): void {
        if (node.callee.type !== AST_NODE_TYPES.MemberExpression) {
          return;
        }
        const callee = node.callee;
        if (calleeRoot(callee).type !== AST_NODE_TYPES.ThisExpression) {
          return;
        }

        const ancestors = sourceCode.getAncestors(node);
        const effectCall = enclosingEffect(node, ancestors);
        if (!effectCall || wrappedInUntracked(ancestors, effectCall)) {
          return;
        }

        const classNode = enclosingClass(ancestors);
        if (classNode?.id?.name === ALLOWED_CLASS || hasAllowMarker(classNode, effectCall)) {
          return;
        }

        // Narrowing: a single-level zero-arg read of a declared signal field is a
        // signal read, not a side effect.
        const singleLevel = callee.object.type === AST_NODE_TYPES.ThisExpression;
        if (singleLevel && node.arguments.length === 0 && classNode) {
          const name = callee.property.type === AST_NODE_TYPES.Identifier ? callee.property.name : undefined;
          if (name && signalFieldNames(classNode).has(name)) {
            return;
          }
        }

        context.report({ node, messageId: 'unwrappedCallInEffect' });
      },
    };
  },
});
