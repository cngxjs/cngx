import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxRovingTabindex: Vertical menu',
  subtitle:
    'Arrow Up/Down navigates the menu, Home/End jumps to first/last. The directive rewrites <code>tabindex</code> on every item so only the active menuitem participates in the document tab order.',
  description:
    'Menu variant of the roving-tabindex pattern: <code>role="menu"</code> on the list, <code>role="menuitem"</code> on each <code>&lt;li&gt;</code>, and arrow keys driving focus between them. <code>&lt;li&gt;</code> items cannot carry native <code>disabled</code>, so a disabled menuitem would use <code>[cngxRovingItemDisabled]</code> with <code>aria-disabled="true"</code> on the host; this demo keeps every item available to keep the keyboard model isolated.',
  level: 'atom',
  audience: ['a11y', 'dev'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: ['CngxRovingTabindex', 'CngxRovingItem'],
  moduleImports: ["import { CngxRovingTabindex, CngxRovingItem } from '@cngx/common/a11y';"],
  imports: ['CngxRovingTabindex', 'CngxRovingItem'],
  references: [
    {
      label: 'WAI-ARIA APG: Menu and Menubar pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/menubar/',
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
  setup: `protected readonly activeVertical = signal(0);`,
  template: `  <ul cngxRovingTabindex
      orientation="vertical"
      [(activeIndex)]="activeVertical"
      role="menu"
      aria-label="Edit actions"
      class="cngx-ex-menu-list">
    <li cngxRovingItem role="menuitem" class="cngx-ex-menu-item">Cut</li>
    <li cngxRovingItem role="menuitem" class="cngx-ex-menu-item">Copy</li>
    <li cngxRovingItem role="menuitem" class="cngx-ex-menu-item">Paste</li>
    <li cngxRovingItem role="menuitem" class="cngx-ex-menu-item">Select all</li>
  </ul>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Active index</span>
      <span class="event-value">{{ activeVertical() }}</span>
    </div>
  </div>`,
};
