import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxDrawer: Scroll lock and backdrop by hand',
  subtitle:
    'A drawer with its overlay parts wired by hand: <code>[cngxScrollLock]</code> locks the content area while the drawer is open. <code>[cngxBackdrop]</code> fades in an overlay and sets <code>inert</code> on sibling elements. Press <strong>Escape</strong>, click the backdrop, or click outside to close.',
  description:
    'Drawer wired with CngxScrollLock and CngxBackdrop. Opening locks the scroll of the content area, fades the backdrop in, traps focus inside the panel, and links the trigger via CngxAriaExpanded. Its twin, <em>CngxDrawer: Full-height modal drawer</em>, is the same page-modal drawer with nothing added: the panel locks the scroll container above it and the cngx-drawer skin paints the scrim. Add the two atoms only when the lock belongs on another element (here the content column) or the backdrop is your own (the skin scrim is set transparent here).',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern', 'behavior'],
  references: [
    {
      label: 'WAI-ARIA APG: Dialog (Modal) Pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/',
    },
    {
      label: 'WCAG 2.4.3 Focus Order',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/focus-order.html',
    },
  ],
  apiComponents: ['CngxDrawer', 'CngxDrawerPanel', 'CngxDrawerContent'],
  moduleImports: [
    "import { CngxDrawer, CngxDrawerPanel, CngxDrawerContent, CngxScrollLock, CngxBackdrop } from '@cngx/common/layout';",
    "import { CngxAriaExpanded } from '@cngx/common/a11y';",
    "import { CngxStack } from '@cngx/ui/layout';",
  ],
  imports: [
    'CngxDrawer',
    'CngxDrawerPanel',
    'CngxDrawerContent',
    'CngxAriaExpanded',
    'CngxScrollLock',
    'CngxBackdrop',
    'CngxStack',
  ],
  template: `  <div cngxDrawer #drawer="cngxDrawer" [cngxScrollLock]="drawer.opened()" [cngxScrollLockTarget]="content" class="cngx-drawer"
       style="--cngx-drawer-scrim-bg: transparent">
    <div [cngxBackdrop]="drawer.opened()" (backdropClick)="drawer.close()" class="cngx-backdrop"></div>

    <nav [cngxDrawerPanel]="drawer" position="left"
         id="basic-panel" role="navigation" label="Navigation">
      <cngx-stack gap="sm" align="start" style="padding: var(--cngx-space-md, 1rem)">
        <strong>Navigation</strong>
        <button type="button">Home</button>
        <button type="button">Settings</button>
        <button type="button">Profile</button>
        <button type="button" (click)="drawer.close()">Close</button>
      </cngx-stack>
    </nav>

    <main #content [cngxDrawerContent]="drawer" style="padding: var(--cngx-space-md, 1rem); overflow: auto">
      <button type="button"
              [cngxAriaExpanded]="drawer.opened()" [controls]="'basic-panel'"
              (click)="drawer.toggle()">
        {{ drawer.opened() ? 'Close' : 'Open' }} Drawer
      </button>
      <p>Main content area. The drawer slides over from the left.</p>
      <p>Press <strong>Escape</strong>, click the backdrop, or click outside to close.</p>
      <p>Scroll this area, then open the drawer: <code>[cngxScrollLock]</code> keeps it from scrolling until the drawer closes.</p>
      @for (n of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; track n) {
        <p>Content row {{ n }}</p>
      }
    </main>
  </div>`,
  templateChrome: `<div class="status-row">
    <span class="status-badge" [class.active]="drawer.opened()">
      {{ drawer.opened() ? 'open' : 'closed' }}
    </span>
  </div>`,
};
