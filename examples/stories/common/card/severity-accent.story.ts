import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Severity Accent',
  subtitle: '<code>[cngxCardAccent]</code> adds a colored top border + tinted background. Five severity levels.',
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
    'import { CngxCard, CngxCardHeader, CngxCardTitle, CngxCardBody, CngxCardAccent } from \'@cngx/common/card\';',
  ],
  imports: ['CngxCard', 'CngxCardHeader', 'CngxCardTitle', 'CngxCardBody', 'CngxCardAccent'],
  template: `
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px">
    <cngx-card cngxCardAccent="danger">
      <header cngxCardHeader><h3 cngxCardTitle>Danger</h3></header>
      <div cngxCardBody style="font-size:0.875rem;color:var(--cngx-color-text-muted)">Critical alert</div>
    </cngx-card>
    <cngx-card cngxCardAccent="warning">
      <header cngxCardHeader><h3 cngxCardTitle>Warning</h3></header>
      <div cngxCardBody style="font-size:0.875rem;color:var(--cngx-color-text-muted)">Needs attention</div>
    </cngx-card>
    <cngx-card cngxCardAccent="success">
      <header cngxCardHeader><h3 cngxCardTitle>Success</h3></header>
      <div cngxCardBody style="font-size:0.875rem;color:var(--cngx-color-text-muted)">All clear</div>
    </cngx-card>
    <cngx-card cngxCardAccent="info">
      <header cngxCardHeader><h3 cngxCardTitle>Info</h3></header>
      <div cngxCardBody style="font-size:0.875rem;color:var(--cngx-color-text-muted)">For your information</div>
    </cngx-card>
    <cngx-card cngxCardAccent="neutral">
      <header cngxCardHeader><h3 cngxCardTitle>Neutral</h3></header>
      <div cngxCardBody style="font-size:0.875rem;color:var(--cngx-color-text-muted)">Default state</div>
    </cngx-card>
  </div>`,
};
