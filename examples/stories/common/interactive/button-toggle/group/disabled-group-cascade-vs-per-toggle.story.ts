import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxButtonToggleGroup: disabled cascade vs per-toggle',
  subtitle:
    'Group <code>[disabled]</code> cascades to every toggle via <code>toggleDisabled = computed(() =&gt; group.disabled() || disabled())</code>. Per-toggle <code>[disabled]</code> blocks only that leaf. Both reflect the native <code>disabled</code> attribute so form-submission engines see it.',
  description:
    'Disabled propagation contract for the single-select group. Group-level <code>[disabled]</code> short-circuits every leaf\'s <code>handleSelect</code> / <code>handleKeydown</code> / <code>handleFocus</code> path and projects <code>aria-disabled="true"</code> onto each toggle. Per-toggle <code>[disabled]</code> blocks only that leaf without affecting siblings. Accepted debt: a fully-disabled group lets visual focus transit through its toggles via Arrow keys because <code>CngxRovingItem.disabled</code> is not a writable host-directive surface yet; every selection pathway still short-circuits silently.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern'],
  references: [
    {
      label: 'WAI-ARIA APG: Radio Group Pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/radio/',
    },
    {
      label: 'WCAG 2.1.1 Keyboard',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html',
    },
    {
      label: 'WCAG 4.1.2 Name, Role, Value',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html',
    },
  ],
  apiComponents: [
    'CngxButtonToggleGroup',
    'CngxButtonToggle',
    'CNGX_BUTTON_TOGGLE_GROUP',
  ],
  moduleImports: [
    "import { CngxButtonToggleGroup, CngxButtonToggle } from '@cngx/common/interactive';",
  ],
  imports: ['CngxButtonToggleGroup', 'CngxButtonToggle'],
  setup: `protected readonly view = signal<'grid' | 'list' | 'table' | undefined>('grid');
  protected readonly groupDisabled = signal(false);`,
  template: `
  <button type="button" style="display: block; margin-bottom: 16px;" (click)="groupDisabled.set(!groupDisabled())">
    {{ groupDisabled() ? 'Enable group' : 'Disable group' }}
  </button>
  <cngx-button-toggle-group class="demo-button-toggle-group" label="Layout (disabled-cascade demo)" [(value)]="view" [disabled]="groupDisabled()">
    <button cngxButtonToggle value="grid">Grid</button>
    <button cngxButtonToggle value="list">List</button>
    <button cngxButtonToggle value="table" [disabled]="true">Table (locked)</button>
  </cngx-button-toggle-group>`,
};
