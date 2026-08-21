import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

// Coverage guard for the touch-target floor. The size floor (2.5.5) and the
// adjacent-spacing floor (2.5.8) are orthogonal, environment-derived tokens;
// nothing in the type system forces a new interactive atom to consume them.
// This manifest is that force: every interactive-host stylesheet that renders
// a tap target must reference `var(--cngx-target-min`, and every dense
// small-target row must reference `var(--cngx-target-gap`. A new interactive
// atom therefore has to be added here, making the floor a reviewable
// touchpoint - parity with the density SET-from-scale review guard.
//
// Adding a new interactive host: clamp it (`min-block-size` / `min-inline-size`
// or `max(<current>, var(--cngx-target-min, 0px))`), then add its stylesheet to
// SIZE_FLOOR_HOSTS below. If the guard fails, the host dropped the floor - do
// not delete the entry, re-add the clamp.
//
// The manifest alone gives false confidence: it only proves the ENROLLED files
// still carry the token, never that every interactive host is enrolled. The
// source-scan completeness guard below closes that hole - it walks every
// `projects/**/*.css` that declares a pointer-affordance cursor (`cursor:
// pointer` OR `cursor: grab`, so a drag handle is not missed) and fails when
// one is neither floored (SIZE_FLOOR_HOSTS) nor consciously excluded
// (EXCLUDED_HOSTS). The heuristic still assumes an interactive host declares
// one of those cursors; a control that sets neither (bare `<button>`,
// `[role=button]`, `[tabindex]` with the UA cursor) is out of the scan's reach
// and stays a manifest-review responsibility.

const REPO_ROOT = resolve(__dirname, '..', '..', '..');

const readRepoCss = (relPath: string): string =>
  readFileSync(resolve(REPO_ROOT, relPath), 'utf-8');

