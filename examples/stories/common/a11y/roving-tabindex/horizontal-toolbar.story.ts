import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Horizontal Toolbar',
  subtitle: 'Arrow Left/Right moves focus. Home/End jumps to first/last. Tab leaves the toolbar entirely.',
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
  setup: `protected readonly activeToolbar = signal(0);`,
  template: `  <div cngxRovingTabindex orientation="horizontal" [(activeIndex)]="activeToolbar"
       role="toolbar" aria-label="Text formatting"
       style="display:flex;gap:4px">
    <button cngxRovingItem class="chip">Bold</button>
    <button cngxRovingItem class="chip">Italic</button>
    <button cngxRovingItem class="chip">Underline</button>
    <button cngxRovingItem [cngxRovingItemDisabled]="true" class="chip" style="opacity:0.4">Strikethrough</button>
    <button cngxRovingItem class="chip">Code</button>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Active index</span>
      <span class="event-value">{{ activeToolbar() }}</span>
    </div>
  </div>`,
};
