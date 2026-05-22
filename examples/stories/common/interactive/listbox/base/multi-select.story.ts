import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxListbox: multi-select',
  subtitle:
    'multiple=true flips aria-multiselectable to "true" and toggles each option on activation. isAllSelected, selectAll, and clear are derived signals/methods on the listbox itself.',
  description:
    'Multi-value listbox: the selectedValues model holds the array, aria-selected mirrors per-option membership, and isAllSelected ignores disabled options so the readout stays honest.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern'],
  references: [
    {
      label: 'WAI-ARIA APG: Listbox (multi-select)',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/listbox/examples/listbox-rearrangeable/',
    },
    {
      label: 'WCAG 2.1.1 Keyboard',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard',
    },
    {
      label: 'WCAG 4.1.2 Name, Role, Value',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value',
    },
  ],
  apiComponents: ['CngxListbox', 'CngxOption'],
  moduleImports: [
    "import { CngxListbox, CngxOption } from '@cngx/common/interactive';",
  ],
  imports: ['CngxListbox', 'CngxOption'],
  setup: `protected readonly multiValues = signal<string[]>([]);`,
  template: `  <div cngxListbox
       [label]="'Fruits (multi)'"
       [multiple]="true"
       tabindex="0"
       class="demo-listbox-surface"
       (selectedValuesChange)="multiValues.set($any($event))"
       #lbMulti="cngxListbox">
    <div cngxOption value="apple">Apple</div>
    <div cngxOption value="banana">Banana</div>
    <div cngxOption value="cherry">Cherry</div>
    <div cngxOption value="date">Date</div>
  </div>`,
  templateChrome: `<div class="event-grid">
    <div class="event-row">
      <span class="event-label">Selection</span>
      <span class="event-value">{{ multiValues().length ? multiValues().join(', ') : '-' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">All selected</span>
      <span class="event-value">{{ lbMulti.isAllSelected() ? 'yes' : 'no' }}</span>
    </div>
    <div class="button-row">
      <button type="button" class="chip" (click)="lbMulti.selectAll()">Select all</button>
      <button type="button" class="chip" (click)="lbMulti.clear()">Clear</button>
    </div>
  </div>`,
};
