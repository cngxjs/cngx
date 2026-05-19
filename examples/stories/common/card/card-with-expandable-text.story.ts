import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Card with Expandable Text',
  subtitle: 'Long card content with <code>cngx-expandable-text</code> — truncated to 3 lines with a read-more toggle.',
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
    'import { CngxCard, CngxCardHeader, CngxCardTitle, CngxCardBody } from \'@cngx/common/card\';',
    'import { CngxExpandableText, CngxExpandableToggle } from \'@cngx/common/layout\';',
  ],
  imports: ['CngxCard', 'CngxCardHeader', 'CngxCardTitle', 'CngxCardBody', 'CngxExpandableText', 'CngxExpandableToggle'],
  template: `
  <div style="max-width:400px">
    <cngx-card>
      <header cngxCardHeader>
        <h3 cngxCardTitle>Project Notes</h3>
      </header>
      <div cngxCardBody>
        <cngx-expandable-text [lines]="3" #exp="cngxExpandableText">
          The project was initialized on 15.03.2026 with a focus on improving user
          onboarding flows. Initial analysis shows a 34% drop-off rate on the second
          step. Proposed changes include simplifying the form layout, adding inline
          validation, and introducing a progress indicator. A/B testing is scheduled
          for 01.04.2026. Early user feedback indicates positive reception of the
          simplified layout. Additional requirements: SSO integration for enterprise
          customers, GDPR-compliant data handling for EU users.
          Next review planned for 22.03.2026.
          <ng-template cngxExpandableToggle let-expanded let-toggle="toggle">
            <button (click)="toggle()" class="chip" style="margin-top:8px">
              {{ expanded ? 'Show less' : 'Read more' }}
            </button>
          </ng-template>
        </cngx-expandable-text>
      </div>
    </cngx-card>
  </div>`,
};
