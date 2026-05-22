import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Multi-select',
  subtitle: 'Toggle each option on Enter/Space or click. <code>aria-multiselectable="true"</code> is set automatically. <code>isAllSelected</code> derives from options.',
  description: 'Composite listbox primitive with single/multi selection, keyboard navigation, and signal-first ARIA state.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern'],
  apiComponents: [
    'CngxListbox',
    'CngxOption',
  ],
  moduleImports: [
    'import { CngxListbox, CngxOption } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxListbox', 'CngxOption'],
  setup: `protected readonly multiValues = signal<string[]>([]);`,
  template: `  <div cngxListbox
       [label]="'Fruits (multi)'"
       [multiple]="true"
       tabindex="0"
       class="ad-listbox"
       (selectedValuesChange)="multiValues.set($any($event))"
       #lbMulti="cngxListbox">
    <div cngxOption value="apple">Apple</div>
    <div cngxOption value="banana">Banana</div>
    <div cngxOption value="cherry">Cherry</div>
    <div cngxOption value="date">Date</div>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Selection</span>
      <span class="event-value">{{ multiValues().length ? multiValues().join(', ') : '—' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">All selected</span>
      <span class="event-value">{{ lbMulti.isAllSelected() ? 'yes' : 'no' }}</span>
    </div>
    <div class="event-row" style="margin-top:8px">
      <button type="button" class="chip" (click)="lbMulti.selectAll()">Select all</button>
      <button type="button" class="chip" style="margin-left:4px" (click)="lbMulti.clear()">Clear</button>
    </div>
  </div>`,
};
