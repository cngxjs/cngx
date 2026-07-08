import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Accordion skin: Split meta',
  subtitle:
    'The <code>[skin]="\'split-meta\'"</code> skin pushes the meta slot to the far edge of the header. Here the meta holds a relative <code>&lt;cngx-time&gt;</code> and a small status badge.',
  description:
    'The skin styles a right-aligned meta column. Project whatever the row needs into <code>[cngxAccordionItemMeta]</code> - this demo composes a relative timestamp via <code>&lt;cngx-time mode="relative"&gt;</code> with a badge span.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: ['CngxAccordionGroup', 'CngxAccordionItem'],
  imports: [
    'CngxAccordionGroup',
    'CngxAccordionItem',
    'CngxAccordionItemTitle',
    'CngxAccordionItemSubtitle',
    'CngxAccordionItemMeta',
    'CngxTime',
  ],
  references: [
    {
      label: 'WAI-ARIA APG: Accordion pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/accordion/',
    },
  ],
  setup: `  protected readonly now = new Date();
  protected readonly hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  protected readonly dayAgo = new Date(Date.now() - 26 * 60 * 60 * 1000);`,
  template: `  <cngx-accordion-group [skin]="'split-meta'" [multi]="true" [headingLevel]="3" style="max-width:600px">
    <cngx-accordion-item>
      <span cngxAccordionItemTitle>Deployment succeeded</span>
      <span cngxAccordionItemSubtitle>api-gateway v2.14.0</span>
      <span cngxAccordionItemMeta>
        <cngx-time [date]="now" mode="relative" />
        <span style="margin-inline-start:.5rem; padding:.1rem .4rem; border-radius:4px; background:#dcfce7; color:#166534; font-size:.75rem">live</span>
      </span>
      Rolled out to all regions with no failed health checks.
    </cngx-accordion-item>
    <cngx-accordion-item>
      <span cngxAccordionItemTitle>Nightly backup</span>
      <span cngxAccordionItemSubtitle>primary database</span>
      <span cngxAccordionItemMeta>
        <cngx-time [date]="hourAgo" mode="relative" />
        <span style="margin-inline-start:.5rem; padding:.1rem .4rem; border-radius:4px; background:#e0e7ff; color:#3730a3; font-size:.75rem">done</span>
      </span>
      Snapshot stored and verified against checksum.
    </cngx-accordion-item>
    <cngx-accordion-item>
      <span cngxAccordionItemTitle>Certificate renewal</span>
      <span cngxAccordionItemSubtitle>*.example.com</span>
      <span cngxAccordionItemMeta>
        <cngx-time [date]="dayAgo" mode="relative" />
        <span style="margin-inline-start:.5rem; padding:.1rem .4rem; border-radius:4px; background:#fef3c7; color:#92400e; font-size:.75rem">review</span>
      </span>
      Auto-renewed; manual check queued before expiry.
    </cngx-accordion-item>
  </cngx-accordion-group>`,
};
