import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Custom glyphs — clearGlyph + caretGlyph',
  subtitle: 'Replace the built-in ✕ clear button glyph and ▾ caret with consumer-authored templates. The button frame, ARIA wiring, and click handlers stay intact — only the glyph swaps. <code>*cngxSelectClearButton</code> replaces the entire button when full control is needed.',
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
  setup: `protected readonly customValue = signal<string | undefined>(undefined);`,
  template: `  <ng-template #customClear>
    <span aria-hidden="true" style="font-weight:700; font-family:monospace">×</span>
  </ng-template>
  <ng-template #customCaret>
    <span aria-hidden="true" style="display:inline-block; transition: transform .15s">⌄</span>
  </ng-template>

  <cngx-select-shell
    [label]="'Color'"
    [clearable]="true"
    [clearGlyph]="customClear"
    [caretGlyph]="customCaret"
    [(value)]="customValue"
    placeholder="Custom-glyph trigger…"
  >
    <cngx-option [value]="'red'">Red</cngx-option>
    <cngx-option [value]="'green'">Green</cngx-option>
    <cngx-option [value]="'blue'">Blue</cngx-option>
  </cngx-select-shell>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">value</span>
      <span class="event-value">{{ customValue() ?? '—' }}</span>
    </div>
  </div>`,
};
