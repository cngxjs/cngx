import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Dialog',
  navLabel: 'Dialog',
  navCategory: 'dialog',
  description:
    'Signal-driven state machine for native <dialog>. Typed results, deterministic focus return, ' +
    'ARIA communication, CSS transition support, and opt-in draggable behavior.',
  apiComponents: [
    'CngxDialog',
    'CngxDialogTitle',
    'CngxDialogDescription',
    'CngxDialogClose',
    'CngxDialogDraggable',
    'CngxDialogStack',
  ],
  overview:
    '<p><code>CngxDialog</code> wraps the native <code>&lt;dialog&gt;</code> element in a reactive ' +
    'Signal state machine. State flows through <code>closed → opening → open → closing → closed</code>. ' +
    'The <code>result()</code> signal carries the typed dialog outcome — no Observables, no subscriptions.</p>' +
    '<p>Focus is captured on open and deterministically returned on close. ' +
    '<code>aria-labelledby</code>, <code>aria-describedby</code>, and <code>aria-modal</code> are ' +
    'wired automatically via child directives.</p>',
  moduleImports: [
    "import { viewChild } from '@angular/core';",
    "import { CngxDialog, CngxDialogTitle, CngxDialogDescription, CngxDialogClose, CngxDialogDraggable, CngxBottomSheet } from '@cngx/common/dialog';",
    "import { CngxSwipeDismiss } from '@cngx/common/interactive';",
    "import { FormsModule } from '@angular/forms';",
    "import { JsonPipe } from '@angular/common';",
  ],
  setup: `
  // Fake form data for the form dialog demo
  protected readonly formData = { name: '', email: '' };

  // ── Programmatic demo ──────────────────────────────────────────
  protected readonly progDialog = viewChild<CngxDialog<'saved' | 'discarded'>>('progDialog');

  protected readonly progMessage = computed(() => {
    const result = this.progDialog()?.result();
    if (result === undefined) return 'No dialog result yet.';
    if (result === 'dismissed') return 'Dialog was dismissed (Escape or backdrop).';
    return 'Dialog returned: ' + String(result);
  });

  protected handleOpenProgrammatic(): void {
    this.progDialog()?.open();
  }

  protected handleSaveProgrammatic(): void {
    this.progDialog()?.close('saved');
  }

  protected handleDiscardProgrammatic(): void {
    this.progDialog()?.close('discarded');
  }
  `,
  sections: [
    // ── 1. Fully Declarative ──────────────────────────────────────
    {
      title: 'Fully Declarative',
      subtitle:
        'Zero TypeScript — everything lives in the template. ' +
        '<code>#dlg="cngxDialog"</code> exposes the full <code>DialogRef</code> API: ' +
        '<code>open()</code>, <code>close(value)</code>, <code>dismiss()</code>, ' +
        '<code>state()</code>, <code>result()</code>.',
      imports: ['CngxDialog', 'CngxDialogTitle', 'CngxDialogDescription', 'CngxDialogClose'],
      template: `
  <button class="chip" (click)="declDlg.open()">Delete Item</button>

  <dialog cngxDialog #declDlg="cngxDialog">
    <h2 cngxDialogTitle>Delete item?</h2>
    <p cngxDialogDescription>This action cannot be undone. The item will be permanently removed.</p>
    <div class="button-row" style="margin-top: 16px; justify-content: flex-end;">
      <button class="chip" [cngxDialogClose]="false">Cancel</button>
      <button class="chip chip--active" [cngxDialogClose]="true">Delete</button>
    </div>
  </dialog>

  <div class="status-row" style="margin-top: 12px">
    <span class="status-badge">state: {{ declDlg.state() }}</span>
    <span class="status-badge">result: {{ declDlg.result() ?? 'undefined' }}</span>
  </div>`,
    },

    // ── 2. Programmatic Control ───────────────────────────────────
    {
      title: 'Programmatic Control',
      subtitle:
        'Open and close from component code via <code>viewChild</code>. ' +
        'The <code>result()</code> signal feeds into <code>computed()</code> — ' +
        'no subscriptions, no event handlers, pure reactive derivation.',
      imports: ['CngxDialog', 'CngxDialogTitle'],
      template: `
  <div class="button-row">
    <button class="chip" (click)="handleOpenProgrammatic()">Open from Code</button>
  </div>

  <dialog cngxDialog #progDialog="cngxDialog">
    <h2 cngxDialogTitle>Unsaved Changes</h2>
    <p style="margin: 12px 0;">You have unsaved changes. What would you like to do?</p>
    <div class="button-row" style="justify-content: flex-end;">
      <button class="chip" (click)="handleDiscardProgrammatic()">Discard</button>
      <button class="chip chip--active" (click)="handleSaveProgrammatic()">Save</button>
    </div>
  </dialog>

  <div class="code-block" style="margin-top: 12px">
    {{ progMessage() }}
  </div>
  <div class="status-row" style="margin-top: 8px">
    <span class="status-badge">state: {{ progDialog.state() }}</span>
    <span class="status-badge">result: {{ progDialog.result() ?? 'undefined' }}</span>
  </div>`,
    },

    // ── 3. CngxDialogOpener (Programmatic) ───────────────────────
    {
      title: 'CngxDialogOpener (Programmatic)',
      subtitle:
        'For fully programmatic dialogs — no <code>&lt;dialog&gt;</code> in your template — use ' +
        '<code>CngxDialogOpener</code>. Requires <code>provideDialog()</code> in providers. ' +
        'Returns a typed <code>CngxDialogRef</code> with Signal-based result and Observable compat.',
      imports: [],
      template: `
  <div class="code-block">
    <strong>CngxDialogOpener</strong> is the imperative escape hatch for cases where
    a declarative &lt;dialog&gt; in the template is impractical — e.g. opening a dialog
    from a service, or when the dialog component lives in a separate feature.
    <br><br>
    Key points:
    <ul style="margin: 8px 0 0; padding-left: 20px;">
      <li><code>provideDialog()</code> must be in providers (app or feature level)</li>
      <li><code>dialog.open(Component, config)</code> returns a typed <code>CngxDialogRef</code></li>
      <li>Inject <code>CNGX_DIALOG_DATA</code> in the dialog component to receive data</li>
      <li><code>ref.result()</code> is a Signal — use in computed() or effect()</li>
      <li><code>ref.close(value)</code> sets the result and closes the dialog</li>
      <li>The declarative &lt;dialog cngxDialog&gt; approach (shown above) covers most use cases</li>
    </ul>
  </div>`,
    },

    // ── 4. Template Directives ──────────────────────────────────
    {
      title: 'Template Directives',
      subtitle:
        'The dialog is composed from focused directives: ' +
        '<code>cngxDialogTitle</code> auto-wires <code>aria-labelledby</code>, ' +
        '<code>cngxDialogDescription</code> wires <code>aria-describedby</code>, ' +
        '<code>cngxDialogClose</code> handles close with a typed value or dismiss without one. ' +
        'Each directive generates deterministic ARIA IDs — no manual <code>id</code> management.',
      imports: ['CngxDialog', 'CngxDialogTitle', 'CngxDialogDescription', 'CngxDialogClose', 'FormsModule', 'JsonPipe'],
      template: `
  <button class="chip" (click)="tmplDlg.open()">Edit Profile</button>

  <dialog cngxDialog #tmplDlg="cngxDialog">
    <!-- cngxDialogTitle: sets aria-labelledby on the dialog -->
    <h2 cngxDialogTitle>Edit Profile</h2>

    <!-- cngxDialogDescription: sets aria-describedby on the dialog -->
    <p cngxDialogDescription>Update your name and email. Changes are saved immediately.</p>

    <form style="display: flex; flex-direction: column; gap: 12px; margin-top: 12px; min-width: 300px;"
          (ngSubmit)="tmplDlg.close({ name: formData.name, email: formData.email })">
      <label>
        Name
        <input [(ngModel)]="formData.name" name="name"
          style="display: block; width: 100%; margin-top: 4px; padding: 6px 8px; border: 1px solid var(--border-color, #ddd); border-radius: 4px;" />
      </label>
      <label>
        Email
        <input [(ngModel)]="formData.email" name="email" type="email"
          style="display: block; width: 100%; margin-top: 4px; padding: 6px 8px; border: 1px solid var(--border-color, #ddd); border-radius: 4px;" />
      </label>
      <div class="button-row" style="justify-content: flex-end;">
        <!-- cngxDialogClose without value: calls dismiss() -->
        <button type="button" class="chip" cngxDialogClose>Cancel</button>
        <!-- Form submit calls close() with the typed result -->
        <button type="submit" class="chip chip--active">Save</button>
      </div>
    </form>
  </dialog>

  <div class="status-row" style="margin-top: 12px">
    <span class="status-badge">state: {{ tmplDlg.state() }}</span>
    <span class="status-badge">result: {{ tmplDlg.result() | json }}</span>
  </div>`,
    },

    // ── 5. Alert Dialog ───────────────────────────────────────────
    {
      title: 'Alert Dialog',
      subtitle:
        'Uses <code>role="alertdialog"</code> and disables backdrop close. ' +
        'Only the explicit OK button can close it. Screen readers announce the urgency.',
      imports: ['CngxDialog', 'CngxDialogTitle', 'CngxDialogClose'],
      template: `
  <button class="chip" (click)="alertDlg.open()">Show Alert</button>

  <dialog cngxDialog role="alertdialog" [closeOnBackdropClick]="false" #alertDlg="cngxDialog">
    <h2 cngxDialogTitle>Session Expired</h2>
    <p>Your session has expired. Please log in again to continue.</p>
    <div class="button-row" style="margin-top: 16px; justify-content: flex-end;">
      <button class="chip chip--active" [cngxDialogClose]="undefined">OK</button>
    </div>
  </dialog>`,
    },

    // ── 6. Nested Dialogs (Stack) ─────────────────────────────────
    {
      title: 'Nested Dialogs (CngxDialogStack)',
      subtitle:
        'Multiple modal dialogs can be open simultaneously — the browser handles Top Layer stacking natively. ' +
        '<code>CngxDialogStack</code> manages backdrop visibility: only the topmost dialog shows its ' +
        '<code>::backdrop</code>, preventing cumulative darkening. ' +
        'Escape closes the topmost dialog first. Provide the stack via <code>provideDialogStack()</code> at feature level.',
      imports: ['CngxDialog', 'CngxDialogTitle', 'CngxDialogDescription', 'CngxDialogClose'],
      template: `
  <button class="chip" (click)="outerDlg.open()">Open Settings</button>

  <!-- Outer dialog -->
  <dialog cngxDialog #outerDlg="cngxDialog">
    <h2 cngxDialogTitle>Settings</h2>
    <p cngxDialogDescription>Manage your preferences.</p>
    <div style="margin: 16px 0; padding: 12px; border: 1px solid var(--border-color, #eee); border-radius: 4px;">
      <p style="margin: 0 0 8px;">Danger zone: reset all settings to defaults.</p>
      <button class="chip" style="color: #c62828; border-color: #c62828;" (click)="confirmReset.open()">
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
        <button class="chip" style="color: #c62828; border-color: #c62828;" [cngxDialogClose]="true">Reset</button>
      </div>
    </dialog>
  </dialog>

  <div class="status-row" style="margin-top: 12px">
    <span class="status-badge">outer: {{ outerDlg.state() }}</span>
    <span class="status-badge">inner: {{ confirmReset.state() }}</span>
    <span class="status-badge">reset confirmed: {{ confirmReset.result() ?? '-' }}</span>
  </div>`,
    },

    // ── 7. Non-Modal ──────────────────────────────────────────────
    {
      title: 'Non-Modal Panel',
      subtitle:
        'Opens with <code>[modal]="false"</code> via <code>dialog.show()</code>. ' +
        'No focus trap, no backdrop, no <code>aria-modal</code>. ' +
        'The page remains fully interactive behind the dialog.',
      imports: ['CngxDialog', 'CngxDialogTitle', 'CngxDialogClose'],
      template: `
  <button class="chip" (click)="panelDlg.open()">Show Help Panel</button>

  <dialog cngxDialog [modal]="false" #panelDlg="cngxDialog"
    style="position: fixed; top: 80px; right: 24px; border: 1px solid var(--border-color, #ddd); border-radius: 8px; padding: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    <h3 cngxDialogTitle>Quick Help</h3>
    <p style="max-width: 240px; margin: 8px 0;">This is a non-modal panel. You can still interact with the page behind it.</p>
    <button class="chip" cngxDialogClose>Close</button>
  </dialog>

  <div class="status-row" style="margin-top: 12px">
    <span class="status-badge">state: {{ panelDlg.state() }}</span>
    <span class="status-badge">modal: false</span>
  </div>`,
    },

    // ── 8. Draggable ──────────────────────────────────────────────
    {
      title: 'Draggable Dialog',
      subtitle:
        'Opt-in via <code>cngxDialogDraggable</code>. Drag the header to move. ' +
        'Keyboard: Arrow keys (10px), Shift+Arrow (50px), Home (reset). ' +
        'Position is exposed as CSS custom properties <code>--cngx-dialog-x</code> / <code>--cngx-dialog-y</code>.',
      imports: ['CngxDialog', 'CngxDialogTitle', 'CngxDialogClose', 'CngxDialogDraggable'],
      css: `dialog[cngxDialogDraggable] { transform: translate(var(--cngx-dialog-x, 0px), var(--cngx-dialog-y, 0px)); }`,
      template: `
  <button class="chip" (click)="dragDlg.open()">Open Draggable</button>

  <dialog cngxDialog cngxDialogDraggable #dragDlg="cngxDialog" #drag="cngxDialogDraggable"
    style="transform: translate(var(--cngx-dialog-x, 0px), var(--cngx-dialog-y, 0px));">
    <div style="display: flex; align-items: center; justify-content: space-between; cursor: grab; padding-bottom: 12px; border-bottom: 1px solid var(--border-color, #eee); margin-bottom: 12px;">
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
    },

    // ── 9. Grid Snap — Live vs Release ──────────────────────────
    {
      title: 'Grid Snap — Live vs Release',
      subtitle:
        '<code>[gridSize]="20"</code> snaps position to 20px increments. ' +
        '<code>snapMode</code> controls when: <code>live</code> snaps every frame during drag, ' +
        '<code>release</code> lets you drag freely and snaps only on pointer up. ' +
        'Keyboard arrow step adapts to grid size (20px, Shift = 100px).',
      imports: ['CngxDialog', 'CngxDialogTitle', 'CngxDialogClose', 'CngxDialogDraggable'],
      css: `dialog[cngxDialogDraggable] { transform: translate(var(--cngx-dialog-x, 0px), var(--cngx-dialog-y, 0px)); }`,
      setup: `
  protected readonly snapModeToggle = signal<'live' | 'release'>('live');

  protected toggleSnapMode(): void {
    this.snapModeToggle.update(m => m === 'live' ? 'release' : 'live');
  }
  `,
      template: `
  <div class="button-row">
    <button class="chip" (click)="snapLiveDlg.open()">Live Snap (20px)</button>
    <button class="chip" (click)="snapReleaseDlg.open()">Release Snap (20px)</button>
  </div>

  <!-- Live snap: position snaps every frame -->
  <dialog cngxDialog cngxDialogDraggable [gridSize]="20" snapMode="live"
    #snapLiveDlg="cngxDialog" #snapLiveDrag="cngxDialogDraggable"
    style="transform: translate(var(--cngx-dialog-x, 0px), var(--cngx-dialog-y, 0px));">
    <div style="display: flex; align-items: center; justify-content: space-between; cursor: grab; padding-bottom: 12px; border-bottom: 1px solid var(--border-color, #eee); margin-bottom: 12px;">
      <h2 cngxDialogTitle style="margin: 0;">Live Snap (20px)</h2>
      <button class="chip" cngxDialogClose style="padding: 2px 8px;" aria-label="Close dialog">X</button>
    </div>
    <p>Drag the header. Position snaps to grid every frame.</p>
    <div class="status-row" style="margin-top: 8px">
      <span class="status-badge">mode: live</span>
      <span class="status-badge">x: {{ snapLiveDrag.position().x }}px</span>
      <span class="status-badge">y: {{ snapLiveDrag.position().y }}px</span>
    </div>
  </dialog>

  <!-- Release snap: free drag, snaps on pointer up -->
  <dialog cngxDialog cngxDialogDraggable [gridSize]="20" snapMode="release"
    #snapReleaseDlg="cngxDialog" #snapReleaseDrag="cngxDialogDraggable"
    style="transform: translate(var(--cngx-dialog-x, 0px), var(--cngx-dialog-y, 0px));">
    <div style="display: flex; align-items: center; justify-content: space-between; cursor: grab; padding-bottom: 12px; border-bottom: 1px solid var(--border-color, #eee); margin-bottom: 12px;">
      <h2 cngxDialogTitle style="margin: 0;">Release Snap (20px)</h2>
      <button class="chip" cngxDialogClose style="padding: 2px 8px;" aria-label="Close dialog">X</button>
    </div>
    <p>Drag freely — position snaps to grid only when you release.</p>
    <div class="status-row" style="margin-top: 8px">
      <span class="status-badge">mode: release</span>
      <span class="status-badge">x: {{ snapReleaseDrag.position().x }}px</span>
      <span class="status-badge">y: {{ snapReleaseDrag.position().y }}px</span>
    </div>
  </dialog>

  <div class="status-row" style="margin-top: 12px">
    <span class="status-badge">live x: {{ snapLiveDrag.position().x }}px</span>
    <span class="status-badge">release x: {{ snapReleaseDrag.position().x }}px</span>
  </div>`,
    },

    // ── 10. Bottom Sheet (Molecule) ──────────────────────────────
    {
      title: 'Bottom Sheet',
      subtitle:
        '<code>CngxBottomSheet</code> is a molecule directive that positions the dialog at the viewport ' +
        'bottom with a drag handle (via <code>::before</code>) and slide-up animation. ' +
        'Add <code>[cngxSwipeDismiss]</code> for swipe-to-dismiss — the directive auto-wires it. ' +
        'Themed via <code>bottom-sheet-theme.scss</code> with CSS custom properties.',
      imports: ['CngxDialog', 'CngxDialogTitle', 'CngxDialogClose', 'CngxBottomSheet', 'CngxSwipeDismiss'],
      template: `
  <button class="chip" (click)="sheetDlg.open()">Open Bottom Sheet</button>

  <dialog cngxDialog cngxBottomSheet [cngxSwipeDismiss]="'down'" #sheetDlg="cngxDialog">
    <h2 cngxDialogTitle>Share Options</h2>
    <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 12px;">
      <button class="chip" [cngxDialogClose]="'copy'" style="text-align: left;">Copy Link</button>
      <button class="chip" [cngxDialogClose]="'email'" style="text-align: left;">Send via Email</button>
      <button class="chip" [cngxDialogClose]="'message'" style="text-align: left;">Send Message</button>
    </div>
    <button class="chip" cngxDialogClose style="margin-top: 16px; width: 100%;">Cancel</button>
  </dialog>

  <div class="status-row" style="margin-top: 12px">
    <span class="status-badge">state: {{ sheetDlg.state() }}</span>
    <span class="status-badge">result: {{ sheetDlg.result() ?? '-' }}</span>
  </div>`,
    },
  ],
};
