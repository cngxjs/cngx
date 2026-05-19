import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Vertical Menu',
  subtitle: 'Arrow Up/Down navigates. Disabled items are skipped automatically.',
  description: 'WAI-ARIA roving tabindex pattern for composite widgets. Arrow keys move focus within the group; Tab leaves it.',
  level: 'atom',
  audience: ['a11y', 'dev'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: [
    'CngxRovingTabindex',
    'CngxRovingItem',
  ],
  moduleImports: [
    'import { CngxRovingTabindex, CngxRovingItem } from \'@cngx/common/a11y\';',
  ],
  imports: ['CngxRovingTabindex', 'CngxRovingItem'],
  setup: `protected readonly activeVertical = signal(0);`,
  template: `  <ul cngxRovingTabindex orientation="vertical" [(activeIndex)]="activeVertical"
      role="menu" aria-label="Actions"
      style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:2px;max-width:200px">
    <li cngxRovingItem role="menuitem" class="chip" style="cursor:pointer">Cut</li>
    <li cngxRovingItem role="menuitem" class="chip" style="cursor:pointer">Copy</li>
    <li cngxRovingItem role="menuitem" class="chip" style="cursor:pointer">Paste</li>
    <li cngxRovingItem role="menuitem" class="chip" style="cursor:pointer">Select All</li>
  </ul>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Active index</span>
      <span class="event-value">{{ activeVertical() }}</span>
    </div>
  </div>`,
};
