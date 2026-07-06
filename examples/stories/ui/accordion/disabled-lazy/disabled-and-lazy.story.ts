import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAccordionGroup: Disabled + lazy content',
  subtitle:
    'A disabled section is skipped by arrow-key roving and announces a reason via <code>aria-describedby</code>. A <code>*cngxAccordionItemContent</code> body is instantiated only after its section first opens.',
  description:
    'Disabled headers report <code>tabindex="-1"</code> + <code>aria-disabled="true"</code> and never expand; the visually-hidden reason element keeps a stable IDREF (toggled by <code>aria-hidden</code>, never added/removed). The lazy body stays out of the DOM until the first open, then latches in.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['a11y-pattern', 'composition'],
  apiComponents: ['CngxAccordionGroup', 'CngxAccordionItem', 'CngxAccordionItemContent'],
  imports: [
    'CngxAccordionGroup',
    'CngxAccordionItem',
    'CngxAccordionItemTitle',
    'CngxAccordionItemContent',
  ],
  references: [
    {
      label: 'WAI-ARIA APG: Accordion pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/accordion/',
    },
  ],
  template: `  <cngx-accordion-group [headingLevel]="3" style="max-width:480px">
    <cngx-accordion-item>
      <span cngxAccordionItemTitle>Account details</span>
      Manage your profile, email, and password.
    </cngx-accordion-item>
    <cngx-accordion-item
      [disabled]="true"
      [disabledReason]="'Complete your account setup to unlock billing.'"
    >
      <span cngxAccordionItemTitle>Billing</span>
      Payment methods and invoices.
    </cngx-accordion-item>
    <cngx-accordion-item>
      <span cngxAccordionItemTitle>Activity log</span>
      <ng-template cngxAccordionItemContent>
        <p>This history is built only after the section first opens - the paragraph is absent from the DOM until then.</p>
      </ng-template>
    </cngx-accordion-item>
  </cngx-accordion-group>`,
};
