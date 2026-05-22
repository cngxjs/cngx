import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Disabled — group cascade vs per-toggle',
  subtitle: 'Group <code>[disabled]</code> cascades to every toggle via <code>toggleDisabled = computed(() => group.disabled() || disabled())</code>. Per-toggle <code>[disabled]</code> blocks only that leaf and is skipped by roving navigation. Both reflect the native <code>disabled</code> attribute so form submission engines see it.',
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
  setup: `protected readonly view = signal<'grid' | 'list' | 'table' | undefined>('grid');
  protected readonly groupDisabled = signal(false);`,
  template: `
  <button type="button" (click)="groupDisabled.set(!groupDisabled())">
    {{ groupDisabled() ? 'Enable group' : 'Disable group' }}
  </button>
  <cngx-button-toggle-group label="Layout (disabled-cascade demo)" [(value)]="view" [disabled]="groupDisabled()">
    <button cngxButtonToggle value="grid">Grid</button>
    <button cngxButtonToggle value="list">List</button>
    <button cngxButtonToggle value="table" [disabled]="true">Table (locked)</button>
  </cngx-button-toggle-group>`,
  css: `button:not([cngxButtonToggle]) { margin-bottom: 16px; }`,
};
