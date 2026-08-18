import { describe, expect, it } from 'vitest';
import { plugin } from './plugin';
import { RULE_METADATA } from './metadata';

describe('@cngx/eslint-plugin harness', () => {
  it('exposes plugin meta and both flat configs', () => {
    expect(plugin.meta?.name).toBe('@cngx/eslint-plugin');
    expect(Array.isArray(plugin.configs?.recommended)).toBe(true);
    expect(Array.isArray(plugin.configs?.all)).toBe(true);
  });

  it('registers no rules yet (Phase 1 scaffold)', () => {
    expect(Object.keys(plugin.rules ?? {})).toHaveLength(0);
  });

  it('wires each config to the single shared plugin instance', () => {
    const recommended = plugin.configs?.recommended as { plugins: { cngx: unknown } }[];
    expect(recommended[0].plugins.cngx).toBe(plugin);
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
