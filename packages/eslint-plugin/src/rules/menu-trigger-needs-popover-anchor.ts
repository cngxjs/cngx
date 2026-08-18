import type { TSESTree } from '@typescript-eslint/utils';
import { RULE_METADATA } from '../metadata';
import { createRule } from './create-rule';

const META = RULE_METADATA['menu-trigger-needs-popover-anchor'];

const MENU_TRIGGER = 'cngxMenuTrigger';
const POPOVER_TRIGGER = 'cngxPopoverTrigger';

/** Angular template element node: plain attributes and bound inputs both carry a `name`. */
type TemplateElementNode = TSESTree.Node & {
  readonly attributes: readonly { readonly name: string }[];
  readonly inputs: readonly { readonly name: string }[];
};

/**
 * Same-element co-presence check: an element carrying `cngxMenuTrigger` must also
 * carry `cngxPopoverTrigger`. CngxMenuTrigger wires only the menu behaviour and
 * sets no CSS anchor; without the popover trigger on the same element the panel
 * opens unanchored (top-left). Detection stops at co-presence - proving which
 * popover a trigger opens needs cross-element ref resolution and is false-positive
 * prone, and every menu trigger opening a popover needs the anchor regardless.
 */
export const menuTriggerNeedsPopoverAnchor = createRule({
  name: META.id,
  meta: {
    type: 'problem',
    docs: { description: 'Require cngxPopoverTrigger on the same element as cngxMenuTrigger.' },
    schema: [],
    messages: META.messages,
  },
  defaultOptions: [],
  create(context) {
    return {
      Element(node: TemplateElementNode): void {
        const names = [...node.inputs, ...node.attributes].map((a) => a.name);
        if (!names.includes(MENU_TRIGGER) || names.includes(POPOVER_TRIGGER)) {
          return;
        }
        context.report({ node, messageId: 'menuTriggerNeedsAnchor' });
      },
    };
  },
});
