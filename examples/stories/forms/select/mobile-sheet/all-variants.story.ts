import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Select family: mobile sheet, all nine variants',
  subtitle:
    'On a touch screen narrower than 48rem every select opens as a modal sheet; on a desktop the panels stay anchored. Force a presentation with the radio group to try the sheet on any screen.',
  description:
    'No flag to set: the sheet is on by default and follows the breakpoint in <code>cngx-popover-sheet.css</code>. Variants led by a text input (<code>CngxCombobox</code>, <code>CngxTypeahead</code>, <code>CngxActionSelect</code>, <code>CngxActionMultiSelect</code>, and <code>CngxSelectShell</code> with a <code>&lt;cngx-select-search&gt;</code>) open fullscreen with the input in the header; the rest open as a content-sized sheet. The header shows the field label as the dialog title, a close button and, on multi and input variants, Done. Focus moves into the sheet on open and back to the trigger on close; only the list scrolls.',
  level: 'organism',
  audience: ['dev', 'a11y', 'design'],
  artifact: 'standalone',
  focus: ['behavior', 'a11y-pattern', 'rtl'],
  apiComponents: [
    'CngxSelect',
    'CngxMultiSelect',
    'CngxCombobox',
    'CngxTypeahead',
    'CngxTreeSelect',
    'CngxReorderableMultiSelect',
    'CngxActionSelect',
    'CngxActionMultiSelect',
    'CngxSelectShell',
  ],
  moduleImports: [
    "import { CngxActionMultiSelect, CngxActionSelect, CngxCombobox, CngxMultiSelect, CngxReorderableMultiSelect, CngxSelect, CngxSelectOption, CngxSelectSearch, CngxSelectShell, CngxTreeSelect, CngxTypeahead, type CngxSelectOptionDef } from '@cngx/forms/select';",
  ],
  imports: [
    'CngxSelect',
    'CngxMultiSelect',
    'CngxCombobox',
    'CngxTypeahead',
    'CngxTreeSelect',
    'CngxReorderableMultiSelect',
    'CngxActionSelect',
    'CngxActionMultiSelect',
    'CngxSelectShell',
    'CngxSelectOption',
    'CngxSelectSearch',
  ],
  setup: `protected readonly cities: CngxSelectOptionDef<string>[] = [
    'Amsterdam', 'Athens', 'Barcelona', 'Berlin', 'Bratislava', 'Brussels',
    'Budapest', 'Copenhagen', 'Dublin', 'Helsinki', 'Lisbon', 'Ljubljana',
    'Madrid', 'Oslo', 'Paris', 'Prague', 'Rome', 'Stockholm', 'Vienna', 'Warsaw',
  ].map((name) => ({ value: name, label: name }));
  protected readonly regions = [
    { value: 'North', children: [{ value: 'Oslo' }, { value: 'Stockholm' }, { value: 'Helsinki' }] },
    { value: 'South', children: [{ value: 'Athens' }, { value: 'Lisbon' }, { value: 'Rome' }] },
  ];
  protected readonly nodeId = (value: string): string => value;`,
  template: `<div [attr.dir]="dir()" style="display: grid; gap: 16px; max-inline-size: 24rem">
    <cngx-select label="City" [options]="cities" [presentation]="presentation()" />
    <cngx-multi-select label="Cities" [options]="cities" [presentation]="presentation()" />
    <cngx-combobox label="Cities (combobox)" [options]="cities" [presentation]="presentation()" />
    <cngx-typeahead label="City (typeahead)" [options]="cities" [presentation]="presentation()" />
    <cngx-tree-select
      label="Region"
      [nodes]="regions"
      [nodeIdFn]="nodeId"
      [presentation]="presentation()"
    />
    <cngx-reorderable-multi-select
      label="Route"
      [options]="cities"
      [presentation]="presentation()"
    />
    <cngx-action-select label="City (action)" [options]="cities" [presentation]="presentation()" />
    <cngx-action-multi-select
      label="Cities (action)"
      [options]="cities"
      [presentation]="presentation()"
    />
    <cngx-select-shell label="City (shell)" [presentation]="presentation()">
      <cngx-select-search />
      @for (city of cities; track city.value) {
        <cngx-option [value]="city.value">{{ city.label }}</cngx-option>
      }
    </cngx-select-shell>
  </div>`,
  setupChrome: `protected readonly presentation = signal<'auto' | 'sheet' | 'fullscreen'>('auto');
  protected readonly dir = signal<'ltr' | 'rtl'>('ltr');`,
  templateChrome: `<div class="button-row" role="radiogroup" aria-label="Presentation">
    @for (mode of ['auto', 'sheet', 'fullscreen']; track mode) {
      <label>
        <input type="radio" name="select-sheet-presentation" [value]="mode"
          [checked]="presentation() === mode"
          (change)="presentation.set($any(mode))" />
        {{ mode }}
      </label>
    }
  </div>
  <div class="button-row" role="radiogroup" aria-label="Direction">
    <label>
      <input type="radio" name="select-sheet-dir" value="ltr" [checked]="dir() === 'ltr'" (change)="dir.set('ltr')" />
      LTR
    </label>
    <label>
      <input type="radio" name="select-sheet-dir" value="rtl" [checked]="dir() === 'rtl'" (change)="dir.set('rtl')" />
      RTL
    </label>
  </div>`,
};
