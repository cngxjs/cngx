import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxButtonMultiToggleGroup: basic multi-filter toolbar',
  subtitle:
    'Click any toggle to add or remove it from the selection. Tab into the group and use <strong>ArrowLeft</strong>/<strong>ArrowRight</strong> to move focus (no auto-select); <strong>Space</strong>/<strong>Enter</strong> on the focused toggle flips its membership. <code>aria-selected</code> reflects per-leaf membership reactively via the selection controller.',
  description:
    'Multi-select button-toggle group with W3C APG toolbar semantics. Arrow keys MOVE focus only - never auto-select - so the user can scan options without committing. Space and Enter on the focused leaf toggle that leaf\'s membership through the group\'s <code>SelectionController</code>; per-value <code>isSelected</code> signals are stable so each leaf reads its own <code>aria-selected</code> inside a <code>computed()</code> without scanning the array on every change-detection pass. The leaf chooses <code>aria-selected</code> (toolbar APG) over <code>aria-checked</code> (radiogroup APG) at injection time based on which parent token resolves.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern'],
  references: [
    {
      label: 'WAI-ARIA APG: Toolbar Pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/',
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
    'CngxButtonMultiToggleGroup',
    'CngxButtonToggle',
    'CNGX_BUTTON_MULTI_TOGGLE_GROUP',
  ],
  moduleImports: [
    "import { CngxButtonMultiToggleGroup, CngxButtonToggle } from '@cngx/common/interactive';",
  ],
  imports: ['CngxButtonMultiToggleGroup', 'CngxButtonToggle'],
  setup: `protected readonly filters = signal<string[]>(['open']);`,
  template: `
  <cngx-button-multi-toggle-group class="demo-button-toggle-group" label="Status filters" [(selectedValues)]="filters">
    <button type="button" cngxButtonToggle value="open">Open</button>
    <button type="button" cngxButtonToggle value="closed">Closed</button>
    <button type="button" cngxButtonToggle value="archived">Archived</button>
  </cngx-button-multi-toggle-group>
  <p class="demo-button-toggle-caption">
    Filters: <code>{{ filters().join(', ') || '(none)' }}</code>
  </p>`,
};
