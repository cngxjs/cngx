import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxDialogDraggable: Grid snap, live vs release',
  subtitle: '<code>[gridSize]="20"</code> snaps position to 20px increments. <code>snapMode</code> controls when: <code>live</code> snaps every frame during drag, <code>release</code> lets you drag freely and snaps only on pointer up. Keyboard arrow step adapts to grid size (20px, Shift = 100px).',
  description: 'Two dialogs with the same gridSize but different snapMode contrast the two snap strategies side by side. The live mode reads the snapped position from the host transform on every frame; the release mode lets the pointer path stay smooth and snaps only on pointer up.',
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
  template: `  <!-- Live snap: position snaps every frame -->
  <dialog cngxDialog cngxDialogDraggable [gridSize]="20" snapMode="live"
    #snapLiveDlg="cngxDialog" #snapLiveDrag="cngxDialogDraggable"
    style="transform:translate(var(--cngx-dialog-x, 0px), var(--cngx-dialog-y, 0px))">
    <div class="demo-dialog-handle">
      <h2 cngxDialogTitle style="margin:0">Live Snap (20px)</h2>
      <button type="button" class="chip chip--icon-close" cngxDialogClose aria-label="Close dialog">X</button>
    </div>
    <p>Drag the header. Position snaps to grid every frame.</p>
  </dialog>

  <!-- Release snap: free drag, snaps on pointer up -->
  <dialog cngxDialog cngxDialogDraggable [gridSize]="20" snapMode="release"
    #snapReleaseDlg="cngxDialog" #snapReleaseDrag="cngxDialogDraggable"
    style="transform:translate(var(--cngx-dialog-x, 0px), var(--cngx-dialog-y, 0px))">
    <div class="demo-dialog-handle">
      <h2 cngxDialogTitle style="margin:0">Release Snap (20px)</h2>
      <button type="button" class="chip chip--icon-close" cngxDialogClose aria-label="Close dialog">X</button>
    </div>
    <p>Drag freely, position snaps to grid only when you release.</p>
  </dialog>`,
  templateChrome: `<div class="button-row">
    <button type="button" class="chip" (click)="snapLiveDlg.open()">Live Snap (20px)</button>
    <button type="button" class="chip" (click)="snapReleaseDlg.open()">Release Snap (20px)</button>
  </div>
<div class="status-row" style="margin-top: 8px">
      <span class="status-badge">mode: live</span>
      <span class="status-badge">x: {{ snapLiveDrag.position().x }}px</span>
      <span class="status-badge">y: {{ snapLiveDrag.position().y }}px</span>
    </div>
<div class="status-row" style="margin-top: 8px">
      <span class="status-badge">mode: release</span>
      <span class="status-badge">x: {{ snapReleaseDrag.position().x }}px</span>
      <span class="status-badge">y: {{ snapReleaseDrag.position().y }}px</span>
    </div>
<div class="status-row" style="margin-top: 12px">
    <span class="status-badge">live x: {{ snapLiveDrag.position().x }}px</span>
    <span class="status-badge">release x: {{ snapReleaseDrag.position().x }}px</span>
  </div>`,
  css: `dialog[cngxDialogDraggable] { transform: translate(var(--cngx-dialog-x, 0px), var(--cngx-dialog-y, 0px)); }`,
};
