import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxButtonToggleGroup: vertical orientation',
  subtitle:
    '<code>[orientation]="\'vertical\'"</code> stacks the toggles via the shared layer-1 CSS and forwards the value to the <code>CngxRovingTabindex</code> host directive so <strong>ArrowUp</strong>/<strong>ArrowDown</strong> drive roving + auto-select instead of <strong>ArrowLeft</strong>/<strong>ArrowRight</strong>.',
  description:
    'Same radiogroup semantics as the horizontal demo, with the navigation axis flipped. The orientation input is forwarded into the <code>CngxRovingTabindex</code> host directive via the explicit <code>inputs: [\'orientation\']</code> declaration on the group; <code>aria-orientation</code> on the host follows the same signal. The shared layer-1 CSS keys off <code>:not(.cngx-button-toggle-group--horizontal)</code> to flip <code>flex-direction</code> to column.',
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
      label: 'WAI-ARIA aria-orientation',
      href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-orientation',
    },
    {
      label: 'WCAG 2.1.1 Keyboard',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html',
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
  <cngx-button-toggle-group class="demo-button-toggle-group" label="Layout (vertical)" [(value)]="view" orientation="vertical">
    <button type="button" cngxButtonToggle value="grid">Grid</button>
    <button type="button" cngxButtonToggle value="list">List</button>
    <button type="button" cngxButtonToggle value="table">Table</button>
  </cngx-button-toggle-group>`,
};
