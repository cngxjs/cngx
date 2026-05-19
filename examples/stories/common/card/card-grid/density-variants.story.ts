import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Density Variants',
  subtitle: 'Toggle density to see gap and padding changes. <code>compact</code> for dashboards, <code>comfortable</code> for browsing.',
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
    'import { CngxCard, CngxCardBody, CngxCardGrid } from \'@cngx/common/card\';',
  ],
  imports: ['CngxCard', 'CngxCardBody', 'CngxCardGrid'],
  setup: `protected items = signal(['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta']);
  protected density = signal<'compact' | 'default' | 'comfortable'>('default');`,
  template: `
  <div class="button-row" style="margin-bottom:12px">
    <button [class.chip--active]="density() === 'compact'" class="chip"
            (click)="density.set('compact')">Compact</button>
    <button [class.chip--active]="density() === 'default'" class="chip"
            (click)="density.set('default')">Default</button>
    <button [class.chip--active]="density() === 'comfortable'" class="chip"
            (click)="density.set('comfortable')">Comfortable</button>
  </div>
  <cngx-card-grid minWidth="140px" [density]="density()">
    @for (item of items(); track item) {
      <cngx-card>
        <div cngxCardBody style="font-size:0.875rem">{{ item }}</div>
      </cngx-card>
    }
  </cngx-card-grid>`,
};
