import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Basic Grid',
  subtitle: 'Cards auto-fill with a minimum width of 180px. Resize the browser to see the grid reflow.',
  description: 'Responsive card grid with intrinsic sizing, keyboard navigation via roving tabindex, density levels, and reason-based empty state template selection.',
  level: 'molecule',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  apiComponents: [
    'CngxCardGrid',
    'CngxCardGridEmpty',
  ],
  moduleImports: [
    'import { CngxCard, CngxCardHeader, CngxCardBody, CngxCardGrid } from \'@cngx/common/card\';',
  ],
  imports: ['CngxCard', 'CngxCardHeader', 'CngxCardBody', 'CngxCardGrid'],
  setup: `protected items = signal(['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta']);`,
  template: `
  <cngx-card-grid minWidth="180px">
    @for (item of items(); track item) {
      <cngx-card as="button" [ariaLabel]="item">
        <header cngxCardHeader>
          <h3 style="margin:0;font-weight:600;font-size:0.9375rem">{{ item }}</h3>
        </header>
        <div cngxCardBody>
          <span style="font-size:0.8125rem;color:var(--cngx-color-text-muted)">Content for {{ item }}</span>
        </div>
      </cngx-card>
    }
  </cngx-card-grid>`,
};
