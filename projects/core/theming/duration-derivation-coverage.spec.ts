import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

// Coverage guard for the duration-derivation pass (motion-accepted-debt.md §2).
// A registered `@property` component duration token does NOT track a
// `--cngx-duration-*` brand override on its own: the registered `initial-value`
// always wins over the read-site `var()` fallback. Each interaction-duration
// family therefore SETs its token from the scale
// (`--cngx-<comp>...: var(--cngx-duration-*)`) at its host.
//
// This guard has two tiers, matching touch-target-coverage.spec.ts:
//  1. A manifest of derived families, each asserted to carry its scale SET
//     (and, for pseudo-read families, the `inherits: true` reach-proxy).
//  2. A source scan that walks every `@property --cngx-*transition/duration*`
//     token in the tree and fails on any that is neither derived, nor
//     consciously EXCLUDED (essential loops / opt-in hooks), nor the base scale
//     itself. The manifest alone gives false confidence - it only proves the
//     ENROLLED tokens carry their SET; the source scan closes the hole where a
//     new component ships a transition token that silently misses derivation.
//
// Read-site kinds:
//  - 'real'   : read on the host or on real inner elements; a host / broadcast
//               SET reaches it. Assert the scale SET.
//  - 'pseudo' : read on a ::before / ::after. A non-inherited custom property
//               SET on the originating element never reaches its pseudo-
//               elements, so these families rely on `inherits: true` +
//               inheritance. Assert the scale SET AND `inherits: true` - the
//               flip IS the reach mechanism.
//
// NOT enforced: the runtime computed-style reach (that an override actually
// re-times a pseudo). That is the `.internal/` Playwright probe in the plan's
// Validation block; `inherits: true` is its static CI stand-in.

const REPO_ROOT = resolve(__dirname, '..', '..', '..');

const readRepoCss = (relPath: string): string =>
  readFileSync(resolve(REPO_ROOT, relPath), 'utf-8');

const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

interface DurationFamily {
  readonly file: string;
  readonly token: string;
  readonly kind: 'real' | 'pseudo';
}

