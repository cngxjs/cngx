import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Assemble it yourself — atoms + element components',
  subtitle:
    "Composing <code>&lt;cngx-option&gt;</code> / <code>&lt;cngx-optgroup&gt;</code> / <code>&lt;cngx-select-divider&gt;</code> directly inside <code>&lt;cngx-select&gt;</code> <strong>does not work</strong> — content-projection scoping puts the projected children in <code>cngx-select</code>'s injector tree, not the inner listbox's, so <code>CngxActiveDescendant</code> registration fails and the panel opens empty. They <strong>do work</strong> when you compose the listbox yourself using the Level-2 atoms (<code>CngxPopover</code> + <code>CngxListboxTrigger</code> + <code>CngxListbox</code>), because the options sit inside the listbox's own content-children scope.",
  description:
    'CngxSelect — native-feeling single-select dropdown with template overrides, optgroups, clearable, loading, commit-action, and signal-/reactive-forms bridges.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxSelect',
    'CngxSelectOption',
    'CngxSelectOptgroup',
    'CngxSelectDivider',
    'CngxSelectCheck',
    'CngxSelectCaret',
    'CngxSelectOptgroupTemplate',
    'CngxSelectPlaceholder',
    'CngxSelectEmpty',
    'CngxSelectLoading',
    'CngxSelectLoadingGlyph',
    'CngxSelectRefreshing',
    'CngxSelectCommitError',
    'CngxSelectOptionPending',
    'CngxSelectOptionError',
    'CngxSelectRetryButton',
    'CngxSelectTriggerLabel',
    'CngxSelectOptionLabel',
    'CngxSelectClearButton',
    'provideSelectConfig',
  ],
  moduleImports: [
    "import { CngxSelectOption, CngxSelectOptgroup, CngxSelectDivider } from '@cngx/forms/select';",
    "import { CngxListbox, CngxListboxTrigger } from '@cngx/common/interactive';",
    "import { CngxPopover, CngxPopoverTrigger } from '@cngx/common/popover';",
  ],
  imports: [
    'CngxSelectOption',
    'CngxSelectOptgroup',
    'CngxSelectDivider',
    'CngxListbox',
    'CngxListboxTrigger',
    'CngxPopover',
    'CngxPopoverTrigger',
  ],
  setup: `protected readonly assembledValue = signal<string | undefined>(undefined);`,
  template: `
  <button type="button"
          class="chip"
          [cngxPopoverTrigger]="myPop"
          [haspopup]="'listbox'"
          [cngxListboxTrigger]="myLb"
          [popover]="myPop"
          (click)="myPop.toggle()">
    {{ assembledValue() ?? 'Pick a color…' }} ▾
  </button>
  <div cngxPopover #myPop="cngxPopover" placement="bottom" style="padding:0.25rem">
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
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ assembledValue() ?? '—' }}</span></div>
    <div class="event-row"><span class="event-label">Status</span><span class="event-value" style="color:var(--cngx-color-success)">Works — consumer owns the listbox, AD sees projected options.</span></div>
  </div>`,
};
