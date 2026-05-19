import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Slot override: *cngxComboboxChip',
  subtitle: 'Per-chip override for the combobox\'s tag strip — same context shape as <code>*cngxMultiSelectChip</code> (<code>{ option, remove, index }</code>), so a consumer-authored chip template can be projected into either variant unchanged.',
  description: 'CngxCombobox — tag-input filter with live typeahead. Multi-value tag strip + free-text filtering, plus the same async/commit machinery as CngxSelect.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'a11y-pattern', 'composition'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxCombobox',
    'CngxComboboxChip',
    'CngxComboboxTriggerLabel',
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
    { value: 'old', label: 'Nicht mehr gepflegt', disabled: true },
  ];
  protected readonly comboValues = signal<string[]>(['angular']);`,
  template: `
  <cngx-combobox [label]="'Topics'" [options]="tagOptions" [(values)]="comboValues" placeholder="Choose tag…">
    <ng-template cngxComboboxChip let-opt let-remove="remove" let-i="index">
      <span style="display:inline-flex;align-items:center;gap:0.25rem;padding:0.15rem 0.5rem;border-radius:999px;background:color-mix(in oklch, var(--cngx-color-info) 15%, transparent);color:var(--cngx-color-info);font-size:0.8rem">
        <span aria-hidden="true">#{{ i + 1 }}</span>
        <strong>{{ opt.label }}</strong>
        <button type="button" (click)="remove()" aria-label="Remove" style="background:none;border:none;color:inherit;cursor:pointer;padding:0 2px">×</button>
      </span>
    </ng-template>
  </cngx-combobox>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Values</span><span class="event-value">{{ comboValues().join(', ') || '—' }}</span></div>
  </div>`,
};
