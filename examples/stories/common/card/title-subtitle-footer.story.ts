import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxCard: Title subtitle footer',
  subtitle:
    '<code>[cngxCardTitle]</code> and <code>[cngxCardSubtitle]</code> provide consistent typography inside <code>[cngxCardHeader]</code>; <code>[cngxCardFooter]</code> closes the slot row.',
  description:
    'Plain display card with the canonical slot composition: header carrying a title and subtitle, a body, and a footer. No interaction, no ARIA wiring beyond <code>role="article"</code> on the card itself.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  apiComponents: [
    'CngxCard',
    'CngxCardHeader',
    'CngxCardTitle',
    'CngxCardSubtitle',
    'CngxCardBody',
    'CngxCardFooter',
  ],
  moduleImports: [
    "import { CngxCard, CngxCardHeader, CngxCardTitle, CngxCardSubtitle, CngxCardBody, CngxCardFooter } from '@cngx/common/card';",
  ],
  imports: [
    'CngxCard',
    'CngxCardHeader',
    'CngxCardTitle',
    'CngxCardSubtitle',
    'CngxCardBody',
    'CngxCardFooter',
  ],
  template: `  <div style="max-width:400px">
    <cngx-card>
      <header cngxCardHeader>
        <h3 cngxCardTitle>Project Phoenix</h3>
        <span cngxCardSubtitle>Release 4.2, Sprint 12</span>
      </header>
      <div cngxCardBody>
        <p style="margin:0">Status: On track. Last build passing on main.</p>
      </div>
      <footer cngxCardFooter>
        <small>Last updated: today</small>
      </footer>
    </cngx-card>
  </div>`,
};
