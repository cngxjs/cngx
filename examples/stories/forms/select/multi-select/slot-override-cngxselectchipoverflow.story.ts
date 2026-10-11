import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxMultiSelect: slot override cngxselectchipoverflow',
  subtitle:
    '<code>*cngxSelectChipOverflow</code> replaces the <code>+N</code> badge of <code>chipOverflow="truncate"</code>. The context carries <code>count</code>, the resolved <code>label</code> and the <code>hidden</code> options.',
  description:
    'The slot renders only while selections are hidden and no trigger-label slot replaces the chip strip. <code>label</code> is the badge text from the language pack, so a custom badge can keep the translated copy and add the hidden option labels next to it. Keep the badge <code>aria-hidden</code> unless it adds its own interaction; the selection is announced through the control. The same slot works on <code>CngxCombobox</code> and <code>CngxActionMultiSelect</code>.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition'],
  framework: 'programmatic',
  apiComponents: ['CngxMultiSelect', 'CngxSelectChipOverflow'],
  moduleImports: [
    "import { CngxMultiSelect, CngxSelectChipOverflow, type CngxSelectOptionDef } from '@cngx/forms/select';",
  ],
  imports: ['CngxMultiSelect', 'CngxSelectChipOverflow'],
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
  template: `<cngx-multi-select
  [label]="'Topics'"
  [options]="tagOptions"
  [(values)]="topics"
  chipOverflow="truncate"
  [maxVisibleChips]="1"
>
  <ng-template cngxSelectChipOverflow let-label="label" let-hidden="hidden">
    <span aria-hidden="true">{{ label }} ({{ labelsOf(hidden) }})</span>
  </ng-template>
</cngx-multi-select>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Values</span><span class="event-value">{{ topics().join(', ') || '-' }}</span></div>
  </div>`,
};
