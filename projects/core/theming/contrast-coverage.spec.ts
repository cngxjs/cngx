import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Coverage guard for the settable contrast axis (`[data-contrast='more']`,
// `provideContrast` / `injectContrast` / `CngxContrast`). This is a
// single-file integrity + wiring guard, NOT the cross-file completeness scan
// touch-target-coverage.spec.ts runs:
//
// 1. Override integrity - contrast-tokens.css is the correctness mechanism
//    (borders + muted text strengthen app-wide without touching any
//    component). The guard pins that the `more` override exists, gates on
//    BOTH the attribute signal and the OS media query (with the `normal`
//    escape), and - the scheme-agnostic invariant - remaps only via
//    `var(--cngx-color-*)` references, never a colour literal. A light-only
//    literal would silently break dark mode; the assertion makes that a test
//    failure instead of a visual regression.
//
// 2. Cascade wiring - an un-imported core theming CSS is inert, so the
//    overrides could regress to dead without any other test failing. The
//    import assertion locks the commit-1 wiring, parity with the motion
//    guard's import assertion in motion-coverage.spec.ts.
//
// NOT enforced here: forced-colors / Windows-High-Contrast survival. That is
// the deferred Phase 2 wave (contrast-accepted-debt.md §1) - OS-forced, not a
// settable axis, a per-component sweep with its own guard.

const REPO_ROOT = resolve(__dirname, '..', '..', '..');

const readRepoCss = (relPath: string): string =>
  readFileSync(resolve(REPO_ROOT, relPath), 'utf-8');

const CONTRAST_TOKENS_CSS = 'projects/core/theming/contrast-tokens.css';
const THEMES_ENTRY_CSS = 'projects/themes/cngx.css';

describe('contrast-axis override integrity', () => {
  const net = readRepoCss(CONTRAST_TOKENS_CSS);

  it('ships the `more` override UNANCHORED (so the subtree escape-hatch works) with a class twin', () => {
    // The attribute rule must match any host carrying data-contrast='more',
    // not only :root - otherwise `cngxContrast="more"` on a subtree does
    // nothing. Presence of the bare selector + absence of the :root-anchored
    // form pins that, parity with motion-coverage.spec.ts.
    expect(net).toContain("[data-contrast='more']");
    expect(net).not.toContain(":root[data-contrast='more']");
    expect(net).toContain('.cngx-contrast-more');
  });

  it('gates the OS-media rule on `prefers-contrast: more` with a `normal` escape', () => {
    expect(net).toContain('@media (prefers-contrast: more)');
    expect(net).toContain(":root:not([data-contrast='normal'])");
  });

  it('boosts both lowest-contrast surfaces (border + muted text)', () => {
    expect(net).toContain('--cngx-color-border:');
    expect(net).toContain('--cngx-color-text-muted:');
  });

  it('derives the border without reading the simultaneously-demoted muted (anti-collapse)', () => {
    // Both overrides land in one rule. If the border read
    // var(--cngx-color-text-muted), it would resolve against the demoted
    // muted (now full text) and collapse both surfaces onto text - killing
    // the two-tier boost. Pin that the border declaration never references
    // the muted token.
    const borderDecls = net.match(/--cngx-color-border:\s*[^;]+;/g) ?? [];
    expect(borderDecls.length).toBeGreaterThan(0);
    for (const decl of borderDecls) {
      expect(decl).not.toContain('text-muted');
    }
  });

  it('remaps only via var(--cngx-color-*) references - no colour literal (scheme-agnostic)', () => {
    // Every custom-property assignment in the file is an override; each must
    // reference a ramp token so light and dark schemes both stay correct.
    // A hardcoded oklch()/rgb()/hsl()/hex would pin one scheme and is banned.
    const decls = net.match(/--cngx-color-[\w-]+:\s*[^;]+;/g) ?? [];
    expect(decls.length).toBeGreaterThan(0);
    for (const decl of decls) {
      expect(decl).toContain('var(--cngx-color-');
      expect(decl).not.toMatch(/oklch\(|rgb\(|hsl\(|#[0-9a-fA-F]{3,}/);
    }
  });
});

describe('contrast-axis cascade wiring', () => {
  it('@imports contrast-tokens.css into the themes entry (so the overrides are not inert)', () => {
    const entry = readRepoCss(THEMES_ENTRY_CSS);
    expect(entry).toContain("@import '../core/theming/contrast-tokens.css';");
  });
});
