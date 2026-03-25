import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Roving Tabindex',
  navLabel: 'RovingTabindex',
  navCategory: 'a11y',
  description:
    'WAI-ARIA roving tabindex pattern for composite widgets. Arrow keys move focus within the group; Tab leaves it.',
  apiComponents: ['CngxRovingTabindex', 'CngxRovingItem'],
  overview:
    '<p><code>[cngxRovingTabindex]</code> manages keyboard navigation in composite widgets ' +
    'like toolbars, tab lists, and card grids. Only one item has <code>tabindex="0"</code> at a time. ' +
    'Arrow keys move focus; Home/End jump to first/last. Disabled items are skipped.</p>',
  moduleImports: [
    "import { CngxRovingTabindex, CngxRovingItem } from '@cngx/common/a11y';",
  ],
  setup: `
  protected readonly activeToolbar = signal(0);
  protected readonly activeVertical = signal(0);
  `,
  sections: [
    {
      title: 'Horizontal Toolbar',
      subtitle:
        'Arrow Left/Right moves focus. Home/End jumps to first/last. Tab leaves the toolbar entirely.',
      imports: ['CngxRovingTabindex', 'CngxRovingItem'],
      template: `
  <div cngxRovingTabindex orientation="horizontal" [(activeIndex)]="activeToolbar"
       role="toolbar" aria-label="Text formatting"
       style="display:flex;gap:4px">
    <button cngxRovingItem class="chip">Bold</button>
    <button cngxRovingItem class="chip">Italic</button>
    <button cngxRovingItem class="chip">Underline</button>
    <button cngxRovingItem [cngxRovingItemDisabled]="true" class="chip" style="opacity:0.4">Strikethrough</button>
    <button cngxRovingItem class="chip">Code</button>
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Active index</span>
      <span class="event-value">{{ activeToolbar() }}</span>
    </div>
  </div>`,
    },
    {
      title: 'Vertical Menu',
      subtitle:
        'Arrow Up/Down navigates. Disabled items are skipped automatically.',
      imports: ['CngxRovingTabindex', 'CngxRovingItem'],
      template: `
  <ul cngxRovingTabindex orientation="vertical" [(activeIndex)]="activeVertical"
      role="menu" aria-label="Actions"
      style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:2px;max-width:200px">
    <li cngxRovingItem role="menuitem" class="chip" style="cursor:pointer">Cut</li>
    <li cngxRovingItem role="menuitem" class="chip" style="cursor:pointer">Copy</li>
    <li cngxRovingItem role="menuitem" class="chip" style="cursor:pointer">Paste</li>
    <li cngxRovingItem role="menuitem" class="chip" style="cursor:pointer">Select All</li>
  </ul>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Active index</span>
      <span class="event-value">{{ activeVertical() }}</span>
    </div>
  </div>`,
    },
  ],
};
