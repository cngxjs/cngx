import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAccordion: Single-open',
  subtitle:
    'A coordinating <code>[cngxAccordion]</code>: opening one panel closes the others. Each header derives its <code>aria-expanded</code> from one open-set signal.',
  description:
    'The coordinator owns the open-set; every <code>[cngxAccordionPanel]</code> header is a button that toggles its id and mirrors <code>aria-expanded</code>/<code>aria-controls</code>. Header buttons are direct children of the accordion so the vertical roving navigation can find them.',
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
    { key: 'shipping', label: 'Shipping', content: 'Free shipping on orders over $50. Most orders arrive in 3-5 business days.' },
    { key: 'returns', label: 'Returns', content: 'Returns accepted within 30 days of delivery, in original condition.' },
    { key: 'warranty', label: 'Warranty', content: 'Two-year limited warranty covering manufacturing defects.' },
  ] as const;`,
  template: `  <div cngxAccordion class="cngx-accordion" #acc="cngxAccordion" style="max-width:480px">
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
