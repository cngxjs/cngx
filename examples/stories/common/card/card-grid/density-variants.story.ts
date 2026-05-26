import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxCardGrid: Density variants',
  subtitle:
    '<code>[density]</code> picks between <code>compact</code>, <code>default</code>, and <code>comfortable</code>. Compact for dashboards, default for general use, comfortable for browsing flows.',
  description:
    'Three preset densities adjust the grid\'s gap and the card padding in lockstep. Switching the segment chips above swaps the density signal; the grid + every card inside it react immediately.',
  level: 'molecule',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: ['CngxCardGrid'],
  moduleImports: [
    "import { CngxCard, CngxCardBody, CngxCardGrid } from '@cngx/common/card';",
  ],
  imports: ['CngxCard', 'CngxCardBody', 'CngxCardGrid'],
  setup: `protected readonly items = signal(['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta']);
  protected readonly density = signal<'compact' | 'default' | 'comfortable'>('default');`,
  template: `  <cngx-card-grid minWidth="140px" [density]="density()">
    @for (item of items(); track item) {
      <cngx-card>
        <div cngxCardBody>{{ item }}</div>
      </cngx-card>
    }
  </cngx-card-grid>`,
  templateChrome: `<div class="button-row" style="margin-bottom:12px">
    <button type="button" class="chip" [attr.aria-pressed]="density() === 'compact'" (click)="density.set('compact')">Compact</button>
    <button type="button" class="chip" [attr.aria-pressed]="density() === 'default'" (click)="density.set('default')">Default</button>
    <button type="button" class="chip" [attr.aria-pressed]="density() === 'comfortable'" (click)="density.set('comfortable')">Comfortable</button>
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">density</span>
      <span class="event-value">{{ density() }}</span>
    </div>
  </div>`,
};
