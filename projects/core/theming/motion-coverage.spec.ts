import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Coverage guard for the reduced-motion axis. Two orthogonal concerns:
//
// 1. Safety-net integrity - the global reset in motion-tokens.css is the
//    correctness mechanism (motion collapses app-wide without touching any
//    component). This guard pins its selector shape so a refactor cannot
//    silently anchor the forced rule to `:root` (which would break the
//    CngxMotionScope subtree escape-hatch) or drop the `full` escape from
//    the OS-media rule. It also asserts the file is actually @import'd into
//    projects/themes/cngx.css - an un-imported core theming CSS is inert,
//    so the net could otherwise regress to dead without any test failing.
//
// 2. Refinement integrity - the 34 stylesheets that carry their own
//    `@media (prefers-reduced-motion: reduce)` block are a nicer graceful
//    short-circuit than the hard 0.01ms cut. They are no longer the
//    correctness mechanism (the safety net is), but a bulk edit dropping
//    the refinement should be a reviewable event, so MOTION_AWARE_HOSTS
//    pins them - parity with touch-target-coverage.spec.ts.
//
// NOT enforced here: converging the ~36 hardcoded-duration stylesheets onto
// `--cngx-duration-*` with a SET-from-scale guard. That is the deferred
// Phase 2 wave (motion-accepted-debt.md §1), kept out of Phase 1 to stay
// low-blast.

const REPO_ROOT = resolve(__dirname, '..', '..', '..');

const readRepoCss = (relPath: string): string =>
  readFileSync(resolve(REPO_ROOT, relPath), 'utf-8');

const MOTION_TOKENS_CSS = 'projects/core/theming/motion-tokens.css';
const THEMES_ENTRY_CSS = 'projects/themes/cngx.css';

// The 34 stylesheets that ship a `prefers-reduced-motion` refinement block.
// Kept from `grep -rl "prefers-reduced-motion" projects --include="*.css"`
// (examples excluded). Adding a component with its own block: add it here.
const MOTION_AWARE_HOSTS: readonly string[] = [
  // @cngx/common
  'projects/common/card/card-skeleton.component.css',
  'projects/common/card/card.component.css',
  'projects/common/data/paginate/styles/paginator-base.css',
  'projects/common/display/radio-indicator/radio-indicator.component.css',
  'projects/common/interactive/toggle/toggle.component.css',
  'projects/common/popover/popover-panel.component.css',
  'projects/common/tabs/styles/tabs-base.css',
  'projects/common/theming/components/cngx-bottom-sheet.css',
  'projects/common/theming/components/cngx-dialog.css',
  'projects/common/theming/components/cngx-ripple.css',
  'projects/common/theming/components/cngx-tooltip.css',
  'projects/common/timeline/marker.component.css',
  // @cngx/forms
  'projects/forms/select/shared/select-base.css',
  'projects/forms/select/tree-select/tree-select-panel.component.css',
  'projects/forms/theming/components/cngx-file-drop.css',
  // @cngx/ui
  'projects/ui/accordion/accordion-item.component.css',
  'projects/ui/accordion/accordion-skins.css',
  'projects/ui/data-grid-accordion/data-grid-row.component.css',
  'projects/ui/feedback/alert/alert-stack.css',
  'projects/ui/feedback/alert/alert.css',
  'projects/ui/feedback/banner/banner-outlet.css',
  'projects/ui/feedback/loading/loading-indicator.css',
  'projects/ui/feedback/loading/loading-overlay.css',
  'projects/ui/feedback/loading/progress.css',
  'projects/ui/feedback/toast/toast-outlet.css',
  'projects/ui/paginator/paginator.component.css',
  'projects/ui/sidenav/sidenav-layout.css',
  'projects/ui/skeleton/skeleton-container.css',
  'projects/ui/stat-card/stat-card.component.css',
  'projects/ui/stepper/dot-stepper.component.css',
  'projects/ui/stepper/stepper.component.css',
  'projects/ui/stepper/styles/stepper-base.css',
  'projects/ui/tabs/tab-group.component.css',
  'projects/ui/tabs/tab-nav.component.css',
];

describe('reduced-motion safety-net integrity', () => {
  const net = readRepoCss(MOTION_TOKENS_CSS);

  it('collapses both animation and transition durations with !important', () => {
    expect(net).toContain('animation-duration: 0.01ms !important');
    expect(net).toContain('transition-duration: 0.01ms !important');
  });

  it('forces the attribute rule UNANCHORED so the subtree escape-hatch works', () => {
    // The forced rule must match any host carrying the attribute, not only
    // the root - otherwise `cngxMotionScope="reduced"` on a subtree does
    // nothing. Presence of the bare selector + absence of the :root-anchored
    // form pins that.
    expect(net).toContain("[data-motion='reduced']");
    expect(net).not.toContain(":root[data-motion='reduced']");
  });

  it('keeps the OS-media rule root-keyed with a `full` escape', () => {
    expect(net).toContain('@media (prefers-reduced-motion: reduce)');
    expect(net).toContain(":root:not([data-motion='full'])");
  });

  it('carves out essential loading motion (role=status/progressbar) to a pulse', () => {
    // Freezing a loader into a dead ring loses the "still working" signal, so
    // the net must swap the freeze for a pulse on the ARIA-role hosts the
    // loading components expose - never on a component class name (layering).
    expect(net).toContain("[role='status']");
    expect(net).toContain("[role='progressbar']");
    expect(net).toContain('cngx-motion-loading-pulse');
    expect(net).toContain('@keyframes cngx-motion-loading-pulse');
  });
});

describe('reduced-motion safety-net cascade wiring', () => {
  it('@imports motion-tokens.css into the themes entry (so the net is not inert)', () => {
    const entry = readRepoCss(THEMES_ENTRY_CSS);
    expect(entry).toContain("@import '../core/theming/motion-tokens.css';");
  });
});

describe('reduced-motion refinement-integrity manifest', () => {
  it.each(MOTION_AWARE_HOSTS)('%s retains its prefers-reduced-motion block', (file) => {
    expect(readRepoCss(file)).toContain('prefers-reduced-motion');
  });

  it('fixes the manifest size so a bulk edit dropping several hosts is caught', () => {
    expect(MOTION_AWARE_HOSTS.length).toBe(34);
  });
});
