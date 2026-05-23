import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxDrawer: Pattern consumer wiring',
  subtitle:
    'The drawer is headless. The consumer wires <code>CngxAriaExpanded</code> on the trigger and binds <code>[enabled]</code> / <code>[autoFocus]</code> on the panel - both come from <code>CngxDrawerPanel</code> as <code>hostDirectives</code> pass-through inputs to <code>CngxFocusTrap</code>.',
  description:
    'Live drawer wired through the three consumer-owned a11y seams: CngxAriaExpanded on the <button> trigger, the panel forwarding [enabled] + [autoFocus] to its hostDirective CngxFocusTrap, and a single drawer.opened() signal everything reads from. The readout below shows the live aria-expanded attribute, the opened model, and the currently focused element id so the keyboard semantics are observable.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern'],
  references: [
    {
      label: 'WAI-ARIA aria-expanded',
      href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-expanded',
    },
    {
      label: 'WAI-ARIA APG: Dialog (Modal) Pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/',
    },
    {
      label: 'WCAG 2.4.3 Focus Order',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/focus-order.html',
    },
  ],
  apiComponents: ['CngxDrawer', 'CngxDrawerPanel', 'CngxAriaExpanded'],
  moduleImports: [
    "import { CngxDrawer, CngxDrawerPanel } from '@cngx/common/layout';",
    "import { CngxAriaExpanded } from '@cngx/common/a11y';",
  ],
  imports: ['CngxDrawer', 'CngxDrawerPanel', 'CngxAriaExpanded'],
  setup: `protected readonly focusedId = signal<string>('(none)');
  protected onFocusIn(ev: FocusEvent): void {
    const t = ev.target as HTMLElement | null;
    this.focusedId.set(t?.id || '(no id)');
  }
  protected onFocusOut(ev: FocusEvent): void {
    if (!(ev.relatedTarget instanceof HTMLElement)) {
      this.focusedId.set('(none)');
    }
  }`,
  template: `  <div cngxDrawer #drawer="cngxDrawer"
       (focusin)="onFocusIn($event)" (focusout)="onFocusOut($event)"
       class="demo-drawer-container demo-drawer-container--bordered">
    <div class="button-row" style="padding: 0.5rem;">
      <button id="pcw-trigger" type="button" class="sort-btn"
              [cngxAriaExpanded]="drawer.opened()" [controls]="'pcw-panel'"
              (click)="drawer.toggle()">
        {{ drawer.opened() ? 'Close' : 'Open' }} Menu
      </button>
    </div>

    <div class="demo-drawer-layout">
      <nav id="pcw-panel" [cngxDrawerPanel]="drawer" position="left"
           [enabled]="drawer.opened()" [autoFocus]="true"
           role="navigation" aria-label="Primary"
           class="demo-drawer-panel">
        <div class="demo-drawer-panel-content">
          <strong>Sidebar</strong>
          <button id="pcw-link-home" type="button" class="sort-btn">Home</button>
          <button id="pcw-link-profile" type="button" class="sort-btn">Profile</button>
          <button id="pcw-close" type="button" class="sort-btn" (click)="drawer.close()">Close</button>
        </div>
      </nav>

      <main class="demo-drawer-main">
        <p>Open the menu, then Tab through the panel. Focus stays trapped inside until the drawer closes; on close, the trigger re-receives focus.</p>
      </main>
    </div>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top: 12px">
    <div class="event-row">
      <span class="event-label">drawer.opened()</span>
      <span class="event-value">{{ drawer.opened() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">trigger aria-expanded</span>
      <span class="event-value">{{ drawer.opened() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">focused id</span>
      <span class="event-value">{{ focusedId() }}</span>
    </div>
  </div>`,
};