// Every interactive-host stylesheet that must clamp its tap target to the
// pointer-derived size floor. Grouped by lib for readability.
const SIZE_FLOOR_HOSTS: ReadonlyArray<{ file: string; note: string }> = [
  // @cngx/common - interactive atoms
  { file: 'projects/common/interactive/checkbox/checkbox.component.css', note: 'checkbox row' },
  { file: 'projects/common/interactive/radio/radio.component.css', note: 'radio row' },
  { file: 'projects/common/interactive/toggle/toggle.component.css', note: 'toggle row' },
  { file: 'projects/common/interactive/close-button/close-button.css', note: 'close button' },
  { file: 'projects/common/interactive/copy/copy-block.css', note: 'copy button' },
  // @cngx/common - display + directive-base skins (theming/components)
  { file: 'projects/common/display/chip/chip.component.css', note: 'interactive chip + remove button' },
  { file: 'projects/common/theming/components/cngx-button-toggle.css', note: 'segmented toggle button' },
  { file: 'projects/common/theming/components/cngx-listbox.css', note: 'listbox option row' },
  { file: 'projects/common/theming/components/cngx-menu.css', note: 'menu item hosts' },
  { file: 'projects/common/theming/components/cngx-breadcrumb.css', note: 'breadcrumb item / link' },
  { file: 'projects/common/theming/components/cngx-accordion.css', note: 'accordion header' },
  // @cngx/common - popover + card
  { file: 'projects/common/popover/popover-action.component.css', note: 'popover action row' },
  { file: 'projects/common/card/card.component.css', note: 'clickable card' },
  // @cngx/common - data / tabs base styles
  { file: 'projects/common/data/paginate/styles/paginator-base.css', note: 'paginator page control' },
  { file: 'projects/common/tabs/styles/tabs-base.css', note: 'tab header button' },
  // @cngx/forms - select family triggers
  { file: 'projects/forms/select/single-select/select.component.css', note: 'single-select trigger' },
  { file: 'projects/forms/select/action-select/action-select.component.css', note: 'action-select trigger' },
  {
    file: 'projects/forms/select/action-multi-select/action-multi-select.component.css',
    note: 'action-multi-select trigger',
  },
  { file: 'projects/forms/select/combobox/combobox.component.css', note: 'combobox trigger' },
  { file: 'projects/forms/select/multi-select/multi-select.component.css', note: 'multi-select trigger' },
  {
    file: 'projects/forms/select/reorderable-multi-select/reorderable-multi-select.component.css',
    note: 'reorderable-multi-select trigger',
  },
  { file: 'projects/forms/select/tree-select/tree-select.component.css', note: 'tree-select trigger' },
  {
    file: 'projects/forms/select/tree-select/tree-select-panel.component.css',
    note: 'tree-select panel node + twisty',
  },
  { file: 'projects/forms/select/declarative/option.component.css', note: 'declarative <cngx-option> host' },
  { file: 'projects/forms/select/typeahead/typeahead.component.css', note: 'typeahead trigger' },
  { file: 'projects/forms/select/select-shell/select-shell.component.css', note: 'select-shell trigger' },
  // @cngx/forms - shared select panel option row
  { file: 'projects/forms/select/shared/select-base.css', note: 'select panel option row' },
  // @cngx/forms - input + filter-builder
  { file: 'projects/forms/input/rating/rating.component.css', note: 'rating star' },
  { file: 'projects/forms/filter-builder/filter-builder.component.css', note: 'filter-builder action button' },
  // @cngx/data-display
  { file: 'projects/data-display/treetable/treetable.component.css', note: 'treetable expander twisty' },
  // @cngx/ui - feedback
  { file: 'projects/ui/feedback/alert/alert.css', note: 'alert dismiss + action' },
  { file: 'projects/ui/feedback/alert/alert-stack.css', note: 'alert-stack overflow toggle' },
  { file: 'projects/ui/feedback/banner/banner-outlet.css', note: 'banner dismiss + action' },
  { file: 'projects/ui/feedback/toast/toast-outlet.css', note: 'toast dismiss + action' },
  // @cngx/ui - tabs
  { file: 'projects/ui/tabs/tab-nav.component.css', note: 'tab-nav link' },
  { file: 'projects/ui/tabs/tab-overflow.component.css', note: 'tab-overflow trigger + item' },
  // @cngx/ui - toc
  { file: 'projects/ui/toc/toc.component.css', note: 'toc nav link' },
  // @cngx/ui - accordion + controls
  { file: 'projects/ui/accordion/accordion-item.component.css', note: 'accordion-item header' },
  { file: 'projects/ui/action-button/action-button.css', note: 'action button' },
  { file: 'projects/ui/speak/speak-button.css', note: 'speak button' },
  // @cngx/ui - breadcrumb
  { file: 'projects/ui/breadcrumb/breadcrumb-overflow.component.css', note: 'breadcrumb overflow trigger' },
  {
    file: 'projects/ui/breadcrumb/breadcrumb-siblings.component.css',
    note: 'breadcrumb siblings trigger + items',
  },
  // @cngx/ui - collection + data-grid-accordion
  { file: 'projects/ui/collection/incremental-list.component.css', note: 'incremental-list load-more' },
  { file: 'projects/ui/data-grid-accordion/data-grid-row.component.css', note: 'data-grid-accordion clickable row' },
  {
    file: 'projects/ui/data-grid-accordion/data-grid-accordion.component.css',
    note: 'data-grid-accordion sort header',
  },
  // @cngx/ui - stepper base
  { file: 'projects/ui/stepper/styles/stepper-base.css', note: 'stepper step header' },
  // @cngx/ui - a11y panel
  { file: 'projects/ui/a11y/a11y-panel.component.css', note: 'accessibility-panel reset button' },
  // @cngx/ui - command palette
  {
    file: 'projects/ui/command-palette/panel/command-panel.component.css',
    note: 'command row + scope chip',
  },
  {
    file: 'projects/ui/command-palette/palette/command-palette.component.css',
    note: 'command-palette retry button',
  },
  // @cngx/ui - context-menu
  { file: 'projects/ui/context-menu/context-menu-item.component.css', note: 'context-menu item row' },
];

