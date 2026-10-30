import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSelect: localised labels',
  subtitle:
    '<code>provideSelectConfigAt(withAriaLabels(...), withFallbackLabels(...))</code> replaces the select\'s built-in copy for one subtree. Here the clear button\'s accessible name and the empty-panel text are French; open the second select to see the empty message.',
  description:
    'Unset keys keep the active language pack, and the pack keeps English for what it leaves out. Pass a <code>Signal</code> to either feature to follow a runtime language switch without remounting. For an app-wide language use the language pack (<code>provideCngxI18n</code>); reach for these features to override single keys or to scope copy to one subtree. A per-instance input such as <code>[clearButtonAriaLabel]</code> still wins.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['integration', 'a11y-pattern'],
  framework: 'programmatic',
  apiComponents: ['CngxSelect'],
  moduleImports: [
    "import { CngxSelect, provideSelectConfigAt, withAriaLabels, withFallbackLabels, type CngxSelectOptionDef } from '@cngx/forms/select';",
  ],
  imports: ['CngxSelect'],
  viewProviders: [
    "...provideSelectConfigAt(withAriaLabels({ clearButton: 'Effacer la sélection' }), withFallbackLabels({ empty: 'Aucune option' }))",
  ],
  setup: `protected readonly colours: CngxSelectOptionDef<string>[] = [
  { value: 'red', label: 'Rouge' },
  { value: 'green', label: 'Vert' },
  { value: 'blue', label: 'Bleu' },
];
protected readonly colour = signal<string | undefined>('red');
protected readonly none = signal<string | undefined>(undefined);`,
  template: `<cngx-select
  [label]="'Couleur'"
  [options]="colours"
  [(value)]="colour"
  [clearable]="true"
/>
<cngx-select
  [label]="'Sans options'"
  [options]="[]"
  [(value)]="none"
/>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ colour() ?? '-' }}</span></div>
  </div>`,
};
