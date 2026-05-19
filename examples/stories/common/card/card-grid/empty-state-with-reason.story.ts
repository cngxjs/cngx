import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Empty State with Reason',
  subtitle: 'Templates are matched by <code>emptyReason</code>. Select a reason to see the corresponding empty state.',
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
    'import { CngxCard, CngxCardGrid, CngxCardGridEmpty } from \'@cngx/common/card\';',
  ],
  imports: ['CngxCard', 'CngxCardGrid', 'CngxCardGridEmpty'],
  setup: `protected items = signal(['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta']);
  protected emptyItems = signal<string[]>([]);
  protected emptyReason = signal<'first-use' | 'no-results' | 'cleared' | undefined>('first-use');`,
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
      <div style="text-align:center;padding:48px 16px;color:var(--cngx-color-text-muted)">
        <div style="font-size:2rem;margin-bottom:12px;opacity:0.4">+</div>
        <p style="font-weight:600;font-size:1rem;color:var(--cngx-color-text);margin-bottom:4px">Welcome!</p>
        <p style="font-size:0.875rem">Create your first item to get started.</p>
        <button class="chip" style="margin-top:12px">Add item</button>
      </div>
    </ng-template>
    <ng-template cngxCardGridEmpty="no-results">
      <div style="text-align:center;padding:48px 16px;color:var(--cngx-color-text-muted)">
        <div style="font-size:2rem;margin-bottom:12px;opacity:0.4">?</div>
        <p style="font-weight:600;font-size:1rem;color:var(--cngx-color-text);margin-bottom:4px">No results found</p>
        <p style="font-size:0.875rem">Try adjusting your filters.</p>
        <button class="chip" style="margin-top:12px">Reset filters</button>
      </div>
    </ng-template>
    <ng-template cngxCardGridEmpty="cleared">
      <div style="text-align:center;padding:48px 16px;color:var(--cngx-color-text-muted)">
        <div style="font-size:2rem;margin-bottom:12px;opacity:0.4">&#10003;</div>
        <p style="font-weight:600;font-size:1rem;color:var(--cngx-color-text);margin-bottom:4px">All done</p>
        <p style="font-size:0.875rem">Nothing left to process.</p>
      </div>
    </ng-template>
  </cngx-card-grid>`,
};
