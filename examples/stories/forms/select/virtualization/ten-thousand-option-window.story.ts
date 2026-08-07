import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSelect: a virtualized 10,000-option window',
  subtitle:
    'One <code>provideSelectConfigAt(withVirtualization(...))</code> in <code>viewProviders</code> puts every select and combobox in the view on a recycled window - only a handful of <code>.cngx-select__option</code> rows exist in the DOM at once, yet <code>aria-setsize</code> reports the full 10,000 and each row keeps a valid <code>aria-posinset</code>. The same config drives the <code>CngxCombobox</code> and a short 20-item list unchanged.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['behavior', 'a11y-pattern'],
  framework: 'signal-forms',
  apiComponents: ['CngxSelect', 'CngxCombobox'],
  moduleImports: [
    "import { CngxSelect, CngxCombobox, provideSelectConfigAt, withVirtualization, type CngxSelectOptionDef } from '@cngx/forms/select';",
  ],
  imports: ['CngxSelect', 'CngxCombobox'],
  viewProviders: ['provideSelectConfigAt(withVirtualization({ estimateSize: 32, threshold: 1 }))'],
  setup: `protected readonly bigOptions: CngxSelectOptionDef<number>[] = Array.from(
    { length: 10000 },
    (_, i) => ({ value: i, label: 'Item #' + String(i).padStart(5, '0') }),
  );
  protected readonly smallOptions: CngxSelectOptionDef<number>[] = Array.from(
    { length: 20 },
    (_, i) => ({ value: i, label: 'Item #' + String(i).padStart(5, '0') }),
  );
  protected readonly selectValue = signal<number | undefined>(undefined);
  protected readonly comboValues = signal<number[]>([]);
  protected readonly smallValue = signal<number | undefined>(undefined);`,
  template: `  <section aria-label="10,000 options - CngxSelect" style="margin-block-end:24px">
    <cngx-select [label]="'Item'" [options]="bigOptions" [(value)]="selectValue" />
  </section>
  <section aria-label="Same wire-up on CngxCombobox" style="margin-block-end:24px">
    <cngx-combobox [label]="'Items'" [options]="bigOptions" [(values)]="comboValues" placeholder="Filter items…" />
  </section>
  <section aria-label="Same wrapper with only 20 options">
    <cngx-select [label]="'Short list'" [options]="smallOptions" [(value)]="smallValue" />
  </section>`,
};
