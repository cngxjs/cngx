import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSelect: slot override cngxselectplaceholder',
  subtitle: 'Replace the plain placeholder string with custom markup - render an icon + the placeholder text, a stylised hint, or a help link inside the trigger.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxSelect',
    'CngxSelectPlaceholder',
  ],
  moduleImports: [
    'import { CngxSelect, CngxSelectPlaceholder, type CngxSelectOptionDef } from \'@cngx/forms/select\';',
  ],
  imports: ['CngxSelect', 'CngxSelectPlaceholder'],
  setup: `protected readonly colors: CngxSelectOptionDef<string>[] = [
    { value: 'red', label: 'Red' },
    { value: 'green', label: 'Green' },
    { value: 'blue', label: 'Blue' },
    { value: 'disabled', label: 'Unavailable', disabled: true },
  ];
  protected readonly standaloneValue = signal<string | undefined>(undefined);`,
  template: `  <cngx-select [label]="'Color'" [options]="colors" [(value)]="standaloneValue" placeholder="Pick a color…">
    <ng-template cngxSelectPlaceholder let-text>
      <span class="demo-placeholder-muted">
        <span aria-hidden="true">🎨</span>
        <em>{{ text }}</em>
      </span>
    </ng-template>
  </cngx-select>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ standaloneValue() || '—' }}</span></div>
  </div>`,
};
