import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Grouped options',
  subtitle: '<code>[cngxOptionGroup]</code> wraps options under a labeled <code>role="group"</code>. Navigation stays flat — groups are presentational only.',
  description: 'Single option directive that registers with a surrounding CngxActiveDescendant. Click highlights + activates, pointerenter highlights only.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['composition'],
  apiComponents: [
    'CngxOption',
    'CngxOptionGroup',
  ],
  moduleImports: [
    'import { CngxActiveDescendant } from \'@cngx/common/a11y\';',
    'import { CngxOption, CngxOptionGroup } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxActiveDescendant', 'CngxOption', 'CngxOptionGroup'],
  template: `
  <div class="ad-listbox"
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
