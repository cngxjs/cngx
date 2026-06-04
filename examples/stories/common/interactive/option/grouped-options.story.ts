import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxOptionGroup: Grouped options',
  subtitle: '<code>[cngxOptionGroup]</code> wraps options under a labeled <code>role="group"</code>. Navigation stays flat - groups are presentational only.',
  description: 'CngxOptionGroup emits role="group" and aria-label on its host so screen readers can announce the cluster name when traversal enters it. Children stay flat in the active-descendant item list - arrow navigation walks every CngxOption in DOM order regardless of group boundaries. Use this to add visual + semantic clustering without splitting the keyboard model; reach for CngxTreeSelect when you actually need nested traversal.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern'],
  apiComponents: [
    'CngxOptionGroup',
    'CngxOption',
  ],
  references: [
    { label: 'WAI-ARIA APG: Listbox with groups', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/listbox/examples/listbox-grouped/' },
    { label: 'ARIA 1.2: role=group', href: 'https://www.w3.org/TR/wai-aria-1.2/#group' },
  ],
  moduleImports: [
    'import { CngxActiveDescendant } from \'@cngx/common/a11y\';',
    'import { CngxOption, CngxOptionGroup } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxActiveDescendant', 'CngxOption', 'CngxOptionGroup'],
  template: `
  <div class="demo-ad-listbox"
       cngxActiveDescendant
       role="listbox"
       aria-label="Grouped options"
       tabindex="0"
       #adGrouped="cngxActiveDescendant">
    <div cngxOptionGroup [label]="'Fruits'">
      <div cngxOption value="apple">Apple</div>
      <div cngxOption value="banana">Banana</div>
    </div>
    <div cngxOptionGroup [label]="'Vegetables'">
      <div cngxOption value="carrot">Carrot</div>
      <div cngxOption value="daikon">Daikon</div>
    </div>
  </div>`,
};
