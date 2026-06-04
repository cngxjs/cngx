import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxDrawer: Basic scroll lock backdrop',
  subtitle:
    '<code>[cngxScrollLock]</code> prevents body scroll when open. <code>[cngxBackdrop]</code> fades in an overlay and sets <code>inert</code> on sibling elements. Press <strong>Escape</strong>, click the backdrop, or click outside to close.',
  description:
    'Drawer wired with CngxScrollLock and CngxBackdrop. Opening locks the page scroll, fades the backdrop in, traps focus inside the panel, and links the trigger via CngxAriaExpanded.',
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
  ],
  imports: [
    'CngxDrawer',
    'CngxDrawerPanel',
    'CngxDrawerContent',
    'CngxAriaExpanded',
    'CngxScrollLock',
    'CngxBackdrop',
  ],
  template: `  <div cngxDrawer #drawer="cngxDrawer" [cngxScrollLock]="drawer.opened()" class="demo-drawer-container demo-drawer-container--bordered">
    <div class="button-row" style="padding: 0.5rem;">
      <button type="button" class="sort-btn"
              [cngxAriaExpanded]="drawer.opened()" [controls]="'basic-panel'"
              (click)="drawer.toggle()">
        {{ drawer.opened() ? 'Close' : 'Open' }} Drawer
      </button>
    </div>

    <div class="demo-drawer-layout">
      <div [cngxBackdrop]="drawer.opened()" (backdropClick)="drawer.close()"
           class="demo-drawer-backdrop"></div>

      <nav [cngxDrawerPanel]="drawer" position="left"
           [enabled]="drawer.opened()" [autoFocus]="true"
           id="basic-panel" role="navigation"
           class="demo-drawer-panel">
        <div class="demo-drawer-panel-content">
          <strong>Navigation</strong>
          <button type="button" class="sort-btn">Home</button>
          <button type="button" class="sort-btn">Settings</button>
          <button type="button" class="sort-btn">Profile</button>
          <button type="button" class="sort-btn" (click)="drawer.close()">Close</button>
        </div>
      </nav>

      <main [cngxDrawerContent]="drawer" class="demo-drawer-main">
        <p>Main content area. The drawer slides over from the left.</p>
        <p>Press <strong>Escape</strong>, click the backdrop, or click outside to close.</p>
        <p><code>[cngxScrollLock]</code> prevents background scrolling.</p>
      </main>
    </div>
  </div>`,
  templateChrome: `<div class="status-row">
    <span class="status-badge" [class.active]="drawer.opened()">
      {{ drawer.opened() ? 'open' : 'closed' }}
    </span>
  </div>`,
};
