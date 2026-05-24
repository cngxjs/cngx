import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxCombobox: combobox text summary via cngxcomboboxtriggerlabel',
  subtitle: 'Replace the chip strip with a plain-text summary while keeping the filter input visible. Context exposes the resolved options, raw values, and count - ideal for compact variants ("3 topics selected" + input on the same row).',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxCombobox',
    'CngxComboboxTriggerLabel',
  ],
  moduleImports: [
    'import { CngxCombobox, CngxComboboxTriggerLabel, type CngxSelectOptionDef } from \'@cngx/forms/select\';',
  ],
  imports: ['CngxCombobox', 'CngxComboboxTriggerLabel'],
  setup: `protected readonly tagOptions: CngxSelectOptionDef<string>[] = [
    { value: 'angular', label: 'Angular' },
    { value: 'signals', label: 'Signals' },
    { value: 'rxjs', label: 'RxJS' },
    { value: 'a11y', label: 'Accessibility' },
    { value: 'ts', label: 'TypeScript' },
    { value: 'old', label: 'Unmaintained', disabled: true },
  ];
  protected readonly comboTextValues = signal<string[]>(['angular', 'signals']);`,
  template: `  <cngx-combobox
    [label]="'Topics'"
    [options]="tagOptions"
    [(values)]="comboTextValues"
    placeholder="Search topics…"
  >
    <ng-template cngxComboboxTriggerLabel let-opts let-count="count">
      @if (count === 0) {
        <!-- Placeholder takes over when empty -->
      } @else if (count === 1) {
        <span style="padding-inline-end:0.5rem">{{ opts[0].label }}</span>
      } @else {
        <span class="demo-combobox-trigger-summary">{{ count }} topics</span>
      }
    </ng-template>
  </cngx-combobox>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Values</span><span class="event-value">{{ comboTextValues().join(', ') || '—' }}</span></div>
    <div class="event-row"><span class="event-label">Count</span><span class="event-value">{{ comboTextValues().length }}</span></div>
  </div>`,
};
