import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxButtonToggleGroup: basic view switcher',
  subtitle:
    'Click any toggle, or Tab into the group and use <strong>ArrowLeft</strong>/<strong>ArrowRight</strong> to move + select. <strong>Space</strong>/<strong>Enter</strong> on the focused toggle pick it idempotently. <code>aria-checked</code> reflects the group value reactively via <code>group.value() === toggle.value()</code>.',
  description:
    'Single-select button-toggle group with W3C APG radiogroup semantics. Tab enters the group on the active toggle (or the first one if none); arrow keys MOVE focus AND auto-select the next toggle - the first arrow press already selects the newly-focused toggle, read from the host roving directive in the leaf\'s <code>(focus)</code> handler. Tab-into-group never auto-selects (no preceding navigation key). The leaf <code>&lt;button cngxButtonToggle&gt;</code> binds <code>aria-checked</code>; mode is chosen at injection time by which parent token resolves, never via a runtime flag.',
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
  setup: `protected readonly view = signal<'grid' | 'list' | 'table' | undefined>('grid');`,
  template: `
  <cngx-button-toggle-group class="demo-button-toggle-group" label="Layout" [(value)]="view">
    <button type="button" cngxButtonToggle value="grid">Grid</button>
    <button type="button" cngxButtonToggle value="list">List</button>
    <button type="button" cngxButtonToggle value="table">Table</button>
  </cngx-button-toggle-group>
  <p class="demo-button-toggle-caption">View: <code>{{ view() ?? '(none)' }}</code></p>`,
};
