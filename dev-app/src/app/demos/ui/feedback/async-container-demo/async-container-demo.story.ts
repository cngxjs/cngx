import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Async Container',
  navLabel: 'Async Container',
  navCategory: 'feedback',
  description: 'Full template-slot container that coordinates skeleton, content, empty, and error states from a CngxAsyncState.',
  apiComponents: ['CngxAsyncContainer'],
  moduleImports: [
    "import { CngxAsyncContainer, CngxAsyncSkeletonTpl, CngxAsyncContentTpl, CngxAsyncEmptyTpl, CngxAsyncErrorTpl } from '@cngx/ui/feedback';",
    "import { createManualState } from '@cngx/common/data';",
  ],
  setup: `
  protected readonly state = createManualState<string[]>();

  protected loadData(): void {
    this.state.set('loading');
    setTimeout(() => {
      this.state.setSuccess(['Alice', 'Bob', 'Charlie']);
    }, 2000);
  }

  protected loadEmpty(): void {
    this.state.set('loading');
    setTimeout(() => {
      this.state.setSuccess([]);
    }, 2000);
  }

  protected loadError(): void {
    this.state.set('loading');
    setTimeout(() => {
      this.state.setError('Network timeout');
    }, 2000);
  }

  protected refresh(): void {
    this.state.set('refreshing');
    setTimeout(() => {
      this.state.setSuccess(['Alice', 'Bob', 'Charlie', 'Diana']);
    }, 2000);
  }
  `,
  sections: [
    {
      title: 'Full State Machine',
      subtitle: 'Four templates for four states. Built-in refresh indicator bar.',
      imports: ['CngxAsyncContainer', 'CngxAsyncSkeletonTpl', 'CngxAsyncContentTpl', 'CngxAsyncEmptyTpl', 'CngxAsyncErrorTpl'],
      template: `
  <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px">
    <button (click)="loadData()" class="chip">Load Data</button>
    <button (click)="loadEmpty()" class="chip">Load Empty</button>
    <button (click)="loadError()" class="chip">Load Error</button>
    <button (click)="refresh()" class="chip" [disabled]="state.isFirstLoad()">Refresh</button>
    <button (click)="state.reset()" class="chip">Reset</button>
  </div>

  <div class="event-grid" style="margin-bottom:16px">
    <div class="event-row">
      <span class="event-label">Status</span>
      <span class="event-value">{{ state.status() }}</span>
    </div>
  </div>

  <cngx-async-container [state]="state" ariaLabel="People list">
    <ng-template cngxAsyncSkeleton>
      <div style="display:flex;flex-direction:column;gap:8px">
        @for (i of [1,2,3]; track i) {
          <div style="height:24px;background:#e5e7eb;border-radius:4px;animation:pulse 1.5s ease-in-out infinite"></div>
        }
      </div>
    </ng-template>

    <ng-template cngxAsyncContent let-data>
      <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:4px">
        @for (name of data; track name) {
          <li style="padding:8px 12px;background:var(--cngx-card-bg,#f8fafc);border-radius:4px">{{ name }}</li>
        }
      </ul>
    </ng-template>

    <ng-template cngxAsyncEmpty>
      <p style="color:var(--cngx-muted,#64748b);text-align:center;padding:24px">No people found.</p>
    </ng-template>

    <ng-template cngxAsyncError let-err>
      <div style="color:var(--cngx-alert-error-icon,#ef4444);padding:16px;text-align:center">
        Error: {{ err }}
        <button (click)="loadData()" class="chip" style="margin-top:8px">Retry</button>
      </div>
    </ng-template>
  </cngx-async-container>`,
    },
  ],
};
