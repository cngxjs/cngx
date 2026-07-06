import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAccordionGroup: Multi-open',
  subtitle:
    'With <code>[multi]="true"</code> the sections open independently - expanding one leaves the others untouched.',
  description:
    'Single- vs multi-open is one input on the group; the coordinator arbitrates the open-set. Every other behaviour (roving headers, heading level, region naming) is identical to the single-open variant.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['behavior', 'a11y-pattern'],
  apiComponents: ['CngxAccordionGroup', 'CngxAccordionItem'],
  imports: ['CngxAccordionGroup', 'CngxAccordionItem', 'CngxAccordionItemTitle'],
  references: [
    {
      label: 'WAI-ARIA APG: Accordion pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/accordion/',
    },
  ],
  template: `  <cngx-accordion-group [multi]="true" [headingLevel]="3" style="max-width:480px">
    <cngx-accordion-item>
      <span cngxAccordionItemTitle>Personal information</span>
      Your name, date of birth, and contact details.
    </cngx-accordion-item>
    <cngx-accordion-item>
      <span cngxAccordionItemTitle>Notifications</span>
      Choose which emails and push messages you receive.
    </cngx-accordion-item>
    <cngx-accordion-item>
      <span cngxAccordionItemTitle>Connected apps</span>
      Review and revoke third-party access to your account.
    </cngx-accordion-item>
  </cngx-accordion-group>`,
};