// Every registered interaction-duration `@property` token that derives from the
// scale. Essential loops (> 400ms) and reduced-motion pulses are excluded
// (see DURATION_EXCLUDED).
const DURATION_DERIVED_FAMILIES: readonly DurationFamily[] = [
  // @cngx/common
  {
    file: 'projects/common/theming/components/cngx-dialog.css',
    token: '--cngx-dialog-transition-duration',
    kind: 'real',
  },
  {
    file: 'projects/common/theming/components/cngx-backdrop.css',
    token: '--cngx-backdrop-transition-duration',
    kind: 'real',
  },
  {
    file: 'projects/common/theming/components/cngx-tooltip.css',
    token: '--cngx-tooltip-transition-duration',
    kind: 'real',
  },
  {
    file: 'projects/common/popover/popover-panel.component.css',
    token: '--cngx-popover-panel-transition-duration',
    kind: 'real',
  },
  {
    file: 'projects/common/popover/popover-action.component.css',
    token: '--cngx-popover-action-transition',
    kind: 'real',
  },
  {
    file: 'projects/common/interactive/toggle/toggle.component.css',
    token: '--cngx-toggle-transition',
    kind: 'real',
  },
  {
    file: 'projects/common/interactive/close-button/close-button.css',
    token: '--cngx-close-button-transition',
    kind: 'real',
  },
  {
    file: 'projects/common/display/chip/chip.component.css',
    token: '--cngx-chip-transition',
    kind: 'real',
  },
  {
    file: 'projects/common/display/radio-indicator/radio-indicator.component.css',
    token: '--cngx-radio-indicator-transition',
    kind: 'real',
  },
  // @cngx/data-display
  {
    file: 'projects/data-display/treetable/treetable.component.css',
    token: '--cngx-treetable-row-transition-duration',
    kind: 'real',
  },
  {
    file: 'projects/data-display/treetable/treetable.component.css',
    token: '--cngx-treetable-toggle-transition-duration',
    kind: 'real',
  },
  // @cngx/forms
  {
    file: 'projects/forms/theming/components/cngx-file-drop.css',
    token: '--cngx-file-drop-transition',
    kind: 'real',
  },
  // @cngx/ui - feedback
  {
    file: 'projects/ui/feedback/alert/alert.css',
    token: '--cngx-alert-collapse-duration',
    kind: 'real',
  },
  {
    file: 'projects/ui/feedback/alert/alert.css',
    token: '--cngx-alert-enter-duration',
    kind: 'real',
  },
  {
    file: 'projects/ui/feedback/alert/alert.css',
    token: '--cngx-alert-exit-duration',
    kind: 'real',
  },
  {
    file: 'projects/ui/feedback/toast/toast-outlet.css',
    token: '--cngx-toast-enter-duration',
    kind: 'real',
  },
  {
    file: 'projects/ui/feedback/banner/banner-outlet.css',
    token: '--cngx-banner-enter-duration',
    kind: 'real',
  },
  {
    file: 'projects/ui/feedback/loading/loading-overlay.css',
    token: '--cngx-overlay-transition-duration',
    kind: 'real',
  },
  {
    file: 'projects/ui/feedback/loading/progress.css',
    token: '--cngx-progress-transition-duration',
    kind: 'real',
  },
  // @cngx/ui - action-button + paginator
  {
    file: 'projects/ui/action-button/action-button.css',
    token: '--cngx-action-btn-transition',
    kind: 'real',
  },
  {
    // Read on .cngx-paginator__page::after; reach via the already-registered
    // inherits:true (no flip was needed).
    file: 'projects/ui/paginator/paginator.component.css',
    token: '--cngx-paginator-motion-duration',
    kind: 'pseudo',
  },
  {
    file: 'projects/ui/paginator/paginator.component.css',
    token: '--cngx-paginator-fade-duration',
    kind: 'real',
  },
  // @cngx/ui - tabs (pseudo: ink-bar ::after + accent ::before) + sidenav + speak
  {
    file: 'projects/ui/tabs/tab-group.component.css',
    token: '--cngx-tab-transition-duration',
    kind: 'pseudo',
  },
  {
    file: 'projects/ui/sidenav/sidenav.css',
    token: '--cngx-sidenav-transition-duration',
    kind: 'real',
  },
  {
    file: 'projects/ui/speak/speak-button.css',
    token: '--cngx-speak-btn-transition',
    kind: 'real',
  },
];

// Registered transition/duration tokens that deliberately do NOT derive from
// the scale, each with a one-clause reason. Essential loops (> 400ms) keep the
// "still working" signal at a legible cadence; reduced-motion pulses are the
// motion-net carve-out; opt-in hooks default to no transition.
const DURATION_EXCLUDED: ReadonlyArray<{ token: string; reason: string }> = [
  { token: '--cngx-tab-rejected-pulse-duration', reason: 'rejection attention pulse loop (600ms, > 400ms)' },
  { token: '--cngx-ripple-duration', reason: 'ripple expansion (0.5s, > 400ms)' },
  { token: '--cngx-timeline-pulse-duration', reason: 'live-marker pulse loop (1.6s)' },
  { token: '--cngx-alert-icon-pulse-duration', reason: 'icon attention pulse on enter, not a scale-timed interaction' },
  { token: '--cngx-bar-duration', reason: 'indeterminate bar sweep loop (1.5s)' },
  { token: '--cngx-pulse-duration', reason: 'loading pulse loop (2s); also the reduced-motion carve-out duration' },
  { token: '--cngx-spin-duration', reason: 'spinner rotation loop (0.8s)' },
  { token: '--cngx-progress-indeterminate-duration', reason: 'indeterminate sweep loop (1.5s)' },
  { token: '--cngx-skeleton-shimmer-duration', reason: 'skeleton shimmer loop (1.5s)' },
  { token: '--cngx-recycler-placeholder-shimmer-duration', reason: 'fast-fling placeholder shimmer loop (1.4s)' },
  { token: '--cngx-dialog-backdrop-transition', reason: 'opt-in hook, initial-value: none (no default transition to derive)' },
];

// The scale itself - the source every SET derives from, not a consumer.
const SOURCE_SCALE_TOKENS: readonly string[] = [
  '--cngx-duration-fast',
  '--cngx-duration-base',
  '--cngx-duration-slow',
];

