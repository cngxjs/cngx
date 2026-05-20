import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxRovingTabindex: Horizontal toolbar',
  subtitle:
    'Arrow Left/Right moves focus within the toolbar, Home/End jumps to first/last, and a single Tab keypress leaves the toolbar entirely. Disabled items are skipped during arrow navigation.',
  description:
    'Toolbar variant of the roving-tabindex pattern: every <code>cngxRovingItem</code> exposes itself to the parent <code>cngxRovingTabindex</code>, which keeps exactly one button in the tab order at a time and rotates focus on arrow keys. The Strikethrough item carries native <code>disabled</code> plus <code>[cngxRovingItemDisabled]</code>, so the browser strips it from focus while the directive also skips it during arrow navigation.',
  level: 'atom',
  audience: ['a11y', 'dev'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: ['CngxRovingTabindex', 'CngxRovingItem'],
  moduleImports: ["import { CngxRovingTabindex, CngxRovingItem } from '@cngx/common/a11y';"],
  imports: ['CngxRovingTabindex', 'CngxRovingItem'],
  references: [
    {
      label: 'WAI-ARIA APG: Toolbar pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/',
    },
    {
      label: 'WAI-ARIA APG: Roving tabindex',
      href: 'https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#kbd_roving_tabindex',
    },
    {
      label: 'WCAG 2.1 SC 2.1.1 Keyboard',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html',
    },
  ],
  setup: `protected readonly activeToolbar = signal(0);`,
  template: `  <div cngxRovingTabindex
       orientation="horizontal"
       [(activeIndex)]="activeToolbar"
       role="toolbar"
       aria-label="Text formatting"
       style="display:flex;gap:8px">
    <button type="button" cngxRovingItem class="chip">Bold</button>
    <button type="button" cngxRovingItem class="chip">Italic</button>
    <button type="button" cngxRovingItem class="chip">Underline</button>
    <button type="button" cngxRovingItem [cngxRovingItemDisabled]="true" disabled class="chip">Strikethrough</button>
    <button type="button" cngxRovingItem class="chip">Code</button>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Active index</span>
      <span class="event-value">{{ activeToolbar() }}</span>
    </div>
  </div>`,
};
