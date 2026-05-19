import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Empty state + loading flag',
  subtitle: 'Project <code>*cngxSelectEmpty</code> for the no-options state and <code>*cngxSelectPlaceholder</code> for the empty trigger. Toggle <code>[loading]</code> to render the family-shared loading view (spinner / bar / dots / skeleton — configurable via <code>provideSelectConfig(withLoadingVariant(...))</code>).',
  description: 'CngxSelectShell — single-value declarative-options dropdown. Project user-authored <cngx-option> / <cngx-optgroup> children directly; the shell derives a hierarchy-aware option model and runs the same family-level intelligence (createSelectCore, createFieldSync, createScalarCommitHandler, announcer) as CngxSelect.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxSelectShell',
    'CngxSelectOption',
    'CngxSelectOptgroup',
    'CngxSelectDivider',
  ],
  moduleImports: [
    'import { CngxSelectShell, CngxSelectOption, CngxSelectPlaceholder, CngxSelectEmpty } from \'@cngx/forms/select\';',
  ],
  imports: ['CngxSelectShell', 'CngxSelectOption', 'CngxSelectEmpty', 'CngxSelectPlaceholder'],
  setup: `protected readonly emptyValue = signal<string | undefined>(undefined);
  protected readonly loadingFlag = signal(false);`,
  template: `
  <div class="button-row" style="margin-bottom:12px">
    <label>
      <input
        type="checkbox"
        [checked]="loadingFlag()"
        (change)="loadingFlag.set($any($event.target).checked)"
      />
      Loading
    </label>
  </div>

  <cngx-select-shell
    [label]="'Item'"
    [loading]="loadingFlag()"
    [(value)]="emptyValue"
  >
    <ng-template cngxSelectPlaceholder let-ph>
      <em style="opacity:.6">— select an item —</em>
    </ng-template>
    <ng-template cngxSelectEmpty>
      <div style="padding:.75rem; opacity:.6; text-align:center">
        No options available
      </div>
    </ng-template>
  </cngx-select-shell>

  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">value</span>
      <span class="event-value">{{ emptyValue() ?? '—' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">tip</span>
      <span class="event-value">No projected options → empty template renders in the panel.</span>
    </div>
  </div>`,
};
