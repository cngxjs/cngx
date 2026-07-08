import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Accordion skin: Split meta',
  subtitle:
    'The <code>[skin]="\'split-meta\'"</code> skin pushes the meta slot to the far edge of the header. Here the meta holds a relative <code>&lt;cngx-time&gt;</code> and a status <code>&lt;cngx-tag&gt;</code>.',
  description:
    'The skin styles a right-aligned meta column. Project whatever the row needs into <code>[cngxAccordionItemMeta]</code> - this demo composes a relative timestamp via <code>&lt;cngx-time mode="relative"&gt;</code> with a <code>&lt;cngx-tag&gt;</code> whose <code>color</code> variant carries the status.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: ['CngxAccordionGroup', 'CngxAccordionItem', 'CngxTag'],
  imports: [
    'CngxAccordionGroup',
    'CngxAccordionItem',
    'CngxAccordionItemTitle',
    'CngxAccordionItemSubtitle',
    'CngxAccordionItemMeta',
    'CngxTime',
    'CngxTag',
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
        <cngx-tag color="success" variant="subtle" size="sm">live</cngx-tag>
      </span>
      Rolled out to all regions with no failed health checks.
    </cngx-accordion-item>
    <cngx-accordion-item>
      <span cngxAccordionItemTitle>Nightly backup</span>
      <span cngxAccordionItemSubtitle>primary database</span>
      <span cngxAccordionItemMeta>
        <cngx-time [date]="hourAgo" mode="relative" />
        <cngx-tag color="info" variant="subtle" size="sm">done</cngx-tag>
      </span>
      Snapshot stored and verified against checksum.
    </cngx-accordion-item>
    <cngx-accordion-item>
      <span cngxAccordionItemTitle>Certificate renewal</span>
      <span cngxAccordionItemSubtitle>*.example.com</span>
      <span cngxAccordionItemMeta>
        <cngx-time [date]="dayAgo" mode="relative" />
        <cngx-tag color="warning" variant="subtle" size="sm">review</cngx-tag>
      </span>
      Auto-renewed; manual check queued before expiry.
    </cngx-accordion-item>
  </cngx-accordion-group>`,
};
