import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Card Grid',
  navLabel: 'CardGrid',
  navCategory: 'card',
  description:
    'Responsive card grid with intrinsic sizing, keyboard navigation via roving tabindex, density levels, and reason-based empty state template selection.',
  apiComponents: ['CngxCardGrid', 'CngxCardGridEmpty'],
  overview:
    '<p>CSS Grid with <code>auto-fill</code> + <code>minmax</code> — no breakpoints needed. ' +
    '<code>CngxRovingTabindex</code> is a host directive for arrow-key navigation between cards.</p>' +
    '<p>Empty states use <code>ng-template[cngxCardGridEmpty]</code> with reason matching and fallback.</p>',
  moduleImports: [
    "import { CngxCard, CngxCardHeader, CngxCardBody, CngxCardGrid, CngxCardGridEmpty } from '@cngx/common/card';",
  ],
  setup: `
  protected items = signal(['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta']);
  protected emptyItems = signal<string[]>([]);
  protected emptyReason = signal<'first-use' | 'no-results' | 'cleared' | undefined>('first-use');
  protected density = signal<'compact' | 'default' | 'comfortable'>('default');
  `,
  sections: [
    {
      title: 'Basic Grid',
      subtitle:
        'Cards auto-fill with a minimum width of 180px. Resize the browser to see the grid reflow.',
      imports: ['CngxCard', 'CngxCardHeader', 'CngxCardBody', 'CngxCardGrid'],
      template: `
  <cngx-card-grid minWidth="180px">
    @for (item of items(); track item) {
      <cngx-card as="button" [ariaLabel]="item">
        <header cngxCardHeader>
          <h3 style="margin:0;font-weight:600;font-size:0.9375rem">{{ item }}</h3>
        </header>
        <div cngxCardBody>
          <span style="font-size:0.8125rem;color:var(--text-muted)">Content for {{ item }}</span>
        </div>
      </cngx-card>
    }
  </cngx-card-grid>`,
    },
    {
      title: 'Density Variants',
      subtitle:
        'Toggle density to see gap and padding changes. <code>compact</code> for dashboards, <code>comfortable</code> for browsing.',
      imports: ['CngxCard', 'CngxCardBody', 'CngxCardGrid'],
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
    },
    {
      title: 'Empty State with Reason',
      subtitle:
        'Templates are matched by <code>emptyReason</code>. Select a reason to see the corresponding empty state.',
      imports: ['CngxCard', 'CngxCardGrid', 'CngxCardGridEmpty'],
      template: `
  <div class="button-row" style="margin-bottom:12px">
    <button [class.chip--active]="emptyReason() === 'first-use'" class="chip"
            (click)="emptyReason.set('first-use')">first-use</button>
    <button [class.chip--active]="emptyReason() === 'no-results'" class="chip"
            (click)="emptyReason.set('no-results')">no-results</button>
    <button [class.chip--active]="emptyReason() === 'cleared'" class="chip"
            (click)="emptyReason.set('cleared')">cleared</button>
  </div>

  <cngx-card-grid [items]="emptyItems()" [emptyReason]="emptyReason()" minWidth="200px">
    <ng-template cngxCardGridEmpty="first-use">
      <div style="text-align:center;padding:48px 16px;color:var(--text-muted)">
        <div style="font-size:2rem;margin-bottom:12px;opacity:0.4">+</div>
        <p style="font-weight:600;font-size:1rem;color:var(--text-primary);margin-bottom:4px">Welcome!</p>
        <p style="font-size:0.875rem">Create your first item to get started.</p>
        <button class="chip" style="margin-top:12px">Add item</button>
      </div>
    </ng-template>
    <ng-template cngxCardGridEmpty="no-results">
      <div style="text-align:center;padding:48px 16px;color:var(--text-muted)">
        <div style="font-size:2rem;margin-bottom:12px;opacity:0.4">?</div>
        <p style="font-weight:600;font-size:1rem;color:var(--text-primary);margin-bottom:4px">No results found</p>
        <p style="font-size:0.875rem">Try adjusting your filters.</p>
        <button class="chip" style="margin-top:12px">Reset filters</button>
      </div>
    </ng-template>
    <ng-template cngxCardGridEmpty="cleared">
      <div style="text-align:center;padding:48px 16px;color:var(--text-muted)">
        <div style="font-size:2rem;margin-bottom:12px;opacity:0.4">&#10003;</div>
        <p style="font-weight:600;font-size:1rem;color:var(--text-primary);margin-bottom:4px">All done</p>
        <p style="font-size:0.875rem">Nothing left to process.</p>
      </div>
    </ng-template>
  </cngx-card-grid>`,
    },
  ],
};
