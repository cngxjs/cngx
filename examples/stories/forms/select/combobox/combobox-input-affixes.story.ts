import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxCombobox: combobox input affixes',
  subtitle:
    'Project <code>*cngxSelectInputPrefix</code> and <code>*cngxSelectInputSuffix</code> around the combobox search input. The suffix reads <code>{ disabled, focused, panelOpen }</code> from its context and shows the flags while you focus, type and close.',
  description:
    'Both slots sit inside the trigger next to the search input: the prefix before it, the suffix after it and before the clear button and caret. A click on either does not open the panel. The affixes are not part of the input\'s accessible name, so mark glyphs <code>aria-hidden</code>. Without the templates nothing renders in either position.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  framework: 'template-only',
  apiComponents: ['CngxCombobox', 'CngxSelectInputPrefix', 'CngxSelectInputSuffix'],
  moduleImports: [
    "import { CngxCombobox, CngxSelectInputPrefix, CngxSelectInputSuffix, type CngxSelectOptionDef } from '@cngx/forms/select';",
  ],
  imports: ['CngxCombobox', 'CngxSelectInputPrefix', 'CngxSelectInputSuffix'],
  setup: `protected readonly tagOptions: CngxSelectOptionDef<string>[] = [
  { value: 'angular', label: 'Angular' },
  { value: 'signals', label: 'Signals' },
  { value: 'rxjs', label: 'RxJS' },
  { value: 'a11y', label: 'Accessibility' },
];
protected readonly topics = signal<string[]>(['angular']);`,
  template: `<cngx-combobox
  [label]="'Topics'"
  [options]="tagOptions"
  [(values)]="topics"
  placeholder="Search topics"
>
  <ng-template cngxSelectInputPrefix>
    <span aria-hidden="true">#</span>
  </ng-template>
  <ng-template cngxSelectInputSuffix let-focused="focused" let-panelOpen="panelOpen">
    <small aria-hidden="true">{{ focused ? 'focused' : 'idle' }} / {{ panelOpen ? 'open' : 'closed' }}</small>
  </ng-template>
</cngx-combobox>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Values</span><span class="event-value">{{ topics().join(', ') || '-' }}</span></div>
  </div>`,
};