// Interactive-role stylesheets that legitimately do NOT floor a discrete tap
// target. Each carries a one-clause reason. The completeness guard treats these
// as consciously accounted for; a new `cursor: pointer` host that belongs here
// must be added with its reason, not silently.
const EXCLUDED_HOSTS: ReadonlyArray<{ file: string; note: string }> = [
  {
    file: 'projects/core/theming/reset.css',
    note: 'global button reset, not a per-component floor site',
  },
  {
    file: 'projects/ui/sidenav/sidenav-layout.css',
    note: 'full-surface dismiss backdrop, not a discrete tap target',
  },
  {
    file: 'projects/forms/field/form-errors.component.css',
    note: 'inline text link inside prose; WCAG 2.5.5 exempts inline links',
  },
  {
    file: 'projects/common/interactive/slider/slider.component.css',
    note: 'slider thumb is a visual gauge, not a tap target; a floor would distort the track',
  },
  {
    file: 'projects/common/interactive/slider/range-slider.component.css',
    note: 'range-slider thumb is a visual gauge, not a tap target',
  },
  {
    file: 'projects/common/theming/components/cngx-slider.css',
    note: 'slider directive skin; thumb is a visual gauge, not a tap target',
  },
  {
    file: 'projects/ui/stepper/stepper.component.css',
    note: 'interactive step already floored by stepper-base.css; the skin min-heights are 52/72px, already >= 44px',
  },
  {
    file: 'projects/data-display/treetable/examples/app/app.component.css',
    note: 'demo scaffold inside the lib, not shipped component CSS',
  },
  {
    file: 'projects/forms/theming/components/cngx-file-drop.css',
    note: 'padding-xl drop-zone affordance sized well above the floor; not a discrete small tap target',
  },
];

// Dense small-target rows that must floor their adjacent spacing to the
// pointer-derived gap (WCAG 2.5.8). Distinct from the size floor - these are
// containers, not targets.
const ADJACENT_GAP_HOSTS: ReadonlyArray<{ file: string; note: string }> = [
  { file: 'projects/common/interactive/chip-group/chip-group.component.css', note: 'chip group row gap' },
  {
    file: 'projects/common/interactive/multi-chip-group/multi-chip-group.component.css',
    note: 'multi-chip group row gap',
  },
  { file: 'projects/common/theming/components/cngx-menu.css', note: 'menu adjacent-item spacing' },
];

// Recursively collect every `.css` under a repo-relative directory, returning
// repo-relative POSIX paths that match the manifest's path shape.
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

// A pointer-affordance cursor marks a discrete tap/drag target. `grab` is
// included so a drag handle (reorder / chip-drag) cannot slip the scan even
// when it never sets `pointer`.
const declaresTapCursor = (css: string): boolean =>
  css.includes('cursor: pointer') || css.includes('cursor: grab');

const INTERACTIVE_CSS = walkCss('projects').filter((file) => declaresTapCursor(readRepoCss(file)));

describe('touch-target size-floor coverage manifest', () => {
  it.each(SIZE_FLOOR_HOSTS)('$file references var(--cngx-target-min ($note)', ({ file }) => {
    expect(readRepoCss(file)).toContain('var(--cngx-target-min');
  });

  it('fixes the manifest size so a bulk edit dropping several hosts is caught', () => {
    // The registry itself (system-tokens.css) declares the token and is not a
    // consumer, so it is excluded by construction. This count is the coarse net
    // alongside the per-file assertions and the source scan below.
    expect(SIZE_FLOOR_HOSTS.length).toBe(50);
  });
});

describe('touch-target size-floor completeness (source scan)', () => {
  const floored = new Set(SIZE_FLOOR_HOSTS.map((h) => h.file));
  const excluded = new Set(EXCLUDED_HOSTS.map((h) => h.file));

  it('never lists a file as both floored and excluded', () => {
    const both = [...floored].filter((file) => excluded.has(file));
    expect(both).toEqual([]);
  });

  it.each(INTERACTIVE_CSS)('%s is floored or explicitly excluded', (file) => {
    const accounted = floored.has(file) || excluded.has(file);
    expect(
      accounted,
      `${file} declares a tap-affordance cursor (pointer/grab) but is neither in ` +
        `SIZE_FLOOR_HOSTS nor EXCLUDED_HOSTS. Floor its tap target with ` +
        `var(--cngx-target-min, 0px) and enroll it, or add it to EXCLUDED_HOSTS ` +
        `with a one-clause reason.`,
    ).toBe(true);
  });
});

describe('touch-target adjacent-gap coverage manifest', () => {
  it.each(ADJACENT_GAP_HOSTS)('$file references var(--cngx-target-gap ($note)', ({ file }) => {
    expect(readRepoCss(file)).toContain('var(--cngx-target-gap');
  });
});
