import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxCombobox: combobox chip overflow slot',
  subtitle:
    '<code>*cngxSelectChipOverflow</code> replaces the <code>+N</code> badge of the combobox when <code>chipOverflow="truncate"</code> hides chips. The custom badge below lists the hidden topics next to the count.',
  description:
    'The context carries <code>count</code>, the translated badge <code>label</code> and the <code>hidden</code> options. The badge renders only while selections are hidden and no <code>*cngxComboboxTriggerLabel</code> replaces the strip. Keep it <code>aria-hidden</code>: the whole selection is read through the combobox, and the search input stays the only tab stop after the visible chips.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition'],
  framework: 'programmatic',
  apiComponents: ['CngxCombobox', 'CngxSelectChipOverflow'],
  moduleImports: [
    "import { CngxCombobox, CngxSelectChipOverflow, type CngxSelectOptionDef } from '@cngx/forms/select';",
  ],
  imports: ['CngxCombobox', 'CngxSelectChipOverflow'],
  setup: `protected readonly tagOptions: CngxSelectOptionDef<string>[] = [
  { value: 'angular', label: 'Angular' },
  { value: 'signals', label: 'Signals' },
  { value: 'rxjs', label: 'RxJS' },
  { value: 'a11y', label: 'Accessibility' },
  { value: 'ts', label: 'TypeScript' },
];
protected readonly topics = signal<string[]>(['angular', 'signals', 'rxjs', 'a11y']);

protected labelsOf(options: readonly { label: string }[]): string {
  return options.map((option) => option.label).join(', ');
}`,
  template: `<cngx-combobox
  [label]="'Topics'"
  [options]="tagOptions"
  [(values)]="topics"
  chipOverflow="truncate"
  [maxVisibleChips]="1"
  placeholder="Search topics…"
>
  <ng-template cngxSelectChipOverflow let-label="label" let-hidden="hidden">
    <span aria-hidden="true">{{ label }} ({{ labelsOf(hidden) }})</span>
  </ng-template>
</cngx-combobox>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Values</span><span class="event-value">{{ topics().join(', ') || '-' }}</span></div>
  </div>`,
};
