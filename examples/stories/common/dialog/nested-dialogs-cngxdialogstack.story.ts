import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxDialogStack: Nested dialogs and backdrop layering',
  subtitle: 'Multiple modal dialogs can be open simultaneously: the browser handles Top Layer stacking natively. <code>CngxDialogStack</code> manages backdrop visibility so only the topmost dialog shows its <code>::backdrop</code>, preventing cumulative darkening. Escape closes the topmost dialog first. Provide the stack via <code>provideDialogStack()</code> at feature level.',
  description: 'Two stacked modals share the native Top Layer. CngxDialogStack hides the backdrop of every dialog except the topmost so the surface never compounds. The lifecycle signals of both dialogs stay independently observable.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern', 'behavior'],
  references: [
    { label: 'WAI-ARIA APG: Dialog (modal)', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/' },
  ],
  apiComponents: [
    'CngxDialog',
    'CngxDialogStack',
  ],
  moduleImports: [
    'import { CngxDialog, CngxDialogTitle, CngxDialogDescription, CngxDialogClose } from \'@cngx/common/dialog\';',
  ],
  imports: ['CngxDialog', 'CngxDialogTitle', 'CngxDialogDescription', 'CngxDialogClose'],
  template: `  <button type="button" class="chip" (click)="outerDlg.open()">Open Settings</button>

  <!-- Outer dialog -->
  <dialog cngxDialog #outerDlg="cngxDialog">
    <h2 cngxDialogTitle>Settings</h2>
    <p cngxDialogDescription>Manage your preferences.</p>
    <div class="demo-dialog-section">
      <p style="margin:0 0 8px">Danger zone: reset all settings to defaults.</p>
      <button type="button" class="chip chip--danger" (click)="confirmReset.open()">
        Reset All
      </button>
    </div>
    <div class="button-row" style="justify-content:flex-end">
      <button type="button" class="chip" cngxDialogClose>Close Settings</button>
    </div>

    <!-- Inner (nested) confirmation dialog -->
    <dialog cngxDialog #confirmReset="cngxDialog">
      <h2 cngxDialogTitle>Reset all settings?</h2>
      <p cngxDialogDescription>This will restore all settings to their factory defaults. You cannot undo this.</p>
      <div class="button-row" style="margin-top:16px;justify-content:flex-end">
        <button type="button" class="chip" [cngxDialogClose]="false">Keep Settings</button>
        <button type="button" class="chip chip--danger" [cngxDialogClose]="true">Reset</button>
      </div>
    </dialog>
  </dialog>`,
  templateChrome: `<div class="status-row" style="margin-top:12px">
    <span class="status-badge">outer: {{ outerDlg.lifecycle() }}</span>
    <span class="status-badge">inner: {{ confirmReset.lifecycle() }}</span>
    <span class="status-badge">reset confirmed: {{ confirmReset.result() ?? '-' }}</span>
  </div>`,
};
