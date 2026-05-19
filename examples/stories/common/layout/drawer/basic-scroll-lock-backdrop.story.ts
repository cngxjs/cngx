import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Basic — Scroll Lock + Backdrop',
  subtitle: '<code>[cngxScrollLock]</code> prevents body scroll when open. <code>[cngxBackdrop]</code> fades in an overlay and sets <code>inert</code> on sibling elements. Press <strong>Escape</strong>, click the backdrop, or click outside to close.',
  description: 'Headless drawer/sidebar system: CngxDrawer (state), CngxDrawerPanel (sliding panel), CngxDrawerContent (content offset). Supports left/right/top/bottom, focus trapping, click-outside close, Escape key, and controlled+uncontrolled modes.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern', 'behavior'],
  apiComponents: [
    'CngxDrawer',
    'CngxDrawerPanel',
    'CngxDrawerContent',
  ],
  moduleImports: [
    'import { CngxDrawer, CngxDrawerPanel, CngxDrawerContent, CngxScrollLock, CngxBackdrop } from \'@cngx/common\';',
    'import { CngxAriaExpanded } from \'@cngx/common\';',
  ],
  imports: ['CngxDrawer', 'CngxDrawerPanel', 'CngxDrawerContent', 'CngxAriaExpanded', 'CngxScrollLock', 'CngxBackdrop'],
  template: `
  <div cngxDrawer #drawer="cngxDrawer" [cngxScrollLock]="drawer.opened()" class="drawer-container">
    <button class="sort-btn"
            [cngxAriaExpanded]="drawer.opened()" [controls]="'basic-panel'"
            (click)="drawer.toggle()">
      {{ drawer.opened() ? 'Close' : 'Open' }} Drawer
    </button>

    <div class="drawer-layout">
      <div [cngxBackdrop]="drawer.opened()" (backdropClick)="drawer.close()"
           class="drawer-backdrop"></div>

      <nav [cngxDrawerPanel]="drawer" position="left"
           [enabled]="drawer.opened()" [autoFocus]="true"
           id="basic-panel" role="navigation"
           class="drawer-panel">
        <div class="drawer-panel-content">
          <strong>Navigation</strong>
          <a href="javascript:void(0)">Home</a>
          <a href="javascript:void(0)">Settings</a>
          <a href="javascript:void(0)">Profile</a>
          <button class="sort-btn" (click)="drawer.close()">Close</button>
        </div>
      </nav>

      <main [cngxDrawerContent]="drawer" class="drawer-main">
        <p>Main content area. The drawer slides over from the left.</p>
        <p>Press <strong>Escape</strong>, click the backdrop, or click outside to close.</p>
        <p><code>[cngxScrollLock]</code> prevents background scrolling.</p>
      </main>
    </div>
  </div>

  <div class="status-row">
    <span class="status-badge" [class.active]="drawer.opened()">
      {{ drawer.opened() ? 'open' : 'closed' }}
    </span>
  </div>`,
};
