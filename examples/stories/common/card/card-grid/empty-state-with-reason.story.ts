import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxCardGrid: Empty state with reason',
  subtitle:
    'Empty-state templates are matched by <code>[emptyReason]</code>. The grid picks the matching <code>cngxCardGridEmpty="<em>reason</em>"</code> template, so the same empty surface communicates different intents to the reader.',
  description:
    'Reason-driven empty state: the grid receives <code>emptyReason</code> and renders the template that declares the matching reason value. Switching the reason in the chrome flips the rendered placeholder without touching the grid\'s item list, demonstrating that the user-facing message belongs to the reason, not to the absence of data.',
  level: 'molecule',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  apiComponents: ['CngxCardGrid', 'CngxCardGridEmpty'],
  moduleImports: [
    "import { CngxCard, CngxCardGrid, CngxCardGridEmpty } from '@cngx/common/card';",
  ],
  imports: ['CngxCard', 'CngxCardGrid', 'CngxCardGridEmpty'],
  setup: `protected readonly emptyItems = signal<string[]>([]);
  protected readonly emptyReason = signal<'first-use' | 'no-results' | 'cleared' | undefined>('first-use');`,
  template: `  <cngx-card-grid [items]="emptyItems()" [emptyReason]="emptyReason()" minWidth="200px">
    <ng-template cngxCardGridEmpty="first-use">
      <div style="text-align:center;padding:48px 16px">
        <div style="font-size:2rem;margin-bottom:12px;opacity:0.4">+</div>
        <p style="margin:0 0 4px"><strong>Welcome!</strong></p>
        <p style="margin:0;font-size:0.875rem">Create your first item to get started.</p>
        <button type="button" class="chip" style="margin-top:12px">Add item</button>
      </div>
    </ng-template>
    <ng-template cngxCardGridEmpty="no-results">
      <div style="text-align:center;padding:48px 16px">
        <div style="font-size:2rem;margin-bottom:12px;opacity:0.4">?</div>
        <p style="margin:0 0 4px"><strong>No results found</strong></p>
        <p style="margin:0;font-size:0.875rem">Try adjusting your filters.</p>
        <button type="button" class="chip" style="margin-top:12px">Reset filters</button>
      </div>
    </ng-template>
    <ng-template cngxCardGridEmpty="cleared">
      <div style="text-align:center;padding:48px 16px">
        <div style="font-size:2rem;margin-bottom:12px;opacity:0.4">&#10003;</div>
        <p style="margin:0 0 4px"><strong>All done</strong></p>
        <p style="margin:0;font-size:0.875rem">Nothing left to process.</p>
      </div>
    </ng-template>
  </cngx-card-grid>`,
  templateChrome: `<div class="button-row" style="margin-bottom:12px">
    <button type="button" class="chip" [attr.aria-pressed]="emptyReason() === 'first-use'" (click)="emptyReason.set('first-use')">first-use</button>
    <button type="button" class="chip" [attr.aria-pressed]="emptyReason() === 'no-results'" (click)="emptyReason.set('no-results')">no-results</button>
    <button type="button" class="chip" [attr.aria-pressed]="emptyReason() === 'cleared'" (click)="emptyReason.set('cleared')">cleared</button>
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">emptyReason</span>
      <span class="event-value">{{ emptyReason() }}</span>
    </div>
  </div>`,
};
