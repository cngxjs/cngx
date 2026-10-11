import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxMultiSelect: multi chip overflow truncate',
  subtitle:
    '<code>chipOverflow="truncate"</code> keeps the trigger on one line: the first <code>[maxVisibleChips]</code> chips render, the rest collapse into a <code>+N</code> badge.',
  description:
    "The badge text is the <code>chipOverflowBadge</code> entry of the select language section (<code>+{count}</code> in English, the count in the locale's digits), so a language pack or <code>withFallbackLabels</code> changes it app-wide. The badge is <code>aria-hidden</code>: the selection is announced through the control, not the badge. Remove a chip and the next hidden option moves into view.",
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'behavior'],
  framework: 'programmatic',
  apiComponents: ['CngxMultiSelect'],
  moduleImports: [
    "import { CngxMultiSelect, type CngxSelectOptionDef } from '@cngx/forms/select';",
  ],
  imports: ['CngxMultiSelect'],
  setup: `protected readonly tagOptions: CngxSelectOptionDef<string>[] = [
  { value: 'angular', label: 'Angular' },
  { value: 'signals', label: 'Signals' },
  { value: 'rxjs', label: 'RxJS' },
  { value: 'a11y', label: 'Accessibility' },
  { value: 'ts', label: 'TypeScript' },
  { value: 'testing', label: 'Testing' },
];
protected readonly topics = signal<string[]>(['angular', 'signals', 'rxjs', 'a11y', 'ts']);`,
  template: `<cngx-multi-select
  [label]="'Topics'"
  [options]="tagOptions"
  [(values)]="topics"
  chipOverflow="truncate"
  [maxVisibleChips]="2"
  placeholder="Choose topics…"
/>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Selected</span><span class="event-value">{{ topics().length }}</span></div>
    <div class="event-row"><span class="event-label">Hidden</span><span class="event-value">{{ topics().length > 2 ? topics().length - 2 : 0 }}</span></div>
  </div>`,
};
