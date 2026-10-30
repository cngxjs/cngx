import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxMenuButton: Custom caret',
  subtitle: 'Swap the caret app-wide with <code>CNGX_BUTTON_CARET_ICON</code>, or per button with a <code>cngxButtonEnd</code> slot.',
  description: 'The default caret is a chevron inside <code>&lt;cngx-icon&gt;</code>, sized at 1em of the button font. Provide a component through <code>CNGX_BUTTON_CARET_ICON</code> to replace it for every menu button below the provider, for example a Material <code>arrow_drop_down</code> wrapper. A <code>cngxButtonEnd</code> element on one button replaces the caret on that button only; it does not turn while the menu is open, so a static glyph such as a count or a shortcut hint fits there. The caret is decorative in both cases and hidden from assistive technology.',
  level: 'molecule',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['composition', 'visual-variants'],
  apiComponents: ['CngxMenuButton', 'CngxButtonEnd'],
  moduleImports: [
    "import { CngxButtonEnd } from '@cngx/common/button';",
    "import { CngxIcon } from '@cngx/common/display';",
    "import { CngxMenu, CngxMenuItem } from '@cngx/common/interactive';",
    "import { CNGX_BUTTON_CARET_ICON, CngxMenuButton } from '@cngx/common/menu-button';",
    "import { CngxPopover } from '@cngx/common/popover';",
    "import { TriangleCaret } from './_triangle-caret.component';",
  ],
  imports: ['CngxButtonEnd', 'CngxIcon', 'CngxMenu', 'CngxMenuItem', 'CngxMenuButton', 'CngxPopover'],
  viewProviders: ['{ provide: CNGX_BUTTON_CARET_ICON, useValue: TriangleCaret }'],
  template: `
  <div class="demo-inline-actions">
    <button cngxMenuButton="outline" [menu]="sortMenu" [popover]="sortPop">Sort</button>
    <button cngxMenuButton="outline" [menu]="viewMenu" [popover]="viewPop">
      View
      <cngx-icon cngxButtonEnd>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
      </cngx-icon>
    </button>
  </div>
  <div cngxPopover placement="bottom-start" #sortPop="cngxPopover">
    <ul cngxMenu [label]="'Sort by'" tabindex="0" #sortMenu="cngxMenu">
      <li cngxMenuItem value="name">Name</li>
      <li cngxMenuItem value="date">Date modified</li>
    </ul>
  </div>
  <div cngxPopover placement="bottom-start" #viewPop="cngxPopover">
    <ul cngxMenu [label]="'View'" tabindex="0" #viewMenu="cngxMenu">
      <li cngxMenuItem value="list">List</li>
      <li cngxMenuItem value="grid">Grid</li>
    </ul>
  </div>`,
};
