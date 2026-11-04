import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSelect: runtime language flip',
  subtitle:
    "A chrome toggle flips the demo between English and German at runtime. The visible copy is bound to <code>computed()</code> signals, and the select's own copy follows through <code>withAriaLabels</code> / <code>withFallbackLabels</code> fed <code>Signal</code> values, so the clear button's accessible name and the empty-panel text switch without remounting. The live region reads its copy untracked, so a flip never re-speaks the last selection.",
  description:
    'For an app-wide language use the language pack (<code>provideCngxI18n</code>). These config features scope copy to one subtree and, given a <code>Signal</code>, follow a runtime switch - the mechanism this demo leans on.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['integration', 'a11y-pattern'],
  framework: 'template-only',
  apiComponents: ['CngxSelect'],
  moduleImports: [
    "import { forwardRef } from '@angular/core';",
    "import { CNGX_SELECT_CONFIG, CngxSelect, makeSelectConfig, withAriaLabels, withFallbackLabels, type CngxSelectAriaLabels, type CngxSelectFallbackLabels, type CngxSelectOptionDef } from '@cngx/forms/select';",
  ],
  imports: ['CngxSelect'],
  viewProviders: [
    '{ provide: CNGX_SELECT_CONFIG, useFactory: (host: SingleSelectLanguageFlip) => makeSelectConfig(withAriaLabels(host.ariaLabels), withFallbackLabels(host.fallbackLabels)), deps: [forwardRef(() => SingleSelectLanguageFlip)] }',
  ],
  setup: `protected readonly colors: CngxSelectOptionDef<string>[] = [
    { value: 'red', label: 'Red' },
    { value: 'green', label: 'Green' },
    { value: 'blue', label: 'Blue' },
  ];
  protected readonly lang = signal<'en' | 'de'>('en');
  protected readonly labelText = computed(() => (this.lang() === 'de' ? 'Farbe' : 'Colour'));
  protected readonly placeholderText = computed(() => (this.lang() === 'de' ? 'Farbe wählen…' : 'Pick a colour…'));
  readonly ariaLabels = computed<CngxSelectAriaLabels>(() =>
    this.lang() === 'de' ? { clearButton: 'Auswahl löschen' } : { clearButton: 'Clear selection' },
  );
  readonly fallbackLabels = computed<CngxSelectFallbackLabels>(() =>
    this.lang() === 'de' ? { empty: 'Keine Optionen' } : { empty: 'No options' },
  );
  protected readonly colour = signal<string | undefined>('red');
  protected readonly none = signal<string | undefined>(undefined);`,
  template: `<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:1rem">
  <cngx-select
    [label]="labelText()"
    [options]="colors"
    [(value)]="colour"
    [placeholder]="placeholderText()"
    [clearable]="true"
  />
  <cngx-select
    [label]="labelText()"
    [options]="[]"
    [(value)]="none"
    [placeholder]="placeholderText()"
  />
</div>`,
  templateChrome: `<div class="button-row" style="margin-top:12px">
    <button type="button" class="chip" data-lang="en" [attr.aria-pressed]="lang() === 'en'" (click)="lang.set('en')">English</button>
    <button type="button" class="chip" data-lang="de" [attr.aria-pressed]="lang() === 'de'" (click)="lang.set('de')">Deutsch</button>
  </div>
  <div class="event-grid" style="margin-top:8px">
    <div class="event-row"><span class="event-label">Language</span><span class="event-value">{{ lang() }}</span></div>
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ colour() ?? '-' }}</span></div>
  </div>`,
};
