import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Nested Dialogs (CngxDialogStack)',
  subtitle: 'Multiple modal dialogs can be open simultaneously — the browser handles Top Layer stacking natively. <code>CngxDialogStack</code> manages backdrop visibility: only the topmost dialog shows its <code>::backdrop</code>, preventing cumulative darkening. Escape closes the topmost dialog first. Provide the stack via <code>provideDialogStack()</code> at feature level.',
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
    'import { CngxDialog, CngxDialogTitle, CngxDialogDescription, CngxDialogClose } from \'@cngx/common/dialog\';',
  ],
  imports: ['CngxDialog', 'CngxDialogTitle', 'CngxDialogDescription', 'CngxDialogClose'],
  template: `
  <button class="chip" (click)="outerDlg.open()">Open Settings</button>

  <!-- Outer dialog -->
  <dialog cngxDialog #outerDlg="cngxDialog">
    <h2 cngxDialogTitle>Settings</h2>
    <p cngxDialogDescription>Manage your preferences.</p>
    <div style="margin: 16px 0; padding: 12px; border: 1px solid var(--cngx-color-border); border-radius: 4px;">
      <p style="margin: 0 0 8px;">Danger zone: reset all settings to defaults.</p>
      <button class="chip" style="color: var(--cngx-color-danger); border-color: var(--cngx-color-danger);" (click)="confirmReset.open()">
        Reset All
      </button>
    </div>

    <div class="button-row" style="justify-content: flex-end;">
      <button class="chip" cngxDialogClose>Close Settings</button>
    </div>

    <!-- Inner (nested) confirmation dialog -->
    <dialog cngxDialog #confirmReset="cngxDialog">
      <h2 cngxDialogTitle>Reset all settings?</h2>
      <p cngxDialogDescription>This will restore all settings to their factory defaults. You cannot undo this.</p>
      <div class="button-row" style="margin-top: 16px; justify-content: flex-end;">
        <button class="chip" [cngxDialogClose]="false">Keep Settings</button>
        <button class="chip" style="color: var(--cngx-color-danger); border-color: var(--cngx-color-danger);" [cngxDialogClose]="true">Reset</button>
      </div>
    </dialog>
  </dialog>

  <div class="status-row" style="margin-top: 12px">
    <span class="status-badge">outer: {{ outerDlg.lifecycle() }}</span>
    <span class="status-badge">inner: {{ confirmReset.lifecycle() }}</span>
    <span class="status-badge">reset confirmed: {{ confirmReset.result() ?? '-' }}</span>
  </div>`,
};
