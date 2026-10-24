import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSelectOption: assemble it yourself with the listbox atoms',
  subtitle: 'For declarative children inside a select, use <code>&lt;cngx-select-shell&gt;</code>. This story shows the lower level: the consumer owns the listbox, so the projected options register with its active descendant directly.',
  description: 'The declarative <code>&lt;cngx-option&gt;</code> / <code>&lt;cngx-optgroup&gt;</code> / <code>&lt;cngx-select-divider&gt;</code> elements hosted in a listbox you compose from the Level-2 atoms: <code>CngxPopover</code> + <code>CngxListboxTrigger</code> + <code>CngxListbox</code>.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['composition'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxSelectOption',
    'CngxSelectOptgroup',
    'CngxSelectDivider',
    'CngxListbox',
    'CngxListboxTrigger',
  ],
  moduleImports: [
    'import { CngxSelectOption, CngxSelectOptgroup, CngxSelectDivider } from \'@cngx/forms/select\';',
    'import { CngxListbox, CngxListboxTrigger } from \'@cngx/common/interactive\';',
    'import { CngxPopover, CngxPopoverTrigger } from \'@cngx/common/popover\';',
  ],
  imports: ['CngxSelectOption', 'CngxSelectOptgroup', 'CngxSelectDivider', 'CngxListbox', 'CngxListboxTrigger', 'CngxPopover', 'CngxPopoverTrigger'],
  setup: `protected readonly assembledValue = signal<string | undefined>(undefined);`,
  template: `  <button type="button"
          class="chip"
          [cngxPopoverTrigger]="myPop"
          [haspopup]="'listbox'"
          [cngxListboxTrigger]="myLb"
          [popover]="myPop"
          (click)="myPop.toggle()">
    {{ assembledValue() ?? 'Pick a color…' }} ▾
  </button>
  <div cngxPopover #myPop="cngxPopover" placement="bottom" class="demo-popover-padding-sm">
    <div cngxListbox
         #myLb="cngxListbox"
         [label]="'Color'"
         [(value)]="assembledValue"
         style="display:flex;flex-direction:column;min-inline-size:10rem">
      <cngx-optgroup label="Warm">
        <cngx-option [value]="'red'">Red</cngx-option>
        <cngx-option [value]="'orange'">Orange</cngx-option>
      </cngx-optgroup>
      <cngx-select-divider />
      <cngx-optgroup label="Cold">
        <cngx-option [value]="'blue'">Blue</cngx-option>
        <cngx-option [value]="'teal'">Teal</cngx-option>
      </cngx-optgroup>
    </div>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ assembledValue() ?? '—' }}</span></div>
    <div class="event-row"><span class="event-label">Status</span><span class="event-value demo-success-event">Works - consumer owns the listbox, AD sees projected options.</span></div>
  </div>`,
};
