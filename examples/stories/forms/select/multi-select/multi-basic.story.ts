import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxMultiSelect: multi basic',
  subtitle: '<code>&lt;cngx-multi-select&gt;</code> with <code>[(values)]</code>. Panel stays open on each toggle (native <code>&lt;select multiple&gt;</code> parity). Disabled options don\'t toggle. Typing while the panel is closed toggles the first matching option.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxMultiSelect',
  ],
  moduleImports: [
    'import { CngxMultiSelect, type CngxSelectOptionDef } from \'@cngx/forms/select\';',
  ],
  imports: ['CngxMultiSelect'],
  setup: `protected readonly tagOptions: CngxSelectOptionDef<string>[] = [
    { value: 'angular', label: 'Angular' },
    { value: 'signals', label: 'Signals' },
    { value: 'rxjs', label: 'RxJS' },
    { value: 'a11y', label: 'Accessibility' },
    { value: 'ts', label: 'TypeScript' },
    { value: 'old', label: 'Unmaintained', disabled: true },
  ];
  protected readonly multiValues = signal<string[]>(['angular', 'signals']);`,
  template: `  <cngx-multi-select
    [label]="'Topics'"
    [options]="tagOptions"
    [(values)]="multiValues"
    placeholder="Choose topics…"
  />`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Values</span><span class="event-value">{{ multiValues().join(', ') || '—' }}</span></div>
    <div class="event-row"><span class="event-label">Count</span><span class="event-value">{{ multiValues().length }}</span></div>
  </div>`,
};
