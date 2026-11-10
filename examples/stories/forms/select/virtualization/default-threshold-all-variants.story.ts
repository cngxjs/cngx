import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Select family: 1000 options at the default threshold',
  subtitle:
    'No <code>withVirtualization</code> here. Every flat host holds 1000 options and windows them on its own, because the default config virtualizes from 200 options up. <code>CngxSelectShell</code> is the exception: its options are projected, so all of them stay in the DOM and it behaves as a plain list.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['behavior', 'a11y-pattern'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxSelect',
    'CngxMultiSelect',
    'CngxCombobox',
    'CngxTypeahead',
    'CngxReorderableMultiSelect',
    'CngxActionSelect',
    'CngxActionMultiSelect',
    'CngxSelectShell',
  ],
  moduleImports: [
    "import { CngxSelect, CngxMultiSelect, CngxCombobox, CngxTypeahead, CngxReorderableMultiSelect, CngxActionSelect, CngxActionMultiSelect, CngxSelectShell, CngxSelectOption, type CngxSelectOptionDef } from '@cngx/forms/select';",
  ],
  imports: [
    'CngxSelect',
    'CngxMultiSelect',
    'CngxCombobox',
    'CngxTypeahead',
    'CngxReorderableMultiSelect',
    'CngxActionSelect',
    'CngxActionMultiSelect',
    'CngxSelectShell',
    'CngxSelectOption',
  ],
  setup: `protected readonly options: CngxSelectOptionDef<number>[] = Array.from(
    { length: 1000 },
    (_, i) => ({ value: i, label: i === 800 ? 'Zebra 800' : 'Item ' + i }),
  );
  protected readonly selectValue = signal<number | undefined>(undefined);
  protected readonly multiValues = signal<number[]>([]);
  protected readonly comboValues = signal<number[]>([]);
  protected readonly typeaheadValue = signal<number | undefined>(undefined);
  protected readonly reorderValues = signal<number[]>([]);
  protected readonly actionValue = signal<number | undefined>(undefined);
  protected readonly actionMultiValues = signal<number[]>([]);
  protected readonly shellValue = signal<number | undefined>(undefined);`,
  template: `  <section aria-label="CngxSelect" style="margin-block-end:16px">
    <cngx-select [label]="'Select'" [options]="options" [(value)]="selectValue" />
  </section>
  <section aria-label="CngxMultiSelect" style="margin-block-end:16px">
    <cngx-multi-select [label]="'Multi select'" [options]="options" [(values)]="multiValues" />
  </section>
  <section aria-label="CngxCombobox" style="margin-block-end:16px">
    <cngx-combobox [label]="'Combobox'" [options]="options" [(values)]="comboValues" />
  </section>
  <section aria-label="CngxTypeahead" style="margin-block-end:16px">
    <cngx-typeahead [label]="'Typeahead'" [options]="options" [(value)]="typeaheadValue" />
  </section>
  <section aria-label="CngxReorderableMultiSelect" style="margin-block-end:16px">
    <cngx-reorderable-multi-select [label]="'Reorderable'" [options]="options" [(values)]="reorderValues" />
  </section>
  <section aria-label="CngxActionSelect" style="margin-block-end:16px">
    <cngx-action-select [label]="'Action select'" [options]="options" [(value)]="actionValue" />
  </section>
  <section aria-label="CngxActionMultiSelect" style="margin-block-end:16px">
    <cngx-action-multi-select [label]="'Action multi select'" [options]="options" [(values)]="actionMultiValues" />
  </section>
  <section aria-label="CngxSelectShell">
    <cngx-select-shell [label]="'Shell'" [(value)]="shellValue">
      @for (option of options; track option.value) {
        <cngx-option [value]="option.value">{{ option.label }}</cngx-option>
      }
    </cngx-select-shell>
  </section>`,
};
