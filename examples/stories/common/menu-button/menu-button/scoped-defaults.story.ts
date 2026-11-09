import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxMenuButton: Scoped defaults',
  subtitle: 'Set the caret glyph and the split caret name of a subtree with one <code>provideCngxMenuButtonAt</code> call.',
  description: '<code>provideCngxMenuButton</code> is the entry point for the menu-button family: the caret glyph (<code>withButtonCaretIcon</code>) and the labels (<code>withMenuButtonI18nLabels</code>) in one call at the app root. <code>provideCngxMenuButtonAt</code> is the twin for <code>viewProviders</code>. Here the menu button and the split caret both draw the triangle, and the caret is named "More publish options" instead of the language pack default. The button-wide config, close glyph and busy glyph stay with <code>provideCngxButtonAt</code> in <code>@cngx/common/button</code>.',
  level: 'molecule',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['composition', 'visual-variants'],
  apiComponents: ['CngxMenuButton', 'CngxIconMenuButton', 'CngxSplitButton'],
  moduleImports: [
    "import { CngxButton } from '@cngx/common/button';",
    "import { CngxMenu, CngxMenuItem } from '@cngx/common/interactive';",
    "import { CngxIconMenuButton, CngxMenuButton, CngxSplitButton, provideCngxMenuButtonAt, withButtonCaretIcon, withMenuButtonI18nLabels } from '@cngx/common/menu-button';",
    "import { CngxPopover } from '@cngx/common/popover';",
    "import { TriangleCaret } from './_triangle-caret.component';",
  ],
  imports: ['CngxButton', 'CngxMenu', 'CngxMenuItem', 'CngxIconMenuButton', 'CngxMenuButton', 'CngxSplitButton', 'CngxPopover'],
  viewProviders: [
    "...provideCngxMenuButtonAt(withButtonCaretIcon(TriangleCaret), withMenuButtonI18nLabels({ splitToggle: 'More publish options' }))",
  ],
  template: `
  <div class="demo-inline-actions">
    <button cngxMenuButton="outline" [menu]="sortMenu" [popover]="sortPop">Sort</button>
    <div cngxSplitButton variant="solid" aria-label="Publish">
      <button cngxButton tone="primary">Publish</button>
      <button cngxIconMenuButton tone="primary" [menu]="pubMenu" [popover]="pubPop"></button>
    </div>
  </div>
  <div cngxPopover placement="bottom-start" #sortPop="cngxPopover">
    <ul cngxMenu [label]="'Sort by'" tabindex="0" #sortMenu="cngxMenu">
      <li cngxMenuItem value="name">Name</li>
      <li cngxMenuItem value="date">Date modified</li>
    </ul>
  </div>
  <div cngxPopover placement="bottom-end" #pubPop="cngxPopover">
    <ul cngxMenu [label]="'Publish options'" tabindex="0" #pubMenu="cngxMenu">
      <li cngxMenuItem value="draft">Save as draft</li>
      <li cngxMenuItem value="team">Publish to team only</li>
    </ul>
  </div>`,
};
