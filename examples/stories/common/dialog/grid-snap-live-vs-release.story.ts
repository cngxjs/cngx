import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxDialogDraggable: Grid snap, live vs release',
  subtitle: '<code>[gridSize]="20"</code> snaps position to 20px increments. <code>snapMode</code> controls when: <code>live</code> snaps every frame during drag, <code>release</code> lets you drag freely and snaps only on pointer up. Keyboard arrow step adapts to grid size (20px, Shift = 100px).',
  description: 'One draggable dialog whose snapMode is bound to a signal; the toggle button flips between live and release without reopening. Live mode reads the snapped position from the host transform on every frame; release mode lets the pointer path stay smooth and snaps only on pointer up. The position badges read straight off the directive signal.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['behavior', 'visual-variants'],
  apiComponents: [
    'CngxDialog',
    'CngxDialogDraggable',
    'CngxDialogClose',
  ],
  moduleImports: [
    'import { CngxDialog, CngxDialogTitle, CngxDialogClose, CngxDialogDraggable } from \'@cngx/common/dialog\';',
  ],
  imports: ['CngxDialog', 'CngxDialogTitle', 'CngxDialogClose', 'CngxDialogDraggable'],
  setup: `protected readonly snapModeToggle = signal<'live' | 'release'>('live');
  protected toggleSnapMode(): void {
    this.snapModeToggle.update(m => m === 'live' ? 'release' : 'live');
  }`,
  template: `  <dialog cngxDialog cngxDialogDraggable [gridSize]="20" [snapMode]="snapModeToggle()"
    #snapDlg="cngxDialog" #snapDrag="cngxDialogDraggable"
    style="transform:translate(var(--cngx-dialog-x, 0px), var(--cngx-dialog-y, 0px))">
    <div class="demo-dialog-handle">
      <h2 cngxDialogTitle style="margin:0">Grid snap ({{ snapModeToggle() }})</h2>
      <button type="button" class="chip chip--icon-close" cngxDialogClose aria-label="Close dialog">X</button>
    </div>
    <p>Drag the header. Grid is 20px. In <strong>live</strong> mode the position snaps every frame; in <strong>release</strong> mode it stays free and snaps on pointer up.</p>
  </dialog>`,
  templateChrome: `<div class="button-row">
    <button type="button" class="chip" (click)="snapDlg.open()">Open dialog</button>
    <button type="button" class="chip" (click)="toggleSnapMode()">Toggle snap mode</button>
  </div>
<div class="status-row" style="margin-top: 8px">
    <span class="status-badge">mode: {{ snapModeToggle() }}</span>
    <span class="status-badge">x: {{ snapDrag.position().x }}px</span>
    <span class="status-badge">y: {{ snapDrag.position().y }}px</span>
  </div>`,
  css: `dialog[cngxDialogDraggable] { transform: translate(var(--cngx-dialog-x, 0px), var(--cngx-dialog-y, 0px)); }`,
};
