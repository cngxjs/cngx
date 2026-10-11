import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxCombobox: combobox app wide search match fn',
  subtitle:
    '<code>withSearchMatchFn</code> sets the inline search matcher for every searchable select variant under one provider. Here it matches from the start of the label: type <code>an</code> and Vanilla JS drops out.',
  description:
    "A <code>CngxSelectMatchFn</code> receives the option's <code>value</code> and <code>label</code> plus the term, so one function serves <code>CngxCombobox</code>, <code>CngxTypeahead</code>, <code>CngxActionSelect</code>, <code>CngxActionMultiSelect</code> and <code>CngxSelectShell</code>. A per-instance <code>[searchMatchFn]</code> wins; without either, the variants keep the folded label match in the reading locale. <code>provideSelectConfigAt</code> scopes it to this subtree; <code>provideSelectConfig</code> sets it app-wide.",
  level: 'organism',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['behavior', 'integration'],
  framework: 'programmatic',
  apiComponents: ['CngxCombobox'],
  moduleImports: [
    "import { CngxCombobox, provideSelectConfigAt, withSearchMatchFn, type CngxSelectOptionDef } from '@cngx/forms/select';",
  ],
  imports: ['CngxCombobox'],
  viewProviders: [
    '...provideSelectConfigAt(withSearchMatchFn((option, term) => option.label.toLowerCase().startsWith(term.toLowerCase())))',
  ],
  setup: `protected readonly frameworks: CngxSelectOptionDef<string>[] = [
  { value: 'angular', label: 'Angular' },
  { value: 'ant', label: 'Ant Design' },
  { value: 'vanilla', label: 'Vanilla JS' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'solid', label: 'Solid' },
  { value: 'lit', label: 'Lit' },
];
protected readonly picked = signal<string[]>([]);`,
  template: `<cngx-combobox
  [label]="'Frameworks'"
  [options]="frameworks"
  [(values)]="picked"
  placeholder="Search frameworks…"
/>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Values</span><span class="event-value">{{ picked().join(', ') || '-' }}</span></div>
  </div>`,
};
