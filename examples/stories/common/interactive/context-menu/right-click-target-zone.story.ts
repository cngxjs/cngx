import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxContextMenuTrigger: right-click target zone',
  subtitle:
    'Right-click inside the dashed zone, or focus it and press Shift+F10. Click outside, press Escape, or switch tabs to dismiss. The chrome row shows which path fired.',
  description:
    'Right-click or Shift+F10 opens a <code>CngxMenu</code> inside a <code>CngxPopover</code> anchored at the pointer (mouse) or zone centre (keyboard). After open, the menu container holds focus so ArrowDown/ArrowUp/Home/End/Enter/Space/typeahead drive the highlight via <code>CngxActiveDescendant</code>. Four dismissal sources close the menu by default: <code>Escape</code>, <code>pointerdown</code> outside both the popover and the zone, window <code>blur</code>, and document <code>pointercancel</code>. The source that fired most recently is exposed as <code>lastDismissSource</code> on the trigger.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern'],
  references: [
    {
      label: 'WAI-ARIA APG: Menu Pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/menu/',
    },
    {
      label: 'WCAG 2.1.1 Keyboard',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html',
    },
    {
      label: 'WCAG 4.1.2 Name, Role, Value',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html',
    },
  ],
  apiComponents: ['CngxContextMenuTrigger', 'CngxMenu', 'CngxMenuItem', 'CngxMenuSeparator'],
  moduleImports: [
    "import { CngxContextMenuTrigger, CngxMenu, CngxMenuItem, CngxMenuSeparator } from '@cngx/common/interactive';",
    "import { CngxPopover } from '@cngx/common/popover';",
  ],
  imports: ['CngxContextMenuTrigger', 'CngxMenu', 'CngxMenuItem', 'CngxMenuSeparator', 'CngxPopover'],
  setup: `protected readonly lastAction = signal<string | null>(null);`,
  template: `  <div
    class="demo-context-menu-zone"
    tabindex="0"
    [cngxContextMenuTrigger]="ctx"
    [popover]="pop"
    #trigger="cngxContextMenuTrigger"
  >
    Right-click here (or focus + Shift+F10)
  </div>
  <div cngxPopover #pop="cngxPopover" placement="bottom-start">
    <ul
      cngxMenu
      [label]="'Context actions'"
      tabindex="0"
      #ctx="cngxMenu"
      (itemActivated)="lastAction.set($any($event)); pop.hide()"
    >
      <li cngxMenuItem value="cut">Cut</li>
      <li cngxMenuItem value="copy">Copy</li>
      <li cngxMenuItem value="paste">Paste</li>
      <li cngxMenuSeparator></li>
      <li cngxMenuItem value="delete">Delete</li>
    </ul>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Last action</span>
      <span class="event-value">{{ lastAction() ?? '-' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Last dismissal source</span>
      <span class="event-value">{{ trigger.lastDismissSource() ?? '-' }}</span>
    </div>
  </div>`,
  css: `.demo-context-menu-zone {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 160px;
  padding: 16px;
  border: 2px dashed var(--cngx-color-border, oklch(0.88 0.005 250));
  border-radius: var(--cngx-radius-md, 8px);
  background: var(--cngx-color-surface-variant, var(--cngx-color-surface, oklch(0.98 0.005 250)));
  color: var(--cngx-color-text-muted, oklch(0.5 0.01 250));
  cursor: context-menu;
  user-select: none;
}
.demo-context-menu-zone:focus-visible {
  outline: 2px solid var(--cngx-color-primary, oklch(0.66 0.19 50));
  outline-offset: 2px;
}`,
};
