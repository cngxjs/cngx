import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxCardGrid: Basic grid',
  subtitle:
    '<code>&lt;cngx-card-grid&gt;</code> auto-fills cards using <code>repeat(auto-fill, minmax(<em>minWidth</em>, 1fr))</code>. Resize the viewport to watch the grid reflow without breakpoint code.',
  description:
    'Intrinsic-sized grid driven entirely by a CSS <code>minWidth</code> input. Cards keep their own role (here, <code>as="button"</code>) and the grid only owns layout; the result reflows from one column on narrow screens to many columns on wider ones without any media queries.',
  level: 'molecule',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  apiComponents: ['CngxCardGrid'],
  moduleImports: [
    "import { CngxCard, CngxCardHeader, CngxCardTitle, CngxCardSubtitle, CngxCardBody, CngxCardGrid } from '@cngx/common/card';",
  ],
  imports: ['CngxCard', 'CngxCardHeader', 'CngxCardTitle', 'CngxCardSubtitle', 'CngxCardBody', 'CngxCardGrid'],
  setup: `protected readonly items = signal(['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta']);`,
  template: `  <cngx-card-grid minWidth="180px">
    @for (item of items(); track item) {
      <cngx-card as="button" [ariaLabel]="item">
        <header cngxCardHeader>
          <h3 cngxCardTitle>{{ item }}</h3>
        </header>
        <div cngxCardBody>
          <span cngxCardSubtitle>Content for {{ item }}</span>
        </div>
      </cngx-card>
    }
  </cngx-card-grid>`,
};
