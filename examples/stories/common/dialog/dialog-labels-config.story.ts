import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxDialog: Dialog labels config',
  subtitle:
    'One <code>provideDialogConfigAt(withDialogLabels({...}))</code> renames the strings the dialog family writes on its own behalf: the implicit name of an icon-only <code>cngxDialogClose</code>, and the <code>aria-label</code>, <code>aria-roledescription</code> and keyboard instruction that <code>cngxDialogDraggable</code> puts on its drag handle. Both dialogs below use the same markup; only the second one sits under the scoped labels.',
  description:
    'None of these strings is visible, so the readout mirrors them from the DOM. The close button holds a single glyph and no <code>aria-label</code>, so <code>CngxDialogClose</code> names it from the config. The drag handle is an explicit <code>[handle]</code> element, so <code>CngxDialogDraggable</code> labels it and points <code>aria-describedby</code> at a visually hidden instruction. Unset keys keep the language pack text, and the fifth key, <code>errorFallback</code>, is spoken through the live region only when a dialog error carries no message of its own. A <code>provideDialogConfigAt</code> call in <code>viewProviders</code> would relabel every dialog in this view, so the demo builds the scope with <code>Injector.create</code> and hands it to <code>ngTemplateOutlet</code>.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'composition'],
  references: [
    {
      label: 'WAI-ARIA aria-roledescription',
      href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-roledescription',
    },
  ],
  apiComponents: ['CngxDialog', 'CngxDialogClose', 'CngxDialogDraggable'],
  moduleImports: [
    "import { NgTemplateOutlet } from '@angular/common';",
    "import { CngxDialog, CngxDialogClose, CngxDialogDraggable, CngxDialogTitle, provideDialogConfigAt, withDialogLabels } from '@cngx/common/dialog';",
  ],
  imports: [
    'NgTemplateOutlet',
    'CngxDialog',
    'CngxDialogTitle',
    'CngxDialogClose',
    'CngxDialogDraggable',
  ],
  setup: `private readonly injector = inject(Injector);

  protected readonly dialogScope = Injector.create({
    parent: this.injector,
    providers: provideDialogConfigAt(
      withDialogLabels({
        close: 'Dismiss shipping options',
        dragHandle: 'Drag shipping options',
        dragHandleRoleDescription: 'movable panel',
        dragInstructions: 'Arrow keys move the panel, hold Shift for bigger steps, Home resets it',
      }),
    ),
  });

  protected readonly titles = ['Shipping options, library labels', 'Shipping options, scoped labels'];`,
  template: `  <ng-template #panel let-side>
    <button type="button" class="chip" (click)="dlg.open()">Open {{ side === 0 ? 'default' : 'scoped' }} dialog</button>
    <dialog
      cngxDialog
      #dlg="cngxDialog"
      cngxDialogDraggable
      [handle]="handle"
      class="demo-dialog-labels"
      style="transform:translate(var(--cngx-dialog-x, 0px), var(--cngx-dialog-y, 0px))"
    >
      <div class="demo-dialog-handle" #handle>
        <h2 cngxDialogTitle style="margin:0">{{ titles[side] }}</h2>
        <button type="button" class="chip chip--icon-close" cngxDialogClose>X</button>
      </div>
      <p>Focus the header bar and use the arrow keys, or drag it with the pointer.</p>
    </dialog>
  </ng-template>

  <div class="demo-config-compare">
    <div class="demo-config-compare-pane">
      <h3 class="demo-config-compare-heading">Library labels</h3>
      <div class="demo-inline-actions">
        <ng-container *ngTemplateOutlet="panel; context: { $implicit: 0 }" />
      </div>
    </div>
    <div class="demo-config-compare-pane">
      <h3 class="demo-config-compare-heading">Scoped labels</h3>
      <div class="demo-inline-actions">
        <ng-container *ngTemplateOutlet="panel; context: { $implicit: 1 }; injector: dialogScope" />
      </div>
    </div>
  </div>`,
  setupChrome: `private readonly hostEl = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly mirrored = signal<readonly { close: string; handle: string; role: string; hint: string }[]>([]);

  private readonly readLabels = afterNextRender(() => {
    const dialogs = Array.from(this.hostEl.nativeElement.querySelectorAll('dialog.demo-dialog-labels'));
    this.mirrored.set(
      dialogs.map((dialog) => {
        const handle = dialog.querySelector('.demo-dialog-handle');
        const hintId = handle?.getAttribute('aria-describedby') ?? '';
        return {
          close: dialog.querySelector('.chip--icon-close')?.getAttribute('aria-label') ?? '-',
          handle: handle?.getAttribute('aria-label') ?? '-',
          role: handle?.getAttribute('aria-roledescription') ?? '-',
          hint: (hintId ? dialog.querySelector('#' + hintId)?.textContent : null) ?? '-',
        };
      }),
    );
  });`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    @for (row of mirrored(); track $index) {
      <div class="event-row"><span class="event-label">{{ $index === 0 ? 'Default' : 'Scoped' }} close name</span><span class="event-value">{{ row.close }}</span></div>
      <div class="event-row"><span class="event-label">{{ $index === 0 ? 'Default' : 'Scoped' }} handle name</span><span class="event-value">{{ row.handle }}</span></div>
      <div class="event-row"><span class="event-label">{{ $index === 0 ? 'Default' : 'Scoped' }} handle role</span><span class="event-value">{{ row.role }}</span></div>
      <div class="event-row"><span class="event-label">{{ $index === 0 ? 'Default' : 'Scoped' }} instruction</span><span class="event-value">{{ row.hint }}</span></div>
    }
  </div>`,
};
