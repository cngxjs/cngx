import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Accordion panel: Activity feed',
  subtitle:
    'A panel body built from <code>&lt;cngx-avatar&gt;</code> rows with a relative <code>&lt;cngx-time&gt;</code> per entry. The accordion folds a feed away behind one header.',
  description:
    'The body composes two display atoms - <code>CngxAvatar</code> for the actor and <code>CngxTime</code> for a relative timestamp. The accordion projects the list and never reaches into either atom.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['composition'],
  apiComponents: ['CngxAccordionGroup', 'CngxAccordionItem', 'CngxAvatar', 'CngxTime'],
  imports: [
    'CngxAccordionGroup',
    'CngxAccordionItem',
    'CngxAccordionItemTitle',
    'CngxAccordionItemSubtitle',
    'CngxAvatar',
    'CngxTime',
  ],
  references: [
    {
      label: 'WAI-ARIA APG: Accordion pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/accordion/',
    },
  ],
  setup: `  protected readonly minsAgo = new Date(Date.now() - 8 * 60 * 1000);
  protected readonly hourAgo = new Date(Date.now() - 70 * 60 * 1000);
  protected readonly yesterday = new Date(Date.now() - 27 * 60 * 60 * 1000);`,
  template: `  <cngx-accordion-group [headingLevel]="3" style="max-width:520px">
    <cngx-accordion-item>
      <span cngxAccordionItemTitle>Recent activity</span>
      <span cngxAccordionItemSubtitle>Last 24 hours</span>
      <ul style="list-style:none; padding:0; margin:0; display:grid; gap:.75rem">
        <li style="display:flex; gap:.75rem; align-items:center">
          <cngx-avatar initials="AL" size="sm" />
          <span style="flex:1">Ada Lovelace merged pull request #482</span>
          <cngx-time [date]="minsAgo" mode="relative" style="color:var(--cngx-color-text-muted, #6b7280); font-size:.85rem" />
        </li>
        <li style="display:flex; gap:.75rem; align-items:center">
          <cngx-avatar initials="GH" size="sm" />
          <span style="flex:1">Grace Hopper commented on issue #197</span>
          <cngx-time [date]="hourAgo" mode="relative" style="color:var(--cngx-color-text-muted, #6b7280); font-size:.85rem" />
        </li>
        <li style="display:flex; gap:.75rem; align-items:center">
          <cngx-avatar initials="KJ" size="sm" />
          <span style="flex:1">Katherine Johnson tagged release v3.2.0</span>
          <cngx-time [date]="yesterday" mode="relative" style="color:var(--cngx-color-text-muted, #6b7280); font-size:.85rem" />
        </li>
      </ul>
    </cngx-accordion-item>
  </cngx-accordion-group>`,
};
