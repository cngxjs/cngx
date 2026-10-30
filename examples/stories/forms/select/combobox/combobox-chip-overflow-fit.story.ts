import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxCombobox: combobox chip overflow fit',
  subtitle:
    'A combobox capped at <code>max-width: 300px</code> with <code>chipOverflow="fit"</code>: the trigger stays one row, the chips that fit next to the input show, the rest fold into the <code>+N</code> badge.',
  description:
    'Under <code>\'wrap\'</code> the same combobox grows a second row, and under <code>\'truncate\'</code> the right <code>[maxVisibleChips]</code> depends on the label lengths. <code>\'fit\'</code> measures the strip instead. The input keeps its own minimum width; the hidden chips are out of the tab order and the whole selection reaches AT as the input description.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'behavior'],
  framework: 'programmatic',
  apiComponents: ['CngxCombobox'],
  moduleImports: ["import { CngxCombobox, type CngxSelectOptionDef } from '@cngx/forms/select';"],
  imports: ['CngxCombobox'],
  setup: `protected readonly tagOptions: CngxSelectOptionDef<string>[] = [
  { value: 'angular', label: 'Angular' },
  { value: 'signals', label: 'Signals' },
  { value: 'rxjs', label: 'RxJS' },
  { value: 'a11y', label: 'Accessibility' },
  { value: 'ts', label: 'TypeScript' },
  { value: 'testing', label: 'Testing' },
];
protected readonly topics = signal<string[]>(['angular', 'signals', 'a11y', 'ts']);`,
  template: `<cngx-combobox
  [label]="'Topics'"
  [options]="tagOptions"
  [(values)]="topics"
  chipOverflow="fit"
  style="max-width: 300px"
  placeholder="Search topics…"
/>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Selected</span><span class="event-value">{{ topics().length }}</span></div>
  </div>`,
};