// A family derives from the scale when its token has a SET declaration
// (`<token>:`, distinct from the `@property <token> {` registration) whose
// value references `var(--cngx-duration-*)`. Tolerant of multi-property
// shorthand SETs where the scale var() is not the first segment.
const derivesFromScale = (css: string, token: string): boolean =>
  new RegExp(`${escapeRegExp(token)}:[\\s\\S]{0,300}?var\\(--cngx-duration-`).test(css);

// Body of a token's `@property` block (start of the at-rule to its first `}`).
// Anchored on `\s*{` so a prefix-colliding token name cannot mis-target.
const propertyBlock = (css: string, token: string): string => {
  const m = new RegExp(`@property\\s+${escapeRegExp(token)}\\s*\\{`).exec(css);
  if (!m) {
    return '';
  }
  return css.slice(m.index, css.indexOf('}', m.index));
};

// Recursively collect every `.css` under a repo-relative directory.
const walkCss = (relDir: string): string[] => {
  const out: string[] = [];
  for (const entry of readdirSync(resolve(REPO_ROOT, relDir))) {
    const rel = `${relDir}/${entry}`;
    if (statSync(resolve(REPO_ROOT, rel)).isDirectory()) {
      out.push(...walkCss(rel));
    } else if (entry.endsWith('.css')) {
      out.push(rel);
    }
  }
  return out;
};

// Every `@property --cngx-*` token whose NAME carries a transition/duration
// (a time-bearing token), excluding `-easing` (timing-functions, not times).
const TRANSITION_DURATION_PROPERTY = /@property\s+(--cngx-[a-z0-9-]*(?:transition|duration)[a-z0-9-]*)\s*\{/g;

const collectTimeTokens = (): ReadonlyArray<{ token: string; file: string }> => {
  const found: { token: string; file: string }[] = [];
  for (const file of walkCss('projects')) {
    const css = readRepoCss(file);
    for (const m of css.matchAll(TRANSITION_DURATION_PROPERTY)) {
      const token = m[1];
      if (!token.endsWith('-easing')) {
        found.push({ token, file });
      }
    }
  }
  return found;
};

describe('duration-derivation coverage manifest', () => {
  it.each(DURATION_DERIVED_FAMILIES)('$file SETs $token from --cngx-duration-*', ({ file, token }) => {
    expect(derivesFromScale(readRepoCss(file), token)).toBe(true);
  });

  it.each(DURATION_DERIVED_FAMILIES.filter((f) => f.kind === 'pseudo'))(
    '$file registers $token inherits:true (pseudo-element reach)',
    ({ file, token }) => {
      expect(propertyBlock(readRepoCss(file), token)).toContain('inherits: true');
    },
  );

  it('fixes the manifest size so a bulk edit dropping a family is caught', () => {
    expect(DURATION_DERIVED_FAMILIES.length).toBe(25);
  });
});

describe('duration-derivation completeness (source scan)', () => {
  const derived = new Set(DURATION_DERIVED_FAMILIES.map((f) => f.token));
  const excluded = new Set(DURATION_EXCLUDED.map((e) => e.token));
  const source = new Set(SOURCE_SCALE_TOKENS);

  it('never lists a token as both derived and excluded', () => {
    const both = [...derived].filter((t) => excluded.has(t));
    expect(both).toEqual([]);
  });

  it('accounts for every registered transition/duration token', () => {
    const unaccounted = [...new Set(collectTimeTokens().map((t) => t.token))].filter(
      (t) => !derived.has(t) && !excluded.has(t) && !source.has(t),
    );
    expect(
      unaccounted,
      `These @property transition/duration tokens are neither derived from the ` +
        `motion scale, excluded with a reason, nor the base scale itself. Either ` +
        `add a SET-from-scale rule and enroll in DURATION_DERIVED_FAMILIES, or add ` +
        `to DURATION_EXCLUDED with a one-clause reason:\n${unaccounted.join('\n')}`,
    ).toEqual([]);
  });
});

describe('duration-derivation leaves the reduced-motion net intact', () => {
  it('motion-tokens.css still collapses durations under data-motion=reduced', () => {
    const net = readRepoCss('projects/core/theming/motion-tokens.css');
    expect(net).toContain('transition-duration: 0.01ms !important');
    expect(net).toContain("[data-motion='reduced']");
  });
});
