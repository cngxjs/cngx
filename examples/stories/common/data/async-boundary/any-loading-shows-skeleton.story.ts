import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAsyncBoundary: one loading source shows the aggregate skeleton',
  subtitle:
    'While any source is <code>loading</code> or <code>pending</code>, the combined status is <code>loading</code> and <code>*cngxAsync</code> shows one aggregate skeleton - the screen never renders a half-loaded state.',
  description:
    'The 5-step status rule puts loading above refreshing and success, so a single in-flight source holds the whole boundary in the skeleton view until every source settles. The skeleton belongs to the first load only: once every source has loaded, putting one back to <code>loading</code> keeps the content visible while the aggregate status reads <code>loading</code> and <code>aria-busy</code> is true.',
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
    this.user.setSuccess('Ada Lovelace');
    this.permissions.setSuccess(['read', 'write', 'deploy']);
    this.flags.set('loading');
  }
  protected resolveFlags(): void {
    this.flags.setSuccess('beta-dashboard');
  }
  protected reloadFlags(): void {
    this.flags.set('loading');
  }`,
  templateChromeBefore: `<div class="button-row" style="margin-bottom:16px">
    <button type="button" class="chip" (click)="resolveFlags()">Resolve the loading source</button>
    <button type="button" class="chip" (click)="reloadFlags()">Refresh the source (content stays)</button>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Aggregate status</span>
      <span class="event-value">{{ b.state.status() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Feature flags source</span>
      <span class="event-value">{{ flags.status() }}</span>
    </div>
  </div>`,
};
