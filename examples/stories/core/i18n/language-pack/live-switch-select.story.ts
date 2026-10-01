import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Language pack: live switch, select',
  subtitle:
    'Select-family copy follows one language <code>Signal</code>: flip EN / DE and the clear button and chip labels switch at once, while a shown selection announcement keeps its text until the next change.',
  description:
    'The <code>ariaLabels</code>, <code>fallbackLabels</code> and <code>announcer</code> keys of the select config are fed from computed signals through <code>viewProviders</code>. The copy inputs are left unbound, so each one follows the config; bind <code>[clearButtonAriaLabel]</code> or <code>[chipRemoveAriaLabel]</code> and it wins as before.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['a11y-pattern', 'composition'],
  apiComponents: ['CngxMultiSelect'],
  moduleImports: [
    "import { CngxMultiSelect, provideSelectConfigAt, withAnnouncer, withAriaLabels, withFallbackLabels, type CngxSelectOptionDef } from '@cngx/forms/select';",
    "import { DEMO_LANG, DEMO_SELECT_ANNOUNCER, DEMO_SELECT_ARIA_LABELS, DEMO_SELECT_FALLBACK_LABELS } from '../../../../fixtures';",
  ],
  imports: ['CngxMultiSelect'],
  viewProviders: [
    '...provideSelectConfigAt(withAriaLabels(DEMO_SELECT_ARIA_LABELS), withFallbackLabels(DEMO_SELECT_FALLBACK_LABELS), withAnnouncer(DEMO_SELECT_ANNOUNCER))',
  ],
  setup: `protected readonly colors: CngxSelectOptionDef<string>[] = [
    { value: 'red', label: 'Red' },
    { value: 'green', label: 'Green' },
    { value: 'blue', label: 'Blue' },
  ];
  protected readonly picked = signal<string[]>(['red', 'green', 'blue']);`,
  template: `
  <cngx-multi-select
    [label]="'Colors'"
    [options]="colors"
    [(values)]="picked"
    [clearable]="true"
  />`,
  setupChrome: `protected readonly lang = DEMO_LANG;`,
  templateChrome: `
  <div class="button-row" role="group" aria-label="Demo language">
    <button type="button" class="chip" [attr.aria-pressed]="lang() === 'en'" (click)="lang.set('en')">EN</button>
    <button type="button" class="chip" [attr.aria-pressed]="lang() === 'de'" (click)="lang.set('de')">DE</button>
  </div>`,
};
