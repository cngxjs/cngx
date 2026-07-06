import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAccordionGroup: Controlled open-state',
  subtitle:
    'Bind <code>[(openIds)]</code> to a signal of stable <code>[panelId]</code> values. Seed it to render a section open on load, or set it from outside to drive expansion declaratively (router / SSR).',
  description:
    'Expansion is a controlled <code>model&lt;ReadonlySet&lt;string&gt;&gt;</code>. Give each item a stable <code>[panelId]</code> so the consumer can address it; the seed below opens Billing on load, and the buttons drive expansion from outside the accordion.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['behavior', 'integration'],
  apiComponents: ['CngxAccordionGroup', 'CngxAccordionItem'],
  imports: ['CngxAccordionGroup', 'CngxAccordionItem', 'CngxAccordionItemTitle'],
  references: [
    {
      label: 'WAI-ARIA APG: Accordion pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/accordion/',
    },
  ],
  setup: `protected readonly openIds = signal<ReadonlySet<string>>(new Set(['billing']));`,
  setupChrome: `protected openSection(id: string): void {
    this.openIds.set(new Set([id]));
  }
  protected openSummary(): string {
    return Array.from(this.openIds()).join(', ') || 'none';
  }`,
  template: `  <cngx-accordion-group [(openIds)]="openIds" [headingLevel]="3" style="max-width:480px">
    <cngx-accordion-item panelId="profile">
      <span cngxAccordionItemTitle>Profile</span>
      Your public profile and avatar.
    </cngx-accordion-item>
    <cngx-accordion-item panelId="billing">
      <span cngxAccordionItemTitle>Billing</span>
      Payment methods and invoices.
    </cngx-accordion-item>
    <cngx-accordion-item panelId="security">
      <span cngxAccordionItemTitle>Security</span>
      Password, two-factor, and active sessions.
    </cngx-accordion-item>
  </cngx-accordion-group>`,
  templateChrome: `  <div class="button-row">
    <button type="button" (click)="openSection('profile')">Open Profile</button>
    <button type="button" (click)="openSection('security')">Open Security</button>
  </div>
  <p class="status-row">Currently open: {{ openSummary() }}</p>`,
};
