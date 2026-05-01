import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Button toggle group (single)',
  navLabel: 'Button toggle group',
  navCategory: 'interactive',
  description:
    'Single-select button-toggle group. W3C APG radiogroup semantics — Tab enters the group, ' +
    'arrow keys MOVE focus AND auto-select the next toggle (auto-select-on-arrow), Space and ' +
    'Enter pick the focused toggle. Tab-into-group does not auto-select (no preceding arrow ' +
    'keydown). Mode is static: this is the single half of a deliberate split, never a runtime ' +
    "[selectionMode] flag. The leaf <button cngxButtonToggle> binds aria-checked. Provides " +
    'CNGX_BUTTON_TOGGLE_GROUP for the leaf to inject (never the concrete class).',
  apiComponents: [
    'CngxButtonToggleGroup',
    'CngxButtonToggle',
    'CNGX_BUTTON_TOGGLE_GROUP',
    'CNGX_CONTROL_VALUE',
  ],
  moduleImports: [
    "import { CngxButtonToggleGroup, CngxButtonToggle } from '@cngx/common/interactive';",
  ],
  setup: `
  protected readonly view = signal<'grid' | 'list' | 'table' | undefined>('grid');
  protected readonly groupDisabled = signal(false);
  protected readonly orientation = signal<'horizontal' | 'vertical'>('horizontal');
  `,
  sections: [
    {
      title: 'Basic — view switcher',
      subtitle:
        'Click any toggle, or Tab into the group and use ArrowLeft/ArrowRight to move + select. ' +
        '<strong>Space</strong>/<strong>Enter</strong> on the focused toggle pick it idempotently. ' +
        'aria-checked reflects the group value reactively via <code>group.value() === toggle.value()</code>.',
      imports: ['CngxButtonToggleGroup', 'CngxButtonToggle'],
      template: `
  <cngx-button-toggle-group [(value)]="view" name="layout">
    <button cngxButtonToggle value="grid">Grid</button>
    <button cngxButtonToggle value="list">List</button>
    <button cngxButtonToggle value="table">Table</button>
  </cngx-button-toggle-group>
  <p class="caption">View: <code>{{ view() ?? '(none)' }}</code></p>`,
      css: `.caption { font-size: 0.875em; color: var(--cngx-text-muted, #6b7280); margin-top: 12px; }`,
    },
    {
      title: 'Vertical orientation',
      subtitle:
        '<code>[orientation]="\'vertical\'"</code> stacks the toggles and tells the host roving ' +
        'directive to use ArrowUp/ArrowDown for navigation.',
      imports: ['CngxButtonToggleGroup', 'CngxButtonToggle'],
      template: `
  <cngx-button-toggle-group [(value)]="view" orientation="vertical" name="layout-v">
    <button cngxButtonToggle value="grid">Grid</button>
    <button cngxButtonToggle value="list">List</button>
    <button cngxButtonToggle value="table">Table</button>
  </cngx-button-toggle-group>`,
    },
    {
      title: 'Disabled — group cascade vs per-toggle',
      subtitle:
        'Group <code>[disabled]</code> cascades to every toggle via ' +
        '<code>toggleDisabled = computed(() => group.disabled() || disabled())</code>. ' +
        'Per-toggle <code>[disabled]</code> blocks only that leaf and is skipped by roving ' +
        'navigation. Both reflect the native <code>disabled</code> attribute so form ' +
        'submission engines see it.',
      imports: ['CngxButtonToggleGroup', 'CngxButtonToggle'],
      template: `
  <button type="button" (click)="groupDisabled.set(!groupDisabled())">
    {{ groupDisabled() ? 'Enable group' : 'Disable group' }}
  </button>
  <cngx-button-toggle-group [(value)]="view" [disabled]="groupDisabled()" name="layout-d">
    <button cngxButtonToggle value="grid">Grid</button>
    <button cngxButtonToggle value="list">List</button>
    <button cngxButtonToggle value="table" [disabled]="true">Table (locked)</button>
  </cngx-button-toggle-group>`,
      css: `button:not([cngxButtonToggle]) { margin-bottom: 16px; }`,
    },
  ],
};
