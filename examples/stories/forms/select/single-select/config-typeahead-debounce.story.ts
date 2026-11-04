import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSelect: closed-trigger typeahead buffer via withTypeaheadDebounce',
  subtitle:
    '<code>provideSelectConfigAt(withTypeaheadDebounce(800))</code> sets the closed-trigger typeahead buffer window for every button-trigger select in the subtree. Within the window consecutive keystrokes build one search term, so a multi-letter prefix jumps to a matching option; after the window the buffer resets. A per-instance <code>[typeaheadDebounceInterval]</code> still wins.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'behavior'],
  framework: 'template-only',
  apiComponents: ['CngxSelect'],
  moduleImports: [
    "import { CngxSelect, provideSelectConfigAt, withTypeaheadDebounce, type CngxSelectOptionDef } from '@cngx/forms/select';",
  ],
  imports: ['CngxSelect'],
  viewProviders: ['...provideSelectConfigAt(withTypeaheadDebounce(800))'],
  setup: `protected readonly fruits: CngxSelectOptionDef<string>[] = [
    { value: 'apricot', label: 'Apricot' },
    { value: 'blackberry', label: 'Blackberry' },
    { value: 'blueberry', label: 'Blueberry' },
    { value: 'cranberry', label: 'Cranberry' },
  ];
  protected readonly fruit = signal<string | undefined>(undefined);`,
  templateChromeBefore: `<p class="demo-hint">Keep the panel closed, focus the field, then type "blu" steadily within 0.8s - the longer buffer lets the three letters jump straight to Blueberry instead of stopping at Blackberry.</p>`,
  template: `<cngx-select
  [label]="'Fruit'"
  [options]="fruits"
  [(value)]="fruit"
  placeholder="Focus and type…"
/>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ fruit() ?? '-' }}</span></div>
  </div>`,
};
