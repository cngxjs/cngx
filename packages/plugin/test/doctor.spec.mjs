import { describe, expect, it } from 'vitest';
import { DOCTOR_CHECK_METADATA } from '../bin/doctor/metadata.mjs';
import { RULE_METADATA } from '../../eslint-plugin/src/metadata/index.ts';

// The engine behaviour tests (each check, the incremental scan, the CLI exit
// codes, the Track-B symbol drift guard) live with the canonical engine in
// packages/doctor/doctor.spec.mjs. What stays here is the cross-package seam the
// standalone package cannot assert: the plugin ships alongside @cngx/eslint-plugin,
// so it is the only place the doctor copy's metadata can be validated against the
// lint RuleMetadata shape. The plugin's in-process copy is exercised end-to-end by
// the guard hook test (post-tool-use.spec.mjs) and kept byte-identical to the
// package by doctor:copy-check.

describe('doctor metadata mirrors the eslint-plugin RuleMetadata seam', () => {
  it('each doctor record carries the RuleMetadata field set minus astSurface', () => {
    const ruleKeys = Object.keys(Object.values(RULE_METADATA)[0])
      .filter((k) => k !== 'astSurface')
      .sort();
    for (const record of Object.values(DOCTOR_CHECK_METADATA)) {
      expect(Object.keys(record).sort()).toEqual(ruleKeys);
    }
  });

  it('no doctor check id collides with a lint rule id', () => {
    const lintIds = new Set(Object.keys(RULE_METADATA));
    for (const id of Object.keys(DOCTOR_CHECK_METADATA)) {
      expect(lintIds.has(id)).toBe(false);
    }
  });
});
