import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';
import { RULE_METADATA } from '../metadata';
import { createRule } from './create-rule';

const META = RULE_METADATA['no-behaviorsubject-local-state'];

const SUBJECT_TYPES = new Set(['BehaviorSubject', 'Subject']);
const STATEFUL_DECORATORS = new Set(['Component', 'Directive']);

function decoratorName(decorator: TSESTree.Decorator): string | undefined {
  const expr = decorator.expression;
  if (expr.type === AST_NODE_TYPES.CallExpression && expr.callee.type === AST_NODE_TYPES.Identifier) {
    return expr.callee.name;
  }
  if (expr.type === AST_NODE_TYPES.Identifier) {
    return expr.name;
  }
  return undefined;
}

function isComponentOrDirective(node: TSESTree.Node): boolean {
  if (node.type !== AST_NODE_TYPES.ClassDeclaration && node.type !== AST_NODE_TYPES.ClassExpression) {
    return false;
  }
  return (node.decorators ?? []).some((d) => {
    const name = decoratorName(d);
    return name !== undefined && STATEFUL_DECORATORS.has(name);
  });
}

/**
 * Flags `new BehaviorSubject(...)` / `new Subject(...)` field initializers on a
 * `@Component`/`@Directive` class. Local component state is a `signal()`, not a
 * Subject (Pillar 1). Scoped to component/directive classes so services keeping
 * genuine RxJS streams are untouched.
 */
export const noBehaviorsubjectLocalState = createRule({
  name: META.id,
  meta: {
    type: 'problem',
    docs: { description: 'Disallow BehaviorSubject/Subject fields for local component state.' },
    schema: [],
    messages: META.messages,
  },
  defaultOptions: [],
  create(context) {
    return {
      PropertyDefinition(node): void {
        const init = node.value;
        if (
          init?.type !== AST_NODE_TYPES.NewExpression ||
          init.callee.type !== AST_NODE_TYPES.Identifier ||
          !SUBJECT_TYPES.has(init.callee.name)
        ) {
          return;
        }
        const classNode = node.parent.parent;
        if (!isComponentOrDirective(classNode)) {
          return;
        }
        context.report({ node: init, messageId: 'behaviorSubjectLocalState' });
      },
    };
  },
});
