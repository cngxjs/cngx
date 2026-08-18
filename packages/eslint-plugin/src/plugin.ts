import type { TSESLint } from '@typescript-eslint/utils';
import { RULE_METADATA, type RuleId, type RuleSeverity } from './metadata';
import { noEffectInNgOnInit } from './rules/no-effect-in-ngoninit';
import { untrackedInEffect } from './rules/untracked-in-effect';

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
    // Version is not duplicated here; package.json is the single source of
    // truth. ESLint reads the installed package version when it needs one.
  },
  rules: {
    'no-effect-in-ngoninit': noEffectInNgOnInit,
    'untracked-in-effect': untrackedInEffect,
  },
};

// Configs are derived from RULE_METADATA so severity lives in exactly one place.
// A rule enters a config the moment it is registered above and its metadata
// severity says so - `recommended` takes every registered TS-surface rule whose
// recommendedSeverity is not 'off'; `all` takes every registered TS-surface
// rule, lifting the opt-in ones to 'warn'. Template-surface rules attach to
// *.html in their own config block (added with the template rule).
const registeredTsRuleIds = Object.keys(plugin.rules ?? {}).filter(
  (id): id is RuleId => id in RULE_METADATA && RULE_METADATA[id as RuleId].astSurface === 'ts',
);

function toRulesRecord(severityOf: (severity: RuleSeverity) => RuleSeverity): TSESLint.FlatConfig.Rules {
  const record: TSESLint.FlatConfig.Rules = {};
  for (const id of registeredTsRuleIds) {
    const severity = severityOf(RULE_METADATA[id].recommendedSeverity);
    if (severity !== 'off') {
      record[`cngx/${id}`] = severity;
    }
  }
  return record;
}

const recommended: TSESLint.FlatConfig.Config[] = [
  {
    name: 'cngx/recommended',
    plugins: { cngx: plugin },
    rules: toRulesRecord((severity) => severity),
  },
];

const all: TSESLint.FlatConfig.Config[] = [
  {
    name: 'cngx/all',
    plugins: { cngx: plugin },
    rules: toRulesRecord((severity) => (severity === 'off' ? 'warn' : severity)),
  },
];

plugin.configs = { recommended, all };
