import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Rich-content option — plain-text trigger',
  subtitle: 'Markup inside <code>&lt;cngx-option&gt;</code> renders in the open panel only. The closed trigger reads <code>option.label()</code> (a <code>Signal&lt;string&gt;</code> with a textContent fallback) and renders it via <code>{{ ... }}</code> text interpolation — XSS-safe by construction.',
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
    'import { CngxSelectShell, CngxSelectOption } from \'@cngx/forms/select\';',
  ],
  imports: ['CngxSelectShell', 'CngxSelectOption'],
  setup: `protected readonly richValue = signal<string | undefined>(undefined);`,
  template: `
  <cngx-select-shell [label]="'Plan'" [clearable]="true" [(value)]="richValue">
    <cngx-option [value]="'p'"><b>Premium</b> Service</cngx-option>
    <cngx-option [value]="'b'">Basic</cngx-option>
    <cngx-option [value]="'f'">Free</cngx-option>
  </cngx-select-shell>

  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">value</span>
      <span class="event-value">{{ richValue() ?? '—' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">trigger renders</span>
      <span class="event-value">plain text only — no &lt;b&gt; in the closed trigger</span>
    </div>
  </div>`,
};
