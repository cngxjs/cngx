import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAccordionGroup: App-wide disabled reason',
  subtitle:
    'Hand <code>withAccordionLabels(...)</code> to <code>provideAccordionConfig(...)</code> (root) or <code>provideAccordionConfigAt(...)</code> (sub-tree) so every disabled section announces one shared reason - no per-item <code>[disabledReason]</code>.',
  description:
    'The disabled section below sets no <code>[disabledReason]</code>; its <code>aria-describedby</code> reason resolves through the config cascade (per-instance input, then <code>provideAccordionConfigAt</code>, then <code>provideAccordionConfig</code>, then the English default). Library defaults are English; the override is consumer-supplied.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['a11y-pattern', 'composition'],
  apiComponents: ['CngxAccordionGroup', 'CngxAccordionItem'],
  moduleImports: [
    "import { provideAccordionConfigAt, withAccordionLabels } from '@cngx/ui/accordion';",
  ],
  imports: ['CngxAccordionGroup', 'CngxAccordionItem', 'CngxAccordionItemTitle'],
  references: [
    {
      label: 'WAI-ARIA APG: Accordion pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/accordion/',
    },
  ],
  viewProviders: [
    "provideAccordionConfigAt(withAccordionLabels({ disabledReason: 'This section unlocks once your profile is complete.' }))",
  ],
  template: `  <cngx-accordion-group [headingLevel]="3" style="max-width:480px">
    <cngx-accordion-item>
      <span cngxAccordionItemTitle>Profile</span>
      Your public profile and avatar.
    </cngx-accordion-item>
    <cngx-accordion-item [disabled]="true">
      <span cngxAccordionItemTitle>Billing</span>
      Payment methods and invoices.
    </cngx-accordion-item>
    <cngx-accordion-item [disabled]="true">
      <span cngxAccordionItemTitle>Team members</span>
      Invite and manage collaborators.
    </cngx-accordion-item>
  </cngx-accordion-group>`,
};
