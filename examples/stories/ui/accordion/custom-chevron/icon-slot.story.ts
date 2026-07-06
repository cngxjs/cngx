import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAccordionGroup: Custom chevron',
  subtitle:
    'Project <code>&lt;ng-template cngxAccordionItemIcon let-expanded&gt;</code> to replace the CSS chevron per item. The template receives the item&apos;s expanded state as <code>$implicit</code>, so the glyph can flip open/closed.',
  description:
    'The icon slot is the visual-override seam - no <code>&lt;cngx-icon&gt;</code> dependency, bring your own glyph. For one chevron across every accordion in the app, hand the same template to <code>withAccordionTemplates({ icon })</code> instead of repeating it per item; the per-instance slot still wins.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  apiComponents: ['CngxAccordionGroup', 'CngxAccordionItem', 'CngxAccordionItemIcon'],
  imports: [
    'CngxAccordionGroup',
    'CngxAccordionItem',
    'CngxAccordionItemTitle',
    'CngxAccordionItemIcon',
  ],
  references: [
    {
      label: 'WAI-ARIA APG: Accordion pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/accordion/',
    },
  ],
  template: `  <cngx-accordion-group [headingLevel]="3" style="max-width:480px">
    <cngx-accordion-item>
      <span cngxAccordionItemTitle>Overview</span>
      <ng-template cngxAccordionItemIcon let-expanded>
        <span [style.font-weight]="700">{{ expanded ? '−' : '+' }}</span>
      </ng-template>
      A high-level summary of the report.
    </cngx-accordion-item>
    <cngx-accordion-item>
      <span cngxAccordionItemTitle>Methodology</span>
      <ng-template cngxAccordionItemIcon let-expanded>
        <span [style.font-weight]="700">{{ expanded ? '−' : '+' }}</span>
      </ng-template>
      How the numbers were gathered and normalised.
    </cngx-accordion-item>
    <cngx-accordion-item>
      <span cngxAccordionItemTitle>Sources</span>
      <ng-template cngxAccordionItemIcon let-expanded>
        <span [style.font-weight]="700">{{ expanded ? '−' : '+' }}</span>
      </ng-template>
      Datasets and references used in this report.
    </cngx-accordion-item>
  </cngx-accordion-group>`,
};
