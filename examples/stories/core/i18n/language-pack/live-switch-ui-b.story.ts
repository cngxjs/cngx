import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Language pack: live switch, accordion and breadcrumb',
  subtitle:
    'Accordion and breadcrumb copy follow one language <code>Signal</code>: flip EN / DE and the trail landmark and the disabled reason switch at once, while a shown section error keeps its text until the next failure.',
  description:
    'The accordion labels and the breadcrumb accessible names are fed from computed signals through <code>viewProviders</code>. The failed section announces its error through a <code>role="alert"</code>, so a language flip does not re-voice it; recover the section and fail it again and the alert speaks German. The breadcrumb landmark name and the disabled section reason are not live regions and switch immediately.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['a11y-pattern', 'composition'],
  apiComponents: ['CngxAccordionGroup', 'CngxAccordionItem', 'CngxBreadcrumbBar'],
  moduleImports: [
    "import { CngxAccordionGroup, CngxAccordionItem, CngxAccordionItemTitle, provideAccordionConfigAt, withAccordionLabels } from '@cngx/ui/accordion';",
    "import { CngxBreadcrumbBar, provideBreadcrumbConfigAt, withBreadcrumbAriaLabels, type CngxBreadcrumbCrumb } from '@cngx/ui/breadcrumb';",
    "import { DEMO_ACCORDION_DISABLED_REASON, DEMO_ACCORDION_ERROR_MESSAGE, DEMO_BREADCRUMB_ARIA_LABELS, DEMO_LANG } from '../../../../fixtures';",
  ],
  imports: ['CngxBreadcrumbBar', 'CngxAccordionGroup', 'CngxAccordionItem', 'CngxAccordionItemTitle'],
  viewProviders: [
    '...provideAccordionConfigAt(withAccordionLabels({ disabledReason: DEMO_ACCORDION_DISABLED_REASON, errorMessage: DEMO_ACCORDION_ERROR_MESSAGE }))',
    '...provideBreadcrumbConfigAt(withBreadcrumbAriaLabels(DEMO_BREADCRUMB_ARIA_LABELS))',
  ],
  setup: `protected readonly trail: readonly CngxBreadcrumbCrumb[] = [
    { label: 'Home', href: '#' },
    { label: 'Settings', href: '#' },
    { label: 'Billing' },
  ];
  protected readonly invoices = signal<'error' | 'success'>('error');`,
  template: `
  <div style="display:grid;gap:16px;max-width:520px">
    <cngx-breadcrumb [items]="trail" />
    <cngx-accordion-group>
      <cngx-accordion-item [state]="invoices()">
        <span cngxAccordionItemTitle>Invoices</span>
        Your invoices.
      </cngx-accordion-item>
      <cngx-accordion-item [disabled]="true">
        <span cngxAccordionItemTitle>Payment methods</span>
        Your payment methods.
      </cngx-accordion-item>
    </cngx-accordion-group>
  </div>`,
  setupChrome: `protected readonly lang = DEMO_LANG;`,
  templateChrome: `
  <div class="button-row" role="group" aria-label="Demo language">
    <button type="button" class="chip" [attr.aria-pressed]="lang() === 'en'" (click)="lang.set('en')">EN</button>
    <button type="button" class="chip" [attr.aria-pressed]="lang() === 'de'" (click)="lang.set('de')">DE</button>
  </div>
  <div class="button-row" role="group" aria-label="Demo section state">
    <button type="button" class="chip" (click)="invoices.set(invoices() === 'error' ? 'success' : 'error')">
      {{ invoices() === 'error' ? 'Recover invoices' : 'Fail invoices' }}
    </button>
  </div>`,
};
