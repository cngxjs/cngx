import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Draggable Dialog',
  subtitle: 'Opt-in via <code>cngxDialogDraggable</code>. Drag the header to move. Keyboard: Arrow keys (10px), Shift+Arrow (50px), Home (reset). Position is exposed as CSS custom properties <code>--cngx-dialog-x</code> / <code>--cngx-dialog-y</code>.',
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
    'import { CngxDialog, CngxDialogTitle, CngxDialogClose, CngxDialogDraggable } from \'@cngx/common/dialog\';',
  ],
  imports: ['CngxDialog', 'CngxDialogTitle', 'CngxDialogClose', 'CngxDialogDraggable'],
  template: `
  <button class="chip" (click)="dragDlg.open()">Open Draggable</button>

  <dialog cngxDialog cngxDialogDraggable #dragDlg="cngxDialog" #drag="cngxDialogDraggable"
    style="transform: translate(var(--cngx-dialog-x, 0px), var(--cngx-dialog-y, 0px));">
    <div style="display: flex; align-items: center; justify-content: space-between; cursor: grab; padding-bottom: 12px; border-bottom: 1px solid var(--cngx-color-border); margin-bottom: 12px;">
      <h2 cngxDialogTitle style="margin: 0;">Drag Me</h2>
      <button class="chip" cngxDialogClose style="padding: 2px 8px;" aria-label="Close dialog">X</button>
    </div>
    <p>Drag the header bar to reposition this dialog.</p>
    <div class="status-row" style="margin-top: 8px">
      <span class="status-badge">x: {{ drag.position().x }}px</span>
      <span class="status-badge">y: {{ drag.position().y }}px</span>
      <span class="status-badge">dragging: {{ drag.isDragging() }}</span>
    </div>
  </dialog>`,
  css: `dialog[cngxDialogDraggable] { transform: translate(var(--cngx-dialog-x, 0px), var(--cngx-dialog-y, 0px)); }`,
};
