import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Bottom Sheet',
  subtitle: '<code>CngxBottomSheet</code> is a molecule directive that positions the dialog at the viewport bottom with a drag handle (via <code>::before</code>) and slide-up animation. Add <code>[cngxSwipeDismiss]</code> for swipe-to-dismiss — the directive auto-wires it. Themed via <code>bottom-sheet-theme.scss</code> with CSS custom properties.',
  description: 'Signal-driven state machine for native <dialog>. Typed results, deterministic focus return, ARIA communication, CSS transition support, and opt-in draggable behavior.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern', 'behavior'],
  apiComponents: [
    'CngxDialog',
    'CngxDialogTitle',
    'CngxDialogDescription',
    'CngxDialogClose',
    'CngxDialogDraggable',
    'CngxDialogStack',
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
