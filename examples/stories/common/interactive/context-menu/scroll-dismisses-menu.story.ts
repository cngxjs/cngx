import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxContextMenuTrigger: scroll-dismiss opt-in',
  subtitle:
    'Window-scroll dismissal is opt-in. Right-click inside the zone, then scroll the page - the menu closes on the first scroll event.',
  description:
    'Window <code>scroll</code> dismissal is off by default because consumers with scrollable panels (long menus, treeselect-style) often want the menu to stay anchored during scroll. Opt in via <code>provideMenuConfigAt(withDismissOnScroll(true))</code> in <code>viewProviders</code> for a single feature scope, or <code>provideCngxMenu(withDismissOnScroll(true))</code> at app root. Outside-click and blur dismissal stay on regardless.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'behavior'],
  references: [
    {
      label: 'WAI-ARIA APG: Menu Pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/menu/',
    },
  ],
  apiComponents: ['CngxContextMenuTrigger', 'CngxMenu', 'CngxMenuItem'],
  moduleImports: [
    "import { CngxContextMenuTrigger, CngxMenu, CngxMenuItem, provideMenuConfigAt, withDismissOnScroll } from '@cngx/common/interactive';",
    "import { CngxPopover } from '@cngx/common/popover';",
  ],
  imports: ['CngxContextMenuTrigger', 'CngxMenu', 'CngxMenuItem', 'CngxPopover'],
  viewProviders: ['provideMenuConfigAt(withDismissOnScroll(true))'],
  setup: `protected readonly lastAction = signal<string | null>(null);`,
  template: `  <div class="demo-scroll-host">
    <div
      class="demo-scroll-zone"
      tabindex="0"
      [cngxContextMenuTrigger]="ctx"
      [popover]="pop"
      #trigger="cngxContextMenuTrigger"
    >
      Right-click here, then scroll the window
    </div>
    <div cngxPopover #pop="cngxPopover" placement="bottom-start">
      <ul
        cngxMenu
        [label]="'Scroll-aware menu'"
        tabindex="0"
        #ctx="cngxMenu"
        (itemActivated)="lastAction.set($any($event)); pop.hide()"
      >
        <li cngxMenuItem value="copy">Copy</li>
        <li cngxMenuItem value="paste">Paste</li>
        <li cngxMenuItem value="delete">Delete</li>
      </ul>
    </div>
    <div class="demo-scroll-filler" aria-hidden="true">
      <p>Scroll content - opening the menu and then scrolling dismisses it.</p>
      <p>More content...</p>
      <p>More content...</p>
      <p>More content...</p>
      <p>More content...</p>
      <p>More content...</p>
      <p>More content...</p>
      <p>More content...</p>
      <p>More content...</p>
      <p>End of scroll content.</p>
    </div>
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
  css: `.demo-scroll-host {
  display: flex;
  flex-direction: column;
  gap: var(--cngx-space-md, 16px);
}
.demo-scroll-zone {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  padding: var(--cngx-space-md, 16px);
  border: 2px dashed var(--cngx-color-border, oklch(0.88 0.005 250));
  border-radius: var(--cngx-radius-md, 8px);
  background: var(--cngx-color-surface-variant, var(--cngx-color-surface, oklch(0.98 0.005 250)));
  color: var(--cngx-color-text-muted, oklch(0.5 0.01 250));
  cursor: context-menu;
  user-select: none;
}
.demo-scroll-zone:focus-visible {
  outline: 2px solid var(--cngx-color-primary, oklch(0.66 0.19 50));
  outline-offset: 2px;
}
.demo-scroll-filler {
  min-height: 220vh;
  padding: var(--cngx-space-md, 16px);
  color: var(--cngx-color-text-muted, oklch(0.5 0.01 250));
}`,
};
