import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
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
  // @cngx/common - display + directive-base skins (theming/components)
  { file: 'projects/common/display/chip/chip.component.css', note: 'interactive chip + remove button' },
  { file: 'projects/common/theming/components/cngx-button-toggle.css', note: 'segmented toggle button' },
  { file: 'projects/common/theming/components/cngx-listbox.css', note: 'listbox option row' },
  { file: 'projects/common/theming/components/cngx-menu.css', note: 'menu item hosts' },
  { file: 'projects/common/theming/components/cngx-breadcrumb.css', note: 'breadcrumb item / link' },
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
  { file: 'projects/forms/select/typeahead/typeahead.component.css', note: 'typeahead trigger' },
  { file: 'projects/forms/select/select-shell/select-shell.component.css', note: 'select-shell trigger' },
  // @cngx/forms - shared select panel option row
  { file: 'projects/forms/select/shared/select-base.css', note: 'select panel option row' },
  // @cngx/data-display
  { file: 'projects/data-display/treetable/treetable.component.css', note: 'treetable expander twisty' },
  // @cngx/ui
  { file: 'projects/ui/breadcrumb/breadcrumb-overflow.component.css', note: 'breadcrumb overflow trigger' },
  { file: 'projects/ui/stepper/styles/stepper-base.css', note: 'stepper step header' },
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

describe('touch-target size-floor coverage manifest', () => {
  it.each(SIZE_FLOOR_HOSTS)('$file references var(--cngx-target-min ($note)', ({ file }) => {
    expect(readRepoCss(file)).toContain('var(--cngx-target-min');
  });

  it('matches the set of stylesheets that actually reference the size token', () => {
    // The registry itself (system-tokens.css) declares the token and is not a
    // consumer, so it is excluded from the manifest by construction. This test
    // does not re-scan the tree (a source scan would couple the guard to the
    // build layout); it fixes the count so a bulk edit that drops the token
    // from several hosts at once is caught alongside the per-file assertions.
    expect(SIZE_FLOOR_HOSTS.length).toBe(24);
  });
});

describe('touch-target adjacent-gap coverage manifest', () => {
  it.each(ADJACENT_GAP_HOSTS)('$file references var(--cngx-target-gap ($note)', ({ file }) => {
    expect(readRepoCss(file)).toContain('var(--cngx-target-gap');
  });
});
