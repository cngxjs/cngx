import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Basic — view switcher',
  subtitle: 'Click any toggle, or Tab into the group and use ArrowLeft/ArrowRight to move + select. <strong>Space</strong>/<strong>Enter</strong> on the focused toggle pick it idempotently. aria-checked reflects the group value reactively via <code>group.value() === toggle.value()</code>.',
  description: 'Single-select button-toggle group. W3C APG radiogroup semantics — Tab enters the group, arrow keys MOVE focus AND auto-select the next toggle (auto-select-on-arrow), Space and Enter pick the focused toggle. Tab-into-group does not auto-select (no preceding arrow keydown). Mode is static: this is the single half of a deliberate split, never a runtime [selectionMode] flag. The leaf <button cngxButtonToggle> binds aria-checked. Provides CNGX_BUTTON_TOGGLE_GROUP for the leaf to inject (never the concrete class).',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern'],
  apiComponents: [
    'CngxButtonToggleGroup',
    'CngxButtonToggle',
    'CNGX_BUTTON_TOGGLE_GROUP',
    'CNGX_CONTROL_VALUE',
  ],
  moduleImports: [
    'import { CngxButtonToggleGroup, CngxButtonToggle } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxButtonToggleGroup', 'CngxButtonToggle'],
  setup: `protected readonly view = signal<'grid' | 'list' | 'table' | undefined>('grid');`,
  template: `
  <cngx-button-toggle-group label="Layout" [(value)]="view">
    <button cngxButtonToggle value="grid">Grid</button>
    <button cngxButtonToggle value="list">List</button>
    <button cngxButtonToggle value="table">Table</button>
  </cngx-button-toggle-group>
  <p class="caption">View: <code>{{ view() ?? '(none)' }}</code></p>`,
  css: `.caption { font-size: 0.875em; color: var(--cngx-text-muted, #6b7280); margin-top: 12px; }`,
};
