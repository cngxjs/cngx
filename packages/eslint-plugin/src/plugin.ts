import * as templateParser from '@angular-eslint/template-parser';
import type { TSESLint } from '@typescript-eslint/utils';
import { RULE_METADATA, type RuleAstSurface, type RuleId, type RuleSeverity } from './metadata';
import { noEffectInNgOnInit } from './rules/no-effect-in-ngoninit';
import { untrackedInEffect } from './rules/untracked-in-effect';
import { noBehaviorsubjectLocalState } from './rules/no-behaviorsubject-local-state';
import { modelForTwoWay } from './rules/model-for-two-way';
import { noRequiredOnBridgeInput } from './rules/no-required-on-bridge-input';
import { menuTriggerNeedsPopoverAnchor } from './rules/menu-trigger-needs-popover-anchor';

/**
 * The `@cngx/eslint-plugin` plugin object.
 *
 * Defined as a named export so specs and internal tooling consume it as plain
 * ESM. The package entry (`index.ts`) re-exports it via `export =` so the
 * flat-config default import resolves to the plugin directly; see the header in
 * `index.ts` for why `export default` would break under CJS output.
 */
export const plugin: TSESLint.FlatConfig.Plugin = {
  meta: {
    name: '@cngx/eslint-plugin',
    // ESLint does not read package.json for a plugin's version - flat-config
    // introspection (--print-config, cache keys) uses meta.version or nothing.
    // The literal is drift-guarded against package.json by index.spec.ts.
    version: '0.1.0',
  },
  rules: {
    'no-effect-in-ngoninit': noEffectInNgOnInit,
    'untracked-in-effect': untrackedInEffect,
    'no-behaviorsubject-local-state': noBehaviorsubjectLocalState,
    'model-for-two-way': modelForTwoWay,
    'no-required-on-bridge-input': noRequiredOnBridgeInput,
    'menu-trigger-needs-popover-anchor': menuTriggerNeedsPopoverAnchor,
  },
};

// Configs are derived from RULE_METADATA so severity lives in exactly one place.
// A rule enters a config the moment it is registered above and its metadata
// severity says so. `recommended` takes every registered rule whose
// recommendedSeverity is not 'off'; `all` takes every registered rule, lifting
// the opt-in ones to 'warn'. TS-surface rules attach to TS files (the consumer's
// own parser); template-surface rules attach to *.html under the Angular
// template parser.
const registeredIds = Object.keys(plugin.rules ?? {}).filter(
  (id): id is RuleId => id in RULE_METADATA,
);

function rulesFor(
  surface: RuleAstSurface,
  severityOf: (severity: RuleSeverity) => RuleSeverity,
): TSESLint.FlatConfig.Rules {
  const record: TSESLint.FlatConfig.Rules = {};
  for (const id of registeredIds) {
    if (RULE_METADATA[id].astSurface !== surface) {
      continue;
    }
    const severity = severityOf(RULE_METADATA[id].recommendedSeverity);
    if (severity !== 'off') {
      record[`cngx/${id}`] = severity;
    }
  }
  return record;
}

function buildConfig(severityOf: (severity: RuleSeverity) => RuleSeverity): TSESLint.FlatConfig.Config[] {
  const blocks: TSESLint.FlatConfig.Config[] = [
    {
      name: 'cngx/rules',
      plugins: { cngx: plugin },
      rules: rulesFor('ts', severityOf),
    },
  ];
  const templateRules = rulesFor('template', severityOf);
  if (Object.keys(templateRules).length > 0) {
    blocks.push({
      name: 'cngx/templates',
      files: ['**/*.html'],
      languageOptions: { parser: templateParser },
      plugins: { cngx: plugin },
      rules: templateRules,
    });
  }
  return blocks;
}

const recommended = buildConfig((severity) => severity);
const all = buildConfig((severity) => (severity === 'off' ? 'warn' : severity));

plugin.configs = { recommended, all };
