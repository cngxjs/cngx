import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Accordion panel: Data table',
  subtitle:
    'A panel body can be a full <code>&lt;table&gt;</code> with a caption, header row, and data rows. The accordion is just the disclosure chrome around it.',
  description:
    'Same accordion, a tabular body. The table brings its own semantics (<code>&lt;caption&gt;</code>, <code>&lt;thead&gt;</code>, scoped headers); the accordion adds nothing to it beyond show/hide.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['composition'],
  apiComponents: ['CngxAccordionGroup', 'CngxAccordionItem'],
  imports: ['CngxAccordionGroup', 'CngxAccordionItem', 'CngxAccordionItemTitle'],
  references: [
    {
      label: 'WAI-ARIA APG: Accordion pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/accordion/',
    },
  ],
  template: `  <cngx-accordion-group [headingLevel]="3" style="max-width:560px">
    <cngx-accordion-item>
      <span cngxAccordionItemTitle>Q3 regional sales</span>
      <table style="width:100%; border-collapse:collapse; font-size:.9rem">
        <caption style="text-align:left; padding:.25rem 0; color:var(--cngx-color-text-muted, #6b7280)">
          Revenue by region, thousands USD
        </caption>
        <thead>
          <tr>
            <th scope="col" style="text-align:left; border-bottom:1px solid #e5e7eb; padding:.4rem">Region</th>
            <th scope="col" style="text-align:right; border-bottom:1px solid #e5e7eb; padding:.4rem">Revenue</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style="padding:.4rem">EMEA</td><td style="text-align:right; padding:.4rem">412</td></tr>
          <tr><td style="padding:.4rem">Americas</td><td style="text-align:right; padding:.4rem">508</td></tr>
          <tr><td style="padding:.4rem">APAC</td><td style="text-align:right; padding:.4rem">297</td></tr>
        </tbody>
      </table>
    </cngx-accordion-item>
    <cngx-accordion-item>
      <span cngxAccordionItemTitle>Q3 headcount</span>
      <table style="width:100%; border-collapse:collapse; font-size:.9rem">
        <caption style="text-align:left; padding:.25rem 0; color:var(--cngx-color-text-muted, #6b7280)">
          Team size at end of quarter
        </caption>
        <thead>
          <tr>
            <th scope="col" style="text-align:left; border-bottom:1px solid #e5e7eb; padding:.4rem">Team</th>
            <th scope="col" style="text-align:right; border-bottom:1px solid #e5e7eb; padding:.4rem">People</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style="padding:.4rem">Engineering</td><td style="text-align:right; padding:.4rem">64</td></tr>
          <tr><td style="padding:.4rem">Sales</td><td style="text-align:right; padding:.4rem">31</td></tr>
        </tbody>
      </table>
    </cngx-accordion-item>
  </cngx-accordion-group>`,
};
