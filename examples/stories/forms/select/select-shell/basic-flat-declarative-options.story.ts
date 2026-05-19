import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Basic — flat declarative options',
  subtitle: 'Project <code>&lt;cngx-option&gt;</code> children directly. The shell builds the option model via <code>contentChildren(CNGX_OPTION_CONTAINER)</code> and feeds the result into the inner <code>cngxListbox</code>. Click + hover delegated by the shell so projected options are interactive end-to-end.',
  description: 'CngxSelectShell — single-value declarative-options dropdown. Project user-authored <cngx-option> / <cngx-optgroup> children directly; the shell derives a hierarchy-aware option model and runs the same family-level intelligence (createSelectCore, createFieldSync, createScalarCommitHandler, announcer) as CngxSelect.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxSelectShell',
    'CngxSelectOption',
    'CngxSelectOptgroup',
    'CngxSelectDivider',
  ],
  moduleImports: [
    'import { CngxSelectShell, CngxSelectOption, type CngxSelectShellChange } from \'@cngx/forms/select\';',
  ],
  imports: ['CngxSelectShell', 'CngxSelectOption'],
  setup: `protected readonly basicValue = signal<string | undefined>(undefined);
  protected readonly basicLog = signal<string | null>(null);
  protected handleBasicChange(e: CngxSelectShellChange<string>): void {
    this.basicLog.set(
      new Date().toLocaleTimeString() + ' → ' + (e.option?.label ?? '—'),
    );
  }`,
  template: `
  <cngx-select-shell
    [label]="'Color'"
    [clearable]="true"
    [(value)]="basicValue"
    (selectionChange)="handleBasicChange($event)"
    placeholder="Choose…"
  >
    <cngx-option [value]="'red'">Red</cngx-option>
    <cngx-option [value]="'green'">Green</cngx-option>
    <cngx-option [value]="'blue'">Blue</cngx-option>
    <cngx-option [value]="'disabled'" [disabled]="true">Unavailable</cngx-option>
  </cngx-select-shell>

  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">value</span>
      <span class="event-value">{{ basicValue() ?? '—' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">last selectionChange</span>
      <span class="event-value">{{ basicLog() ?? '—' }}</span>
    </div>
  </div>`,
};
