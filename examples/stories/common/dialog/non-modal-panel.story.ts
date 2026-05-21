import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxDialog: Non-modal panel',
  subtitle: '<code>[modal]="false"</code> routes to <code>dialog.show()</code> instead of <code>showModal()</code>. No focus trap, no backdrop, no <code>aria-modal</code>. The page remains fully interactive behind the panel. The dialog anchors to its trigger via CSS Anchor Positioning, no <code>position: fixed</code> coordinates in the markup.',
  description: 'Renders the native <dialog> in non-modal mode. The dialog still owns its open state and ARIA wiring, but the rest of the page stays interactive. Placement is declared in CSS: the trigger button names an anchor (anchor-name), the dialog binds to it (position-anchor) and asks for the bottom + inline-end region (position-area). Use for inline help, side panels, or any surface that should not steal focus.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['behavior', 'a11y-pattern'],
  references: [
    { label: 'HTML Living Standard: dialog.show()', href: 'https://html.spec.whatwg.org/multipage/interactive-elements.html#dom-dialog-show' },
    { label: 'W3C: CSS Anchor Positioning Level 1', href: 'https://www.w3.org/TR/css-anchor-position-1/' },
  ],
  apiComponents: [
    'CngxDialog',
    'CngxDialogTitle',
    'CngxDialogClose',
  ],
  moduleImports: [
    'import { CngxDialog, CngxDialogTitle, CngxDialogClose } from \'@cngx/common/dialog\';',
  ],
  imports: ['CngxDialog', 'CngxDialogTitle', 'CngxDialogClose'],
  template: `  <button class="chip demo-dialog-anchor" (click)="panelDlg.open()">Show Help Panel</button>

  <dialog cngxDialog [modal]="false" #panelDlg="cngxDialog"
          class="demo-dialog-floating demo-dialog-anchored">
    <h3 cngxDialogTitle>Quick Help</h3>
    <p>This is a non-modal panel. You can still interact with the page behind it.</p>
    <button class="chip" cngxDialogClose>Close</button>
  </dialog>`,
  templateChrome: `<div class="status-row" style="margin-top: 12px">
    <span class="status-badge">state: {{ panelDlg.lifecycle() }}</span>
    <span class="status-badge">modal: false</span>
  </div>`,
};
