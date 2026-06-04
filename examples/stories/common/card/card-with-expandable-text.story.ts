import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxExpandableText: Card with expandable text',
  subtitle:
    'Long card body content wrapped in <code>&lt;cngx-expandable-text&gt;</code>: truncated to three lines by default with a slot-overridden <em>Read more</em> trigger that flips to <em>Show less</em>.',
  description:
    'Card body hosting a clamped-text molecule. <code>[lines]="3"</code> sets the truncation; the <code>cngxExpandableToggle</code> slot is a plain button whose label switches on the exposed <code>expanded</code> context. The expansion is purely visual; the full text is always in the DOM so screen readers can read it without interaction.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  apiComponents: ['CngxExpandableText', 'CngxExpandableToggle'],
  moduleImports: [
    "import { CngxCard, CngxCardHeader, CngxCardTitle, CngxCardBody } from '@cngx/common/card';",
    "import { CngxExpandableText, CngxExpandableToggle } from '@cngx/common/layout';",
  ],
  imports: [
    'CngxCard',
    'CngxCardHeader',
    'CngxCardTitle',
    'CngxCardBody',
    'CngxExpandableText',
    'CngxExpandableToggle',
  ],
  template: `  <div style="max-width:400px">
    <cngx-card>
      <header cngxCardHeader><h3 cngxCardTitle>Project notes</h3></header>
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
            <button type="button" class="chip" style="margin-top:8px" (click)="toggle()">
              {{ expanded ? 'Show less' : 'Read more' }}
            </button>
          </ng-template>
        </cngx-expandable-text>
      </div>
    </cngx-card>
  </div>`,
};
