import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAsyncBoundary: content renders when every source settles',
  subtitle:
    'Three keyed <code>createManualState</code> sources feed one <code>[cngxAsyncBoundary]</code>. The aggregate is a real <code>CngxAsyncState</code>, so <code>*cngxAsync</code> renders it like any single source - no new rendering code.',
  description:
    'The boundary derives one aggregate state from N sources via <code>computed()</code>. The content template renders only on the aggregate <code>content</code> view, where every source has reached success, and receives the per-source data in input order.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['async-state', 'composition'],
  apiComponents: ['CngxAsyncBoundary', 'CngxAsync'],
  moduleImports: [
    "import { createManualState, CngxAsync, CngxAsyncBoundary, type AggregateSource } from '@cngx/common/data';",
  ],
  imports: ['CngxAsyncBoundary', 'CngxAsync'],
  setup: `protected readonly user = createManualState<string>();
  protected readonly permissions = createManualState<string[]>();
  protected readonly flags = createManualState<string>();

  protected readonly sources = signal<readonly AggregateSource[]>([
    { key: 'user', label: 'User', state: this.user },
    { key: 'permissions', label: 'Permissions', state: this.permissions },
    { key: 'flags', label: 'Feature flags', state: this.flags },
  ]);`,
  template: `  <div [cngxAsyncBoundary]="sources()" #b="cngxAsyncBoundary" [attr.aria-busy]="b.state.isBusy()">
    <ul
      *cngxAsync="b.state; let data; skeleton: skeletonTpl"
      class="demo-stack"
      aria-label="Account bootstrap"
      style="list-style:none;padding:0;margin:0;gap:6px">
      <li class="demo-card-tile">User: {{ data[0] }}</li>
      <li class="demo-card-tile">Permissions: {{ data[1] }}</li>
      <li class="demo-card-tile">Feature flags: {{ data[2] }}</li>
    </ul>

    <ng-template #skeletonTpl>
      <div class="demo-stack" style="display:flex;flex-direction:column;gap:8px">
        @for (i of [1,2,3]; track i) {
          <div class="demo-skeleton-bar" style="height:20px"></div>
        }
      </div>
    </ng-template>
  </div>`,
  setupChrome: `constructor() {
    this.seed();
  }
  private seed(): void {
    this.user.setSuccess('Ada Lovelace');
    this.permissions.setSuccess(['read', 'write', 'deploy']);
    this.flags.setSuccess('beta-dashboard');
  }
  protected reloadAll(): void {
    this.user.set('loading');
    this.permissions.set('loading');
    this.flags.set('loading');
    setTimeout(() => this.seed(), 1200);
  }`,
  templateChromeBefore: `<div class="button-row" style="margin-bottom:16px">
    <button type="button" class="chip" (click)="reloadAll()">Reload all (1.2s)</button>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Aggregate status</span>
      <span class="event-value">{{ b.state.status() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">isFirstLoad</span>
      <span class="event-value">{{ b.state.isFirstLoad() }}</span>
    </div>
  </div>`,
};
