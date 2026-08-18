import type { TSESTree } from '@typescript-eslint/utils';
import { RULE_METADATA } from '../metadata';
import { createRule } from './create-rule';

const META = RULE_METADATA['no-effect-in-ngoninit'];

/**
 * Flags `effect(...)` calls inside an `ngOnInit` body. Angular throws NG0203
 * when `effect()` runs outside an injection context, which `ngOnInit` is.
 * Covers both the method form and the arrow-field form of the lifecycle hook.
 */
export const noEffectInNgOnInit = createRule({
  name: META.id,
  meta: {
    type: 'problem',
    docs: { description: 'Disallow effect() inside ngOnInit (throws NG0203).' },
    schema: [],
    messages: META.messages,
  },
  defaultOptions: [],
  create(context) {
    const report = (node: TSESTree.CallExpression): void => {
      context.report({ node, messageId: 'effectInNgOnInit' });
    };
    return {
      'MethodDefinition[key.name="ngOnInit"] CallExpression[callee.name="effect"]': report,
      'PropertyDefinition[key.name="ngOnInit"] CallExpression[callee.name="effect"]': report,
    };
  },
});
