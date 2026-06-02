import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Phase 0 baseline. Pins the classic-skin CSS surface so Phase A's
 * re-tune and Phase B's skin-swap show as deliberate diffs against a
 * known-good snapshot rather than silent drift.
 *
 * Happy-dom (the unit-test DOM) cannot resolve `@property`, `@layer`,
 * `@scope`, `color-mix()`, or `oklch()`, so `getComputedStyle().get
 * PropertyValue(...)` returns empty strings for every cngx custom
 * property. The pragmatic regression net reads the source CSS
 * directly and snapshots:
 *
 *   1. the `initial-value` of every `@property --cngx-step-*` block
 *      whose name is touched by Phase A or Phase B,
 *   2. the rule bodies for the four hot-state selectors (resting,
 *      active, completed, errored),
 *   3. the hover and focus-visible state surfaces.
 *
 * Phase A modifies these exact lines. The snapshot diff IS the change
 * ledger reviewers read. Light vs dark is encoded as two axes: the
 * classic skin today defines NO `@media (prefers-color-scheme: dark)`
 * rules, so the dark axis snapshots that absence. If Phase A
 * introduces a dark-mode rule, the dark snapshot diff surfaces it.
 */

const SKIN_PATH = resolve(__dirname, 'stepper.component.css');
const BASE_PATH = resolve(__dirname, 'styles/stepper-base.css');

const TARGET_PROPERTIES = [
  '--cngx-step-active-color',
  '--cngx-step-active-fill',
  '--cngx-step-indicator-bg',
  '--cngx-step-indicator-color',
  '--cngx-step-indicator-active-color',
  '--cngx-step-hover-bg',
  '--cngx-step-completed-color',
  '--cngx-step-errored-color',
  '--cngx-step-pending-color',
  '--cngx-step-focus-offset',
  '--cngx-step-focus-ring',
] as const;

function extractPropertyInitial(css: string, name: string): string {
  const re = new RegExp(
    String.raw`@property\s+${name.replace(/-/g, '\\-')}\s*{[^}]*initial-value\s*:\s*([^;]+);`,
    's',
  );
  const match = css.match(re);
  return match ? match[1].trim() : '<absent>';
}

function extractRuleBody(css: string, selectorPattern: RegExp): string {
  const match = css.match(selectorPattern);
  return match ? match[0].replace(/\s+/g, ' ').trim() : '<absent>';
}

function readDarkModeRules(css: string): string[] {
  const re = /@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)\s*{[^}]*(?:{[^}]*}[^}]*)*}/g;
  return [...css.matchAll(re)].map((m) => m[0].replace(/\s+/g, ' ').trim());
}

describe('CngxStepper classic-skin CSS baseline', () => {
  const skinCss = readFileSync(SKIN_PATH, 'utf-8');
  const baseCss = readFileSync(BASE_PATH, 'utf-8');

  it('light mode: declared initial-values for hot-state custom properties', () => {
    const declared: Record<string, string> = {};
    for (const prop of TARGET_PROPERTIES) {
      const fromSkin = extractPropertyInitial(skinCss, prop);
      const fromBase = extractPropertyInitial(baseCss, prop);
      declared[prop] = fromSkin !== '<absent>' ? fromSkin : fromBase;
    }
    expect(declared).toMatchSnapshot();
  });

  it('light mode: rule bodies for the four hot states', () => {
    const bodies = {
      resting: extractRuleBody(
        skinCss,
        /\.cngx-stepper__indicator\s*{[^}]+background:\s*var\(--cngx-step-indicator-bg[^)]+\)[^}]*}/,
      ),
      active: extractRuleBody(
        skinCss,
        /\.cngx-stepper__step\[aria-current='step'\][^{]*\.cngx-stepper__indicator\s*{[^}]+}/,
      ),
      completed: extractRuleBody(
        skinCss,
        /\.cngx-stepper__indicator\[data-state='success'\]\s*{[^}]+}/,
      ),
      errored: extractRuleBody(
        skinCss,
        /\.cngx-stepper__indicator\[data-state='error'\]\s*{[^}]+}/,
      ),
      hover: extractRuleBody(
        skinCss,
        /\.cngx-stepper__step:hover[^{]+{[^}]+}/,
      ),
      focusVisible: extractRuleBody(
        baseCss,
        /\.cngx-stepper__step:focus-visible\s*{[^}]+}/,
      ),
    };
    expect(bodies).toMatchSnapshot();
  });

  it('dark mode: which @media (prefers-color-scheme: dark) rules ship', () => {
    const darkRulesSkin = readDarkModeRules(skinCss);
    const darkRulesBase = readDarkModeRules(baseCss);
    expect({
      'stepper.component.css': darkRulesSkin,
      'stepper-base.css': darkRulesBase,
    }).toMatchSnapshot();
  });
});
