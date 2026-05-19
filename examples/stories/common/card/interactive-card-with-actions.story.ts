import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Interactive Card with Actions',
  subtitle: 'Multiple independent actions inside. The card itself is <code>role="article"</code> — the buttons carry the interaction.',
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
    'import { CngxCard, CngxCardHeader, CngxCardBody, CngxCardActions } from \'@cngx/common/card\';',
  ],
  imports: ['CngxCard', 'CngxCardHeader', 'CngxCardBody', 'CngxCardActions'],
  template: `
  <div style="max-width:400px">
    <cngx-card>
      <header cngxCardHeader>
        <h3 style="margin:0;font-weight:600;font-size:1rem">Care plan</h3>
      </header>
      <div cngxCardBody>
        <p style="margin:0;color:var(--cngx-color-text-muted)">Next evaluation: 18.07.2025</p>
      </div>
      <div cngxCardActions align="end">
        <button class="chip">Edit</button>
        <button class="chip">Delete</button>
      </div>
    </cngx-card>
  </div>`,
};
