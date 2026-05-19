import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Disabled with Reason',
  subtitle: 'Communicates <em>why</em> via <code>aria-describedby</code>. Inspect the card in devtools — the disabled-reason span is always in the DOM.',
  description: 'Semantic card component with three archetypes: display (article), action (button), and link. Supports selection, loading, disabled with reason, and SR live announcements.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition', 'a11y-pattern'],
  apiComponents: [
    'CngxCard',
    'CngxCardHeader',
    'CngxCardTitle',
    'CngxCardSubtitle',
    'CngxCardBody',
    'CngxCardMedia',
    'CngxCardFooter',
    'CngxCardActions',
    'CngxCardBadge',
    'CngxCardAccent',
    'CngxCardSkeleton',
  ],
  moduleImports: [
    'import { CngxCard, CngxCardHeader, CngxCardBody } from \'@cngx/common/card\';',
  ],
  imports: ['CngxCard', 'CngxCardHeader', 'CngxCardBody'],
  template: `
  <div style="max-width:400px">
    <cngx-card as="button" [disabled]="true"
               disabledReason="Only nursing staff can edit residents"
               ariaLabel="Edit resident">
      <header cngxCardHeader>
        <h3 style="margin:0;font-weight:600;font-size:1rem">Edit Resident</h3>
      </header>
      <div cngxCardBody>
        <p style="margin:0;color:var(--cngx-color-text-muted)">This card is disabled with a reason</p>
      </div>
    </cngx-card>
  </div>`,
};
