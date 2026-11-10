import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Select family: open on a value far down 1000 options',
  subtitle:
    'The four button-led hosts open on their selected option, as a native <code>&lt;select&gt;</code> does, also when the list windows at the default threshold and the row is not rendered yet. The multi hosts open on the first selected option in list order.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['behavior', 'a11y-pattern'],
  framework: 'signal-forms',
  apiComponents: ['CngxSelect', 'CngxMultiSelect', 'CngxReorderableMultiSelect', 'CngxSelectShell'],
  moduleImports: [
    "import { CngxSelect, CngxMultiSelect, CngxReorderableMultiSelect, CngxSelectShell, CngxSelectOption, type CngxSelectOptionDef } from '@cngx/forms/select';",
  ],
  imports: [
    'CngxSelect',
    'CngxMultiSelect',
    'CngxReorderableMultiSelect',
    'CngxSelectShell',
    'CngxSelectOption',
  ],
  setup: `protected readonly options: CngxSelectOptionDef<number>[] = Array.from(
    { length: 1000 },
    (_, i) => ({ value: i, label: 'Item ' + i }),
  );
  protected readonly selectValue = signal<number | undefined>(900);
  protected readonly multiValues = signal<number[]>([950, 900]);
  protected readonly reorderValues = signal<number[]>([950, 900]);
  protected readonly shellValue = signal<number | undefined>(900);`,
  template: `  <section aria-label="CngxSelect" style="margin-block-end:16px">
    <cngx-select [label]="'Select'" [options]="options" [(value)]="selectValue" />
  </section>
  <section aria-label="CngxMultiSelect" style="margin-block-end:16px">
    <cngx-multi-select [label]="'Multi select'" [options]="options" [(values)]="multiValues" />
  </section>
  <section aria-label="CngxReorderableMultiSelect" style="margin-block-end:16px">
    <cngx-reorderable-multi-select [label]="'Reorderable'" [options]="options" [(values)]="reorderValues" />
  </section>
  <section aria-label="CngxSelectShell">
    <cngx-select-shell [label]="'Shell'" [(value)]="shellValue">
      @for (option of options; track option.value) {
        <cngx-option [value]="option.value">{{ option.label }}</cngx-option>
      }
    </cngx-select-shell>
  </section>`,
};
