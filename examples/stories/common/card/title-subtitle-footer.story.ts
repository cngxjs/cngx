import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Title + Subtitle + Footer',
  subtitle: '<code>[cngxCardTitle]</code> and <code>[cngxCardSubtitle]</code> provide consistent typography inside the header.',
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
    'import { CngxCard, CngxCardHeader, CngxCardTitle, CngxCardSubtitle, CngxCardBody, CngxCardFooter } from \'@cngx/common/card\';',
  ],
  imports: ['CngxCard', 'CngxCardHeader', 'CngxCardTitle', 'CngxCardSubtitle', 'CngxCardBody', 'CngxCardFooter'],
  template: `
  <div style="max-width:400px">
    <cngx-card>
      <header cngxCardHeader>
        <h3 cngxCardTitle>Patient Overview</h3>
        <span cngxCardSubtitle>Maria Muster, Room 12</span>
      </header>
      <div cngxCardBody>
        <p style="margin:0;color:var(--cngx-color-text-muted)">Status: Active. Last vitals normal.</p>
      </div>
      <footer cngxCardFooter>
        <small style="color:var(--cngx-color-text-muted)">Last updated: today</small>
      </footer>
    </cngx-card>
  </div>`,
};
