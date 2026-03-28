import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Async Container',
  navLabel: 'Async Container',
  navCategory: 'feedback',
  description: 'Coordinates skeleton, content, empty, error, refresh, and toast from a single CngxAsyncState. Three factory functions, two template APIs, composable with other feedback atoms.',
  apiComponents: ['CngxAsyncContainer', 'CngxAsync'],
  moduleImports: [
    "import { CngxAsyncContainer, CngxAsyncSkeletonTpl, CngxAsyncContentTpl, CngxAsyncEmptyTpl, CngxAsyncErrorTpl, CngxLoadingOverlay } from '@cngx/ui/feedback';",
    "import { CngxAsync, createManualState, createAsyncState, injectAsyncState } from '@cngx/common/data';",
  ],
  setup: `
  // ── Simple *cngxAsync demos ──
  protected readonly simple = createManualState<string[]>();

  protected loadSimple(): void {
    this.simple.set('loading');
    setTimeout(() => this.simple.setSuccess(['Alice', 'Bob', 'Charlie']), 2000);
  }
  protected emptySimple(): void {
    this.simple.set('loading');
    setTimeout(() => this.simple.setSuccess([]), 2000);
  }
  protected errorSimple(): void {
    this.simple.set('loading');
    setTimeout(() => this.simple.setError('Network error'), 2000);
  }

  // ── Section: injectAsyncState (reactive query) ──
  private readonly filterText = signal('');
  protected readonly filter = this.filterText.asReadonly();

  // Simulates an HTTP GET that re-fires when filter changes
  protected readonly people = injectAsyncState<string[]>(() => {
    const f = this.filter();
    return new Promise<string[]>(resolve => {
      setTimeout(() => {
        const all = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'];
        resolve(f ? all.filter(n => n.toLowerCase().includes(f.toLowerCase())) : all);
      }, 1500);
    });
  });

  protected setFilter(value: string): void {
    this.filterText.set(value);
  }

  // ── Section 2: createAsyncState (mutation) ──
  protected readonly saveAction = createAsyncState<string>();

  protected handleSave(): void {
    void this.saveAction.execute(() =>
      new Promise<string>((resolve, reject) => {
        setTimeout(() => Math.random() > 0.3 ? resolve('OK') : reject(new Error('Server error')), 1500);
      })
    );
  }

  // ── Section 3: createManualState (full control) ──
  protected readonly manual = createManualState<string[]>();

  protected loadManual(): void {
    this.manual.set('loading');
    setTimeout(() => this.manual.setSuccess(['Alpha', 'Beta', 'Gamma']), 2000);
  }
  protected refreshManual(): void {
    this.manual.set('refreshing');
    setTimeout(() => this.manual.setSuccess(['Alpha', 'Beta', 'Gamma', 'Delta']), 2000);
  }
  protected errorManual(): void {
    this.manual.set('loading');
    setTimeout(() => this.manual.setError('Connection refused'), 2000);
  }
  protected emptyManual(): void {
    this.manual.set('loading');
    setTimeout(() => this.manual.setSuccess([]), 2000);
  }

  // ── Section 4: Composition (overlay + container + toast) ──
  protected readonly composed = createManualState<string[]>();

  protected loadComposed(): void {
    this.composed.set('loading');
    setTimeout(() => this.composed.setSuccess(['Item A', 'Item B', 'Item C']), 2000);
  }
  protected refreshComposed(): void {
    this.composed.set('refreshing');
    setTimeout(() => this.composed.setSuccess(['Item A', 'Item B', 'Item C', 'Item D']), 4000);
  }
  protected errorComposed(): void {
    this.composed.set('loading');
    setTimeout(() => this.composed.setError('Timeout'), 2000);
  }
  `,
  sections: [
    {
      title: '*cngxAsync — One Line',
      subtitle: 'The simplest usage. One structural directive, no templates, no configuration. Content appears when data arrives.',
      imports: ['CngxAsync'],
      template: `
  <div style="display:flex;gap:8px;margin-bottom:16px">
    <button (click)="loadSimple()" class="chip">Load</button>
    <button (click)="emptySimple()" class="chip">Empty</button>
    <button (click)="errorSimple()" class="chip">Error</button>
    <button (click)="simple.reset()" class="chip">Reset</button>
    <span style="color:var(--cngx-muted,#64748b);font-size:0.875rem;align-self:center">Status: {{ simple.status() }}</span>
  </div>

  <ul *cngxAsync="simple; let data" style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:4px">
    @for (name of data; track name) {
      <li style="padding:8px 12px;background:var(--cngx-card-bg,#f8fafc);border-radius:4px">{{ name }}</li>
    }
  </ul>`,
    },
    {
      title: '*cngxAsync — With Custom Templates',
      subtitle: 'Pass skeleton, empty, and error templates via microsyntax. Each keyword becomes an input: <code>skeleton:</code>, <code>empty:</code>, <code>error:</code>.',
      imports: ['CngxAsync'],
      template: `
  <div style="display:flex;gap:8px;margin-bottom:16px">
    <button (click)="loadSimple()" class="chip">Load</button>
    <button (click)="emptySimple()" class="chip">Empty</button>
    <button (click)="errorSimple()" class="chip">Error</button>
    <button (click)="simple.reset()" class="chip">Reset</button>
  </div>

  <ul *cngxAsync="simple; let data; skeleton: skelTpl; empty: emptyTpl; error: errTpl"
    style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:4px">
    @for (name of data; track name) {
      <li style="padding:8px 12px;background:var(--cngx-card-bg,#f8fafc);border-radius:4px">{{ name }}</li>
    }
  </ul>

  <ng-template #skelTpl>
    <div style="display:flex;flex-direction:column;gap:8px">
      @for (i of [1,2,3]; track i) {
        <div style="height:24px;background:var(--cngx-skeleton-bg,#e5e7eb);border-radius:4px"></div>
      }
    </div>
  </ng-template>

  <ng-template #emptyTpl>
    <p style="text-align:center;padding:24px;color:var(--cngx-muted,#64748b);margin:0">No results found.</p>
  </ng-template>

  <ng-template #errTpl let-err>
    <p style="text-align:center;padding:24px;color:var(--cngx-alert-error-icon,#ef4444);margin:0">{{ err }}</p>
  </ng-template>`,
    },
    {
      title: 'injectAsyncState — Reactive Query',
      subtitle: 'Auto-loads when signal dependencies change. Type in the filter — the query re-fires after 50ms debounce. Watch the status transitions: <code>loading → success</code> on first load, <code>refreshing → success</code> on filter change (old data stays visible).',
      imports: ['CngxAsyncContainer', 'CngxAsyncSkeletonTpl', 'CngxAsyncContentTpl', 'CngxAsyncEmptyTpl'],
      template: `
  <div style="display:flex;gap:12px;margin-bottom:16px;align-items:center">
    <input placeholder="Filter people..." [value]="filter()"
      (input)="setFilter($any($event.target).value)"
      style="padding:8px 12px;border:1px solid var(--cngx-border,#ddd);border-radius:6px;width:240px" />
    <button (click)="people.refresh()" class="chip">Refresh</button>
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
    <div class="event-row">
      <span class="event-label">Filter</span>
      <span class="event-value">{{ filter() || '(none)' }}</span>
    </div>
  </div>

  <cngx-async-container [state]="people" ariaLabel="People"
    toastSuccess="People loaded" toastError="Failed to load">

    <ng-template cngxAsyncSkeleton>
      <div style="display:flex;flex-direction:column;gap:8px">
        @for (i of [1,2,3,4,5]; track i) {
          <div style="height:24px;background:var(--cngx-skeleton-bg,#e5e7eb);border-radius:4px"></div>
        }
      </div>
    </ng-template>

    <ng-template cngxAsyncContent let-data>
      <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:4px">
        @for (name of data; track name) {
          <li style="padding:8px 12px;background:var(--cngx-card-bg,#f8fafc);border-radius:4px">{{ name }}</li>
        } @empty {
          <li style="padding:16px;color:var(--cngx-muted,#64748b);text-align:center">No matches for "{{ filter() }}"</li>
        }
      </ul>
    </ng-template>

    <ng-template cngxAsyncEmpty>
      <div style="text-align:center;padding:24px;color:var(--cngx-muted,#64748b)">
        No matches for "{{ filter() }}"
      </div>
    </ng-template>
  </cngx-async-container>`,
    },
    {
      title: 'createAsyncState — Mutation',
      subtitle: 'For POST/PUT/DELETE. Uses <code>execute(fn)</code> which sets status to <code>pending</code>. 70% chance of success, 30% error.',
      imports: ['CngxAsync'],
      template: `
  <div style="display:flex;gap:12px;align-items:center;margin-bottom:16px">
    <button (click)="handleSave()" class="chip" [disabled]="saveAction.isPending()">
      {{ saveAction.isPending() ? 'Saving...' : 'Save (70% success)' }}
    </button>
    <button (click)="saveAction.reset()" class="chip">Reset</button>
  </div>

  <div class="event-grid">
    <div class="event-row">
      <span class="event-label">Status</span>
      <span class="event-value">{{ saveAction.status() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">isPending</span>
      <span class="event-value">{{ saveAction.isPending() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Data</span>
      <span class="event-value">{{ saveAction.data() ?? '—' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Error</span>
      <span class="event-value">{{ saveAction.error() ?? '—' }}</span>
    </div>
  </div>`,
    },
    {
      title: 'cngx-async-container — Full Control + Toast',
      subtitle: 'Four templates, built-in refresh bar, integrated toast on success/error. Uses <code>createManualState</code> for demo control.',
      imports: ['CngxAsyncContainer', 'CngxAsyncSkeletonTpl', 'CngxAsyncContentTpl', 'CngxAsyncEmptyTpl', 'CngxAsyncErrorTpl'],
      template: `
  <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px">
    <button (click)="loadManual()" class="chip">Load</button>
    <button (click)="emptyManual()" class="chip">Empty</button>
    <button (click)="errorManual()" class="chip">Error</button>
    <button (click)="refreshManual()" class="chip" [disabled]="manual.isFirstLoad()">Refresh</button>
    <button (click)="manual.reset()" class="chip">Reset</button>
  </div>

  <div class="event-grid" style="margin-bottom:12px">
    <div class="event-row">
      <span class="event-label">Status</span>
      <span class="event-value">{{ manual.status() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">isFirstLoad</span>
      <span class="event-value">{{ manual.isFirstLoad() }}</span>
    </div>
  </div>

  <cngx-async-container [state]="manual" ariaLabel="Items"
    toastSuccess="Loaded successfully" toastError="Failed to load">

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
        <p style="margin:0 0 8px;font-size:1.125rem">No items</p>
        <p style="margin:0">Try loading with different parameters.</p>
      </div>
    </ng-template>

    <ng-template cngxAsyncError let-err>
      <div style="text-align:center;padding:24px;color:var(--cngx-alert-error-icon,#ef4444)">
        <p style="margin:0 0 8px;font-size:1.125rem">Load failed</p>
        <p style="margin:0 0 12px;opacity:0.8">{{ err }}</p>
        <button (click)="loadManual()" class="chip">Retry</button>
      </div>
    </ng-template>
  </cngx-async-container>`,
    },
    {
      title: 'Composition — Overlay + Container + Toast',
      subtitle: 'Stack atoms freely. Loading overlay wraps the container; toasts fire via the container\'s built-in inputs. Each atom does one thing.',
      imports: ['CngxAsyncContainer', 'CngxAsyncSkeletonTpl', 'CngxAsyncContentTpl', 'CngxLoadingOverlay'],
      template: `
  <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px">
    <button (click)="loadComposed()" class="chip">Load</button>
    <button (click)="refreshComposed()" class="chip" [disabled]="composed.isFirstLoad()">Refresh (with overlay)</button>
    <button (click)="errorComposed()" class="chip">Error</button>
    <button (click)="composed.reset()" class="chip">Reset</button>
  </div>

  <cngx-loading-overlay [loading]="composed.isRefreshing()" label="Refreshing data">
    <cngx-async-container [state]="composed" ariaLabel="Composed demo"
      toastSuccess="Data loaded" toastError="Load failed">

      <ng-template cngxAsyncSkeleton>
        <div style="display:flex;flex-direction:column;gap:8px">
          @for (i of [1,2,3]; track i) {
            <div style="height:32px;background:var(--cngx-skeleton-bg,#e5e7eb);border-radius:6px"></div>
          }
        </div>
      </ng-template>

      <ng-template cngxAsyncContent let-data>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px">
          @for (item of data; track item) {
            <div style="padding:16px;background:var(--cngx-card-bg,#f8fafc);border-radius:6px;text-align:center">
              {{ item }}
            </div>
          }
        </div>
      </ng-template>
    </cngx-async-container>
  </cngx-loading-overlay>`,
    },
  ],
};
