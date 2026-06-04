import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxCombobox: combobox clearable custom cngxselectclearbutton',
  subtitle: 'Reuse the shared <code>*cngxSelectClearButton</code> slot to swap the default ✕ for any consumer-authored trigger. Same slot works on <code>CngxSelect</code> and <code>CngxMultiSelect</code>.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxCombobox',
  ],
  moduleImports: [
    'import { CngxSelectClearButton, CngxCombobox, type CngxSelectOptionDef } from \'@cngx/forms/select\';',
  ],
  imports: ['CngxCombobox', 'CngxSelectClearButton'],
  setup: `protected readonly tagOptions: CngxSelectOptionDef<string>[] = [
    { value: 'angular', label: 'Angular' },
    { value: 'signals', label: 'Signals' },
    { value: 'rxjs', label: 'RxJS' },
    { value: 'a11y', label: 'Accessibility' },
    { value: 'ts', label: 'TypeScript' },
    { value: 'old', label: 'Unmaintained', disabled: true },
  ];
  protected readonly comboClearableValues = signal<string[]>(['angular']);`,
  template: `  <cngx-combobox
    [label]="'Topics'"
    [options]="tagOptions"
    [clearable]="true"
    [(values)]="comboClearableValues"
    placeholder="Search topics…"
  >
    <ng-template cngxSelectClearButton let-clear let-disabled="disabled">
      <button type="button" class="chip" [disabled]="disabled" (click)="clear()">
        Reset all
      </button>
    </ng-template>
  </cngx-combobox>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Values</span><span class="event-value">{{ comboClearableValues().join(', ') || '—' }}</span></div>
  </div>`,
};
