import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Coverage guard for the duration-derivation pass (motion-accepted-debt.md §2).
// A registered `@property` component duration token does NOT track a
// `--cngx-duration-*` brand override on its own: the registered `initial-value`
// always wins over the read-site `var()` fallback. Each family therefore SETs
// its token from the scale (`--cngx-<comp>...: var(--cngx-duration-*)`) at its
// host. This manifest is the force that keeps every family enrolled - parity
// with touch-target-coverage.spec.ts and density-tokens.spec.ts.
//
// Two kinds of read-site:
//  - 'real'   : the token is read on the host or on real inner elements, so a
//               host / broadcast SET reaches it. Assert the SET declaration.
//  - 'pseudo' : the token is read on a ::before / ::after. A non-inherited
//               custom property SET on the originating element never reaches its
//               pseudo-elements, so these families flip the `@property` to
//               `inherits: true` and let inheritance carry the value. Assert
//               BOTH the SET declaration AND `inherits: true` - the flip IS the
//               reach mechanism, and a revert would silently stop the pseudo
//               tracking the scale (a string-only check cannot see that).
//
// NOT enforced here: the runtime computed-style reach (that a `--cngx-duration-*`
// override actually re-times a pseudo read). That is the `.internal/` Playwright
// probe in the plan's Validation block; the `inherits: true` assertion is its
// static stand-in for CI.

const REPO_ROOT = resolve(__dirname, '..', '..', '..');

const readRepoCss = (relPath: string): string =>
  readFileSync(resolve(REPO_ROOT, relPath), 'utf-8');

interface DurationFamily {
  readonly file: string;
  readonly token: string;
  readonly kind: 'real' | 'pseudo';
}

// Every registered interaction-duration `@property` token that derives from the
// scale. Essential loops (> 400ms) and reduced-motion pulses are deliberately
// excluded (motion-accepted-debt.md §2 / slice 4.9).
const DURATION_DERIVED_FAMILIES: readonly DurationFamily[] = [
  // @cngx/common + @cngx/data-display
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
    file: 'projects/common/interactive/toggle/toggle.component.css',
    token: '--cngx-toggle-transition',
    kind: 'real',
  },
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
  // @cngx/ui - tabs (pseudo: ink-bar ::after + accent ::before) + sidenav
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
];

// Extract the body of a token's `@property` block (up to its first closing brace).
const propertyBlock = (css: string, token: string): string => {
  const start = css.indexOf(`@property ${token}`);
  if (start === -1) {
    return '';
  }
  const rest = css.slice(start);
  return rest.slice(0, rest.indexOf('}'));
};

describe('duration-derivation coverage manifest', () => {
  it.each(DURATION_DERIVED_FAMILIES)('$file SETs $token from --cngx-duration-*', ({ file, token }) => {
    expect(readRepoCss(file)).toContain(`${token}: var(--cngx-duration-`);
  });

  it.each(DURATION_DERIVED_FAMILIES.filter((f) => f.kind === 'pseudo'))(
    '$file registers $token inherits:true (pseudo-element reach)',
    ({ file, token }) => {
      expect(propertyBlock(readRepoCss(file), token)).toContain('inherits: true');
    },
  );

  it('fixes the manifest size so a bulk edit dropping a family is caught', () => {
    expect(DURATION_DERIVED_FAMILIES.length).toBe(19);
  });
});

describe('duration-derivation leaves the reduced-motion net intact', () => {
  it('motion-tokens.css still collapses durations under data-motion=reduced', () => {
    const net = readRepoCss('projects/core/theming/motion-tokens.css');
    expect(net).toContain('transition-duration: 0.01ms !important');
    expect(net).toContain("[data-motion='reduced']");
  });
});
