/**
 * Dependency-free rule metadata for `@cngx/eslint-plugin`.
 *
 * Single source of truth for every rule's id, message catalogue, category and
 * recommended severity. Rules import their `messages` from here so a lint report
 * and any downstream consumer (the planned `@cngx/doctor` CLI) read identical
 * text without the consumer pulling the ESLint runtime.
 *
 * This module imports nothing. Keep it that way: it is the seam other tooling
 * reuses without an ESLint dependency.
 */

export type RuleCategory = 'signal-hygiene' | 'wiring' | 'opt-in';

export type RuleSeverity = 'error' | 'warn' | 'off';

export interface RuleMetadata {
  readonly id: string;
  readonly category: RuleCategory;
  readonly messages: Readonly<Record<string, string>>;
  readonly fixHint: string;
  readonly recommendedSeverity: RuleSeverity;
}

export const RULE_METADATA = {
  'no-effect-in-ngoninit': {
    id: 'no-effect-in-ngoninit',
    category: 'signal-hygiene',
    messages: {
      effectInNgOnInit:
        'effect() inside ngOnInit throws NG0203. Move it to the constructor or a field initializer.',
    },
    fixHint: 'Move the effect() call into the constructor or a field initializer.',
    recommendedSeverity: 'error',
  },
  'untracked-in-effect': {
    id: 'untracked-in-effect',
    category: 'opt-in',
    messages: {
      unwrappedCallInEffect:
        'A service/side-effect call inside effect() should be wrapped in untracked() so the effect does not subscribe to the callee dedup signals.',
    },
    fixHint: 'Wrap the call in untracked(() => ...).',
    recommendedSeverity: 'off',
  },
  'no-behaviorsubject-local-state': {
    id: 'no-behaviorsubject-local-state',
    category: 'signal-hygiene',
    messages: {
      behaviorSubjectLocalState:
        'Local component state belongs in a signal(), not a BehaviorSubject/Subject field.',
    },
    fixHint: 'Replace the Subject field with a signal().',
    recommendedSeverity: 'error',
  },
  'model-for-two-way': {
    id: 'model-for-two-way',
    category: 'wiring',
    messages: {
      useModelForTwoWay:
        'An input(x) plus output(xChange) pair only binds one-way. Use a single model() for two-way binding.',
    },
    fixHint: 'Replace the matching input()/output() pair with a single model().',
    recommendedSeverity: 'error',
  },
  'no-required-on-bridge-input': {
    id: 'no-required-on-bridge-input',
    category: 'wiring',
    messages: {
      requiredOnBridgeInput:
        'A bridge input backed by an optional fallback token must not be input.required(). Use an optional input with an empty-string transform.',
    },
    fixHint:
      'Make the input optional with a transform that coerces empty-string or undefined to undefined.',
    recommendedSeverity: 'error',
  },
  'menu-trigger-needs-popover-anchor': {
    id: 'menu-trigger-needs-popover-anchor',
    category: 'wiring',
    messages: {
      menuTriggerNeedsAnchor:
        'cngxMenuTrigger opening a popover panel needs cngxPopoverTrigger on the same element to set the CSS anchor.',
    },
    fixHint: 'Add cngxPopoverTrigger to the element that carries cngxMenuTrigger.',
    recommendedSeverity: 'error',
  },
} as const satisfies Record<string, RuleMetadata>;

export type RuleId = keyof typeof RULE_METADATA;
