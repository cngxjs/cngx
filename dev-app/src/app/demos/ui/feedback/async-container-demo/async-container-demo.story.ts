import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Async Container',
  navLabel: 'Async Container',
  navCategory: 'feedback',
  description: 'Coordinates skeleton, content, empty, and error states from a single CngxAsyncState. Two APIs: *cngxAsync (minimal) and <cngx-async-container> (full control).',
  apiComponents: ['CngxAsyncContainer', 'CngxAsync'],
  moduleImports: [
    "import { CngxAsyncContainer, CngxAsyncSkeletonTpl, CngxAsyncContentTpl, CngxAsyncEmptyTpl, CngxAsyncErrorTpl } from '@cngx/ui/feedback';",
    "import { CngxAsync, createManualState } from '@cngx/common/data';",
  ],
  setup: `
  // ── Shared state for all demos ──
  protected readonly people = createManualState<string[]>();
  protected readonly product = createManualState<{ name: string; price: number } | null>();

  protected loadPeople(): void {
    this.people.set('loading');
    setTimeout(() => this.people.setSuccess(['Alice', 'Bob', 'Charlie']), 2000);
  }

  protected loadEmpty(): void {
    this.people.set('loading');
    setTimeout(() => this.people.setSuccess([]), 2000);
  }

  protected loadError(): void {
    this.people.set('loading');
    setTimeout(() => this.people.setError('Network timeout — server unreachable'), 2000);
  }

  protected refreshPeople(): void {
    this.people.set('refreshing');
    setTimeout(() => this.people.setSuccess(['Alice', 'Bob', 'Charlie', 'Diana']), 2000);
  }

  protected loadProduct(): void {
    this.product.set('loading');
    setTimeout(() => this.product.setSuccess({ name: 'Widget Pro', price: 49.99 }), 1500);
  }

  protected loadNoProduct(): void {
    this.product.set('loading');
    setTimeout(() => this.product.setSuccess(null), 1500);
  }
  `,
  sections: [
    {
      title: 'Minimal — *cngxAsync',
      subtitle: 'One line. Defaults for skeleton, empty, and error. The host element IS the content — no wrapper.',
      imports: ['CngxAsync'],
      template: `
  <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px">
    <button (click)="loadPeople()" class="chip">Load People</button>
    <button (click)="loadEmpty()" class="chip">Load Empty</button>
    <button (click)="loadError()" class="chip">Load Error</button>
    <button (click)="people.reset()" class="chip">Reset</button>
  </div>

  <div class="event-grid" style="margin-bottom:16px">
    <div class="event-row">
      <span class="event-label">Status</span>
      <span class="event-value">{{ people.status() }}</span>
    </div>
  </div>

  <ul *cngxAsync="people; let data" style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:4px">
    @for (name of data; track name) {
      <li style="padding:8px 12px;background:var(--cngx-card-bg,#f8fafc);border-radius:4px">{{ name }}</li>
    }
  </ul>`,
    },
    {
      title: 'Full Control — cngx-async-container',
      subtitle: 'Four named templates for four states. Built-in refresh indicator bar. Click "Load" then "Refresh" to see the difference.',
      imports: ['CngxAsyncContainer', 'CngxAsyncSkeletonTpl', 'CngxAsyncContentTpl', 'CngxAsyncEmptyTpl', 'CngxAsyncErrorTpl'],
      template: `
  <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px">
    <button (click)="loadPeople()" class="chip">Load</button>
    <button (click)="loadEmpty()" class="chip">Empty</button>
    <button (click)="loadError()" class="chip">Error</button>
    <button (click)="refreshPeople()" class="chip" [disabled]="people.isFirstLoad()">Refresh</button>
    <button (click)="people.reset()" class="chip">Reset</button>
  </div>

  <cngx-async-container [state]="people" ariaLabel="People list">
    <ng-template cngxAsyncSkeleton>
      <div style="display:flex;flex-direction:column;gap:8px">
        @for (i of [1,2,3]; track i) {
          <div style="height:24px;background:var(--cngx-skeleton-bg,#e5e7eb);border-radius:4px"></div>
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
      <div style="text-align:center;padding:32px;color:var(--cngx-muted,#64748b)">
        <p style="font-size:1.25rem;margin:0 0 8px">No people found</p>
        <p style="margin:0">Try a different search or add a new person.</p>
      </div>
    </ng-template>

    <ng-template cngxAsyncError let-err>
      <div style="text-align:center;padding:24px;color:var(--cngx-alert-error-icon,#ef4444)">
        <p style="font-size:1.125rem;margin:0 0 8px">Failed to load</p>
        <p style="margin:0 0 12px;opacity:0.8">{{ err }}</p>
        <button (click)="loadPeople()" class="chip">Retry</button>
      </div>
    </ng-template>
  </cngx-async-container>`,
    },
    {
      title: 'Single Object (not a list)',
      subtitle: 'Works with any data type — not just arrays. Shows product details or "not found".',
      imports: ['CngxAsync'],
      template: `
  <div style="display:flex;gap:8px;margin-bottom:16px">
    <button (click)="loadProduct()" class="chip">Load Product</button>
    <button (click)="loadNoProduct()" class="chip">Load Not Found</button>
    <button (click)="product.reset()" class="chip">Reset</button>
  </div>

  <div *cngxAsync="product; let item" style="border:1px solid var(--cngx-border,#e2e8f0);border-radius:8px;padding:20px">
    @if (item) {
      <h3 style="margin:0 0 8px">{{ item.name }}</h3>
      <p style="margin:0;font-size:1.5rem;font-weight:600">\${{ item.price }}</p>
    } @else {
      <p style="margin:0;color:var(--cngx-muted,#64748b)">Product not found.</p>
    }
  </div>`,
    },
    {
      title: 'Refresh vs. First Load',
      subtitle: 'First load shows skeleton. Refresh keeps old content visible + shows a bar indicator at the top. The user never loses scroll context.',
      imports: ['CngxAsyncContainer', 'CngxAsyncSkeletonTpl', 'CngxAsyncContentTpl'],
      template: `
  <p style="margin:0 0 12px;font-size:0.875rem;color:var(--cngx-muted,#64748b)">
    1. Click "Load" to see the skeleton.<br>
    2. After data appears, click "Refresh" — old data stays, bar appears at top.<br>
    3. This is the key UX difference: refresh preserves context, first load does not.
  </p>

  <div style="display:flex;gap:8px;margin-bottom:16px">
    <button (click)="loadPeople()" class="chip">{{ people.isFirstLoad() ? 'Load' : 'Re-Load (resets)' }}</button>
    <button (click)="refreshPeople()" class="chip" [disabled]="people.isFirstLoad()">Refresh</button>
    <button (click)="people.reset()" class="chip">Reset</button>
  </div>

  <div class="event-grid" style="margin-bottom:12px">
    <div class="event-row">
      <span class="event-label">Status</span>
      <span class="event-value">{{ people.status() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">isFirstLoad</span>
      <span class="event-value">{{ people.isFirstLoad() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">isRefreshing</span>
      <span class="event-value">{{ people.isRefreshing() }}</span>
    </div>
  </div>

  <cngx-async-container [state]="people" ariaLabel="People (refresh demo)" style="position:relative">
    <ng-template cngxAsyncSkeleton>
      <div style="display:flex;flex-direction:column;gap:8px">
        @for (i of [1,2,3]; track i) {
          <div style="height:24px;background:var(--cngx-skeleton-bg,#e5e7eb);border-radius:4px"></div>
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
  </cngx-async-container>`,
    },
  ],
};
