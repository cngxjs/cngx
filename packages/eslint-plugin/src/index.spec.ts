import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { plugin } from './plugin';
import { RULE_METADATA, type RuleId } from './metadata';

const ruleIds = Object.keys(plugin.rules ?? {});
const recommendedRules = (plugin.configs?.recommended as { rules: Record<string, unknown> }[])[0].rules;
const allRules = (plugin.configs?.all as { rules: Record<string, unknown> }[])[0].rules;

describe('@cngx/eslint-plugin harness', () => {
  it('exposes plugin meta and both flat configs', () => {
    expect(plugin.meta?.name).toBe('@cngx/eslint-plugin');
    expect(Array.isArray(plugin.configs?.recommended)).toBe(true);
    expect(Array.isArray(plugin.configs?.all)).toBe(true);
  });

  it('carries the package version in meta, in step with package.json', () => {
    const pkg = JSON.parse(
      readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8'),
    ) as { version: string };
    expect(plugin.meta?.version).toBe(pkg.version);
  });

  it('wires each config to the single shared plugin instance', () => {
    const recommended = plugin.configs?.recommended as { plugins: { cngx: unknown } }[];
    expect(recommended[0].plugins.cngx).toBe(plugin);
  });

  it('registers only known metadata rule ids', () => {
    for (const id of ruleIds) {
      expect(RULE_METADATA[id as RuleId]).toBeDefined();
    }
  });

  it('derives recommended from metadata: every registered non-off TS rule at its severity', () => {
    for (const id of ruleIds) {
      const meta = RULE_METADATA[id as RuleId];
      if (meta.astSurface !== 'ts') {
        continue;
      }
      if (meta.recommendedSeverity === 'off') {
        expect(recommendedRules[`cngx/${id}`]).toBeUndefined();
      } else {
        expect(recommendedRules[`cngx/${id}`]).toBe(meta.recommendedSeverity);
      }
    }
  });

  it('derives all from metadata: every registered TS rule, opt-in lifted to warn', () => {
    for (const id of ruleIds) {
      const meta = RULE_METADATA[id as RuleId];
      if (meta.astSurface !== 'ts') {
        continue;
      }
      const expected = meta.recommendedSeverity === 'off' ? 'warn' : meta.recommendedSeverity;
      expect(allRules[`cngx/${id}`]).toBe(expected);
    }
  });

  it('attaches the template rule to *.html in recommended and all', () => {
    for (const config of [plugin.configs?.recommended, plugin.configs?.all]) {
      const blocks = config as { files?: string[]; rules?: Record<string, unknown> }[];
      const htmlBlock = blocks.find((b) => b.files?.includes('**/*.html'));
      expect(htmlBlock?.rules?.['cngx/menu-trigger-needs-popover-anchor']).toBe('error');
    }
  });

  it('ships dependency-free metadata for all six planned rules', () => {
    const ids = Object.keys(RULE_METADATA);
    expect(ids).toHaveLength(6);
    for (const meta of Object.values(RULE_METADATA)) {
      expect(meta.id).toBeTruthy();
      expect(Object.keys(meta.messages).length).toBeGreaterThan(0);
      expect(['error', 'warn', 'off']).toContain(meta.recommendedSeverity);
      expect(['ts', 'template']).toContain(meta.astSurface);
    }
  });

  it('marks exactly one rule as template-AST (menu-trigger)', () => {
    const template = Object.values(RULE_METADATA).filter((m) => m.astSurface === 'template');
    expect(template.map((m) => m.id)).toEqual(['menu-trigger-needs-popover-anchor']);
  });
});
