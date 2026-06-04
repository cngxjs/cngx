import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxDialogDraggable: Header drag and keyboard move',
  subtitle: 'Opt-in via <code>cngxDialogDraggable</code>. Drag the header to move. Keyboard: Arrow keys (10px), Shift+Arrow (50px), Home (reset). Position is exposed as CSS custom properties <code>--cngx-dialog-x</code> / <code>--cngx-dialog-y</code>.',
  description: 'Adds repositioning to any cngxDialog. The pointer path runs against the header (anything outside cngxDialogTitle, .cngx-dialog-body, or buttons), the keyboard path runs against the focused dialog. Position is published as CSS custom properties so the transform can be themed.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['behavior', 'a11y-pattern'],
  references: [
    { label: 'WCAG 2.1: 2.1.1 Keyboard', href: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html' },
  ],
  apiComponents: [
    'CngxDialog',
    'CngxDialogDraggable',
    'CngxDialogClose',
  ],
  moduleImports: [
    'import { CngxDialog, CngxDialogTitle, CngxDialogClose, CngxDialogDraggable } from \'@cngx/common/dialog\';',
  ],
  imports: ['CngxDialog', 'CngxDialogTitle', 'CngxDialogClose', 'CngxDialogDraggable'],
  template: `  <button type="button" class="chip" (click)="dragDlg.open()">Open Draggable</button>

  <dialog cngxDialog cngxDialogDraggable #dragDlg="cngxDialog" #drag="cngxDialogDraggable"
    style="transform:translate(var(--cngx-dialog-x, 0px), var(--cngx-dialog-y, 0px))">
    <div class="demo-dialog-handle">
      <h2 cngxDialogTitle style="margin:0">Drag Me</h2>
      <button type="button" class="chip chip--icon-close" cngxDialogClose aria-label="Close dialog">X</button>
    </div>
    <p>Drag the header bar to reposition this dialog.</p>
  </dialog>`,
  templateChrome: `<div class="status-row" style="margin-top: 8px">
      <span class="status-badge">x: {{ drag.position().x }}px</span>
      <span class="status-badge">y: {{ drag.position().y }}px</span>
      <span class="status-badge">dragging: {{ drag.isDragging() }}</span>
    </div>`,
  css: `dialog[cngxDialogDraggable] { transform: translate(var(--cngx-dialog-x, 0px), var(--cngx-dialog-y, 0px)); }`,
};
