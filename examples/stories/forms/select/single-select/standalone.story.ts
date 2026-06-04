import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSelect: standalone',
  subtitle: 'Two-way bound via <code>[(value)]</code> - no form-field required.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxSelect',
  ],
  moduleImports: [
    'import { CngxSelect, type CngxSelectOptionDef } from \'@cngx/forms/select\';',
  ],
  imports: ['CngxSelect'],
  setup: `protected readonly colors: CngxSelectOptionDef<string>[] = [
    { value: 'red', label: 'Red' },
    { value: 'green', label: 'Green' },
    { value: 'blue', label: 'Blue' },
    { value: 'disabled', label: 'Unavailable', disabled: true },
  ];
  protected readonly standaloneValue = signal<string | undefined>(undefined);
  protected readonly openedLog = signal<string>('—');
  protected handleOpened(open: boolean): void {
    this.openedLog.set(open ? 'opened' : 'closed');
  }`,
  template: `  <cngx-select
    [label]="'Favorite color'"
    [options]="colors"
    [(value)]="standaloneValue"
    placeholder="Pick a color…"
    (openedChange)="handleOpened($event)"
  />`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ standaloneValue() || '—' }}</span></div>
    <div class="event-row"><span class="event-label">Last panel event</span><span class="event-value">{{ openedLog() }}</span></div>
  </div>`,
};
