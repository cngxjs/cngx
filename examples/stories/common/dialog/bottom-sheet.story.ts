import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxBottomSheet: Sheet with swipe-dismiss',
  subtitle: '<code>CngxBottomSheet</code> is a molecule directive that pins the dialog to the viewport bottom with a slide-up animation and a drag handle (rendered via <code>::before</code>). Pair with <code>[cngxSwipeDismiss]="\'down\'"</code> for swipe-to-dismiss. Themed via <code>bottom-sheet-theme.scss</code>.',
  description: 'Composes CngxDialog with CngxBottomSheet to anchor the dialog to the viewport bottom, and with CngxSwipeDismiss to dismiss on a downward swipe. The dialog still exposes the typed cngxDialogClose contract for option selection.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern', 'behavior'],
  references: [
    { label: 'WAI-ARIA APG: Dialog (modal)', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/' },
  ],
  apiComponents: [
    'CngxBottomSheet',
    'CngxDialog',
    'CngxDialogClose',
    'CngxSwipeDismiss',
  ],
  moduleImports: [
    'import { CngxDialog, CngxDialogTitle, CngxDialogClose, CngxBottomSheet } from \'@cngx/common/dialog\';',
    'import { CngxSwipeDismiss } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxDialog', 'CngxDialogTitle', 'CngxDialogClose', 'CngxBottomSheet', 'CngxSwipeDismiss'],
  template: `  <button class="chip" (click)="sheetDlg.open()">Open Bottom Sheet</button>

  <dialog cngxDialog cngxBottomSheet [cngxSwipeDismiss]="'down'" #sheetDlg="cngxDialog">
    <h2 cngxDialogTitle>Share Options</h2>
    <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 12px;">
      <button class="chip" [cngxDialogClose]="'copy'" style="text-align: left;">Copy Link</button>
      <button class="chip" [cngxDialogClose]="'email'" style="text-align: left;">Send via Email</button>
      <button class="chip" [cngxDialogClose]="'message'" style="text-align: left;">Send Message</button>
    </div>
    <button class="chip" cngxDialogClose style="margin-top: 16px; width: 100%;">Cancel</button>
  </dialog>`,
  templateChrome: `<div class="status-row" style="margin-top: 12px">
    <span class="status-badge">state: {{ sheetDlg.lifecycle() }}</span>
    <span class="status-badge">result: {{ sheetDlg.result() ?? '-' }}</span>
  </div>`,
};
