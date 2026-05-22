import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Disabled — group cascade vs per-toggle',
  subtitle: 'Group <code>[disabled]</code> blocks every leaf\'s <code>toggle()</code> dispatch and reflects <code>aria-disabled="true"</code> on each toggle. Per-toggle <code>[disabled]</code> blocks only that leaf and is skipped by roving navigation. Both also reflect the native <code>disabled</code> attribute so form submission engines see it.',
  description: 'Multi-select button-toggle group. W3C APG toolbar semantics — Tab enters the group, arrow keys MOVE focus only (no auto-select), Space and Enter toggle membership of the focused leaf. Mode is static: this is the multi half of a deliberate split, never a runtime [selectionMode] flag. The leaf <button cngxButtonToggle> binds aria-selected (toolbar APG) instead of aria-checked (radiogroup APG); the choice happens AT INJECTION TIME based on which parent token resolves. Provides CNGX_BUTTON_MULTI_TOGGLE_GROUP for the leaf to inject (never the concrete class) and CNGX_CONTROL_VALUE for forms-bridge integration.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern'],
  apiComponents: [
    'CngxButtonMultiToggleGroup',
    'CngxButtonToggle',
    'CNGX_BUTTON_MULTI_TOGGLE_GROUP',
    'CNGX_CONTROL_VALUE',
  ],
  moduleImports: [
    'import { CngxButtonMultiToggleGroup, CngxButtonToggle } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxButtonMultiToggleGroup', 'CngxButtonToggle'],
  setup: `protected readonly filters = signal<string[]>(['open']);
  protected readonly groupDisabled = signal(false);`,
  template: `
  <button type="button" (click)="groupDisabled.set(!groupDisabled())">
    {{ groupDisabled() ? 'Enable group' : 'Disable group' }}
  </button>
  <cngx-button-multi-toggle-group
    label="Status filters (disabled-cascade demo)"
    [(selectedValues)]="filters"
    [disabled]="groupDisabled()"
  >
    <button cngxButtonToggle value="open">Open</button>
    <button cngxButtonToggle value="closed">Closed</button>
    <button cngxButtonToggle value="archived" [disabled]="true">Archived (locked)</button>
  </cngx-button-multi-toggle-group>`,
  css: `button:not([cngxButtonToggle]) { margin-bottom: 16px; }`,
};
