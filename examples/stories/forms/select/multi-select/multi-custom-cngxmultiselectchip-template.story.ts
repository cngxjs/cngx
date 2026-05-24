import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxMultiSelect: multi custom cngxmultiselectchip template',
  subtitle: 'Replace the default <code>&lt;cngx-chip&gt;</code> pill per instance with any content. The template context gives you the full option plus a commit-aware <code>remove</code> callback.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxMultiSelect',
    'CngxMultiSelectChip',
  ],
  moduleImports: [
    'import { CngxMultiSelect, CngxMultiSelectChip, type CngxSelectOptionDef } from \'@cngx/forms/select\';',
  ],
  imports: ['CngxMultiSelect', 'CngxMultiSelectChip'],
  setup: `protected readonly tagOptions: CngxSelectOptionDef<string>[] = [
    { value: 'angular', label: 'Angular' },
    { value: 'signals', label: 'Signals' },
    { value: 'rxjs', label: 'RxJS' },
    { value: 'a11y', label: 'Accessibility' },
    { value: 'ts', label: 'TypeScript' },
    { value: 'old', label: 'Unmaintained', disabled: true },
  ];
  protected readonly multiCustomChipValues = signal<string[]>(['angular', 'signals', 'rxjs']);`,
  template: `  <cngx-multi-select
    [label]="'Topics'"
    [options]="tagOptions"
    [(values)]="multiCustomChipValues"
    placeholder="Choose topics…"
  >
    <ng-template cngxMultiSelectChip let-opt let-remove="remove">
      <span class="demo-multi-chip">
        <span>#{{ opt.label }}</span>
        <button type="button" (click)="remove()" class="demo-multi-chip-remove" aria-label="Remove topic">✕</button>
      </span>
    </ng-template>
  </cngx-multi-select>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Values</span><span class="event-value">{{ multiCustomChipValues().join(', ') || '—' }}</span></div>
  </div>`,
};
