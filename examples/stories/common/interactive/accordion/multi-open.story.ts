import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAccordion: Multi-open',
  subtitle:
    'With <code>[multi]="true"</code> each panel opens independently; <code>aria-multiselectable</code> is reactive.',
  description:
    'Multi-open flips the coordinator from "at most one" to "any number" - the same open-set signal, just without the collapse-others step. <code>aria-multiselectable="true"</code> tells assistive tech the panels are independent.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'a11y-pattern'],
  apiComponents: ['CngxAccordion', 'CngxAccordionPanel'],
  imports: ['CngxAccordion', 'CngxAccordionPanel'],
  references: [
    {
      label: 'WAI-ARIA APG: Accordion pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/accordion/',
    },
  ],
  setup: `protected readonly items = [
    { key: 'account', label: 'Account', content: 'Manage your profile, email, and password.' },
    { key: 'billing', label: 'Billing', content: 'Update your card and download invoices.' },
    { key: 'notifications', label: 'Notifications', content: 'Choose which emails and pushes you receive.' },
  ] as const;`,
  template: `  <div cngxAccordion class="cngx-accordion" [multi]="true" #acc="cngxAccordion" style="max-width:480px">
    @for (item of items; track item.key) {
      <button cngxAccordionPanel [panelId]="item.key" [controls]="'region-' + item.key">
        {{ item.label }}
      </button>
      <div
        class="cngx-accordion__region"
        role="region"
        [id]="'region-' + item.key"
        [attr.aria-label]="item.label"
        [hidden]="!acc.isOpen(item.key)">
        {{ item.content }}
      </div>
    }
  </div>`,
};
