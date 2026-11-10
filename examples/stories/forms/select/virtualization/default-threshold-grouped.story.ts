import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSelect: a grouped list at the default threshold',
  subtitle:
    'Windowing across group boundaries is ambiguous, so a grouped list renders every option even at 500. Without a virtualization config this is simply how it works and nothing is logged. CNGX2028 only fires when <code>withVirtualization</code> was asked for.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['behavior'],
  framework: 'signal-forms',
  apiComponents: ['CngxSelect'],
  moduleImports: [
    "import { CngxSelect, type CngxSelectOptionGroupDef } from '@cngx/forms/select';",
  ],
  imports: ['CngxSelect'],
  setup: `protected readonly groups: CngxSelectOptionGroupDef<number>[] = Array.from(
    { length: 10 },
    (_, g) => ({
      label: 'Group ' + g,
      children: Array.from({ length: 50 }, (_, i) => ({
        value: g * 50 + i,
        label: 'Item ' + (g * 50 + i),
      })),
    }),
  );
  protected readonly value = signal<number | undefined>(undefined);`,
  template: `  <cngx-select [label]="'Grouped'" [options]="groups" [(value)]="value" />`,
};
