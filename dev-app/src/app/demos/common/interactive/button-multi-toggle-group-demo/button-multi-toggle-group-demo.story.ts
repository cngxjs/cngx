import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Button toggle group (multi)',
  navLabel: 'Button toggle group (multi)',
  navCategory: 'interactive',
  description:
    'Multi-select button-toggle group. W3C APG toolbar semantics — Tab enters the group, arrow ' +
    'keys MOVE focus only (no auto-select), Space and Enter toggle membership of the focused ' +
    "leaf. Mode is static: this is the multi half of a deliberate split, never a runtime " +
    "[selectionMode] flag. The leaf <button cngxButtonToggle> binds aria-selected (toolbar APG) " +
    'instead of aria-checked (radiogroup APG); the choice happens AT INJECTION TIME based on ' +
    'which parent token resolves. Provides CNGX_BUTTON_MULTI_TOGGLE_GROUP for the leaf to inject ' +
    '(never the concrete class) and CNGX_CONTROL_VALUE for forms-bridge integration.',
  apiComponents: [
    'CngxButtonMultiToggleGroup',
    'CngxButtonToggle',
    'CNGX_BUTTON_MULTI_TOGGLE_GROUP',
    'CNGX_CONTROL_VALUE',
  ],
  moduleImports: [
    "import { CngxButtonMultiToggleGroup, CngxButtonToggle } from '@cngx/common/interactive';",
  ],
  setup: `
  protected readonly filters = signal<string[]>(['open']);
  protected readonly groupDisabled = signal(false);
  `,
  sections: [
    {
      title: 'Basic — multi-filter toolbar',
      subtitle:
        'Click any toggle to add or remove it from the selection. Tab into the group and use ' +
        '<strong>ArrowLeft</strong>/<strong>ArrowRight</strong> to move focus (no auto-select); ' +
        '<strong>Space</strong>/<strong>Enter</strong> on the focused toggle flips its membership. ' +
        'aria-selected reflects per-leaf membership reactively via the selection controller.',
      imports: ['CngxButtonMultiToggleGroup', 'CngxButtonToggle'],
      template: `
  <cngx-button-multi-toggle-group label="Status filters" [(selectedValues)]="filters">
    <button cngxButtonToggle value="open">Open</button>
    <button cngxButtonToggle value="closed">Closed</button>
    <button cngxButtonToggle value="archived">Archived</button>
  </cngx-button-multi-toggle-group>
  <p class="caption">
    Filters: <code>{{ filters().join(', ') || '(none)' }}</code>
  </p>`,
      css: `.caption { font-size: 0.875em; color: var(--cngx-text-muted, #6b7280); margin-top: 12px; }`,
    },
    {
      title: 'Disabled — group cascade vs per-toggle',
      subtitle:
        "Group <code>[disabled]</code> blocks every leaf's <code>toggle()</code> dispatch and " +
        'reflects <code>aria-disabled="true"</code> on each toggle. Per-toggle ' +
        '<code>[disabled]</code> blocks only that leaf and is skipped by roving navigation. ' +
        'Both also reflect the native <code>disabled</code> attribute so form submission engines ' +
        'see it.',
      imports: ['CngxButtonMultiToggleGroup', 'CngxButtonToggle'],
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
    },
  ],
};
