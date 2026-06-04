import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxCombobox: slot override cngxcomboboxchip',
  subtitle: 'Per-chip override for the combobox\'s tag strip - same context shape as <code>*cngxMultiSelectChip</code> (<code>{ option, remove, index }</code>), so a consumer-authored chip template can be projected into either variant unchanged.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxCombobox',
    'CngxComboboxChip',
  ],
  moduleImports: [
    'import { CngxCombobox, CngxComboboxChip, type CngxSelectOptionDef } from \'@cngx/forms/select\';',
  ],
  imports: ['CngxCombobox', 'CngxComboboxChip'],
  setup: `protected readonly tagOptions: CngxSelectOptionDef<string>[] = [
    { value: 'angular', label: 'Angular' },
    { value: 'signals', label: 'Signals' },
    { value: 'rxjs', label: 'RxJS' },
    { value: 'a11y', label: 'Accessibility' },
    { value: 'ts', label: 'TypeScript' },
    { value: 'old', label: 'Unmaintained', disabled: true },
  ];
  protected readonly comboValues = signal<string[]>(['angular']);`,
  template: `  <cngx-combobox [label]="'Topics'" [options]="tagOptions" [(values)]="comboValues" placeholder="Choose tag…">
    <ng-template cngxComboboxChip let-opt let-remove="remove" let-i="index">
      <span class="demo-combobox-chip">
        <span aria-hidden="true">#{{ i + 1 }}</span>
        <strong>{{ opt.label }}</strong>
        <button type="button" (click)="remove()" aria-label="Remove" class="demo-combobox-chip-remove">×</button>
      </span>
    </ng-template>
  </cngx-combobox>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Values</span><span class="event-value">{{ comboValues().join(', ') || '—' }}</span></div>
  </div>`,
};
