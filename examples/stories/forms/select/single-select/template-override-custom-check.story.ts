import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSelect: template override custom check',
  subtitle: 'Project <code>*cngxSelectCheck</code> to replace the ✓ glyph shown on the selected row. Context: <code>let-option</code>, <code>let-selected="selected"</code>.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxSelect',
    'CngxSelectCheck',
  ],
  moduleImports: [
    'import { CngxSelect, CngxSelectCheck, type CngxSelectOptionDef } from \'@cngx/forms/select\';',
  ],
  imports: ['CngxSelect', 'CngxSelectCheck'],
  setup: `protected readonly colors: CngxSelectOptionDef<string>[] = [
    { value: 'red', label: 'Red' },
    { value: 'green', label: 'Green' },
    { value: 'blue', label: 'Blue' },
    { value: 'disabled', label: 'Unavailable', disabled: true },
  ];
  protected readonly standaloneValue = signal<string | undefined>(undefined);`,
  template: `
  <cngx-select
    [label]="'Color'"
    [options]="colors"
    [(value)]="standaloneValue"
    placeholder="Pick a color…"
  >
    <ng-template cngxSelectCheck let-option let-selected="selected">
      @if (selected) {
        <span class="demo-success-dot" aria-hidden="true">●</span>
      }
    </ng-template>
  </cngx-select>`,
};
