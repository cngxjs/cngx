import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Accordion panel: Checklist with progress',
  subtitle:
    'A panel body composed from <code>&lt;cngx-progress&gt;</code> plus a labelled checklist. The accordion hosts the composition; each part keeps its own semantics.',
  description:
    'Compose, do not reinvent: the body pairs the <code>CngxProgress</code> bar with native checkboxes and their <code>&lt;label&gt;</code>s. The accordion projects the whole block and stays out of the progress and checked state.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['composition'],
  apiComponents: ['CngxAccordionGroup', 'CngxAccordionItem', 'CngxProgress'],
  imports: [
    'CngxAccordionGroup',
    'CngxAccordionItem',
    'CngxAccordionItemTitle',
    'CngxAccordionItemSubtitle',
    'CngxProgress',
  ],
  references: [
    {
      label: 'WAI-ARIA APG: Accordion pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/accordion/',
    },
  ],
  template: `  <cngx-accordion-group [multi]="true" [headingLevel]="3" style="max-width:480px">
    <cngx-accordion-item>
      <span cngxAccordionItemTitle>Onboarding</span>
      <span cngxAccordionItemSubtitle>2 of 3 done</span>
      <cngx-progress [progress]="66" [showLabel]="true" label="Onboarding progress" />
      <ul style="list-style:none; padding:0; margin:.75rem 0 0; display:grid; gap:.4rem">
        <li>
          <label style="display:flex; gap:.5rem; align-items:center">
            <input type="checkbox" checked disabled /> Verify email
          </label>
        </li>
        <li>
          <label style="display:flex; gap:.5rem; align-items:center">
            <input type="checkbox" checked disabled /> Complete profile
          </label>
        </li>
        <li>
          <label style="display:flex; gap:.5rem; align-items:center">
            <input type="checkbox" disabled /> Invite a teammate
          </label>
        </li>
      </ul>
    </cngx-accordion-item>
    <cngx-accordion-item>
      <span cngxAccordionItemTitle>Go-live readiness</span>
      <span cngxAccordionItemSubtitle>1 of 3 done</span>
      <cngx-progress [progress]="33" [showLabel]="true" label="Go-live readiness" />
      <ul style="list-style:none; padding:0; margin:.75rem 0 0; display:grid; gap:.4rem">
        <li>
          <label style="display:flex; gap:.5rem; align-items:center">
            <input type="checkbox" checked disabled /> Connect a payment provider
          </label>
        </li>
        <li>
          <label style="display:flex; gap:.5rem; align-items:center">
            <input type="checkbox" disabled /> Configure tax rules
          </label>
        </li>
        <li>
          <label style="display:flex; gap:.5rem; align-items:center">
            <input type="checkbox" disabled /> Publish the storefront
          </label>
        </li>
      </ul>
    </cngx-accordion-item>
  </cngx-accordion-group>`,
};
