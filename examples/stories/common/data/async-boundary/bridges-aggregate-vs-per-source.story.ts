import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAsyncBoundary: aggregate bridge vs per-source bridges',
  subtitle:
    'A bare <code>cngxToastOn</code> on the boundary host fires once on the combined status with zero <code>[state]</code> wiring - it reads <code>CNGX_STATEFUL</code> from the boundary. A <code>@for</code> over the leaf states each carries its own <code>[cngxBannerOn]</code>, so per-source feedback needs no new API.',
  description:
    'Two feedback channels, no conflict: the aggregate toast is the single transient "something failed", and each leaf banner attributes the specific source. Fail one source to see both fire; recover to see both clear.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['async-state', 'composition', 'integration'],
  apiComponents: ['CngxAsyncBoundary', 'CngxAsyncContainer', 'CngxToastOn', 'CngxBannerOn'],
  moduleImports: [
    "import { createManualState, CngxAsyncBoundary, type AggregateSource } from '@cngx/common/data';",
    "import { CngxAsyncContainer, CngxAsyncSkeletonTpl, CngxAsyncContentTpl, CngxToastOn, CngxBannerOn } from '@cngx/ui/feedback';",
  ],
  imports: [
    'CngxAsyncBoundary',
    'CngxAsyncContainer',
    'CngxAsyncSkeletonTpl',
    'CngxAsyncContentTpl',
    'CngxToastOn',
    'CngxBannerOn',
  ],
  setup: `protected readonly user = createManualState<string>();
  protected readonly permissions = createManualState<string[]>();
  protected readonly flags = createManualState<string>();

  protected readonly sources = signal<readonly AggregateSource[]>([
    { key: 'user', label: 'User', state: this.user },
    { key: 'permissions', label: 'Permissions', state: this.permissions },
    { key: 'flags', label: 'Feature flags', state: this.flags },
  ]);`,
  template: `  <div
    [cngxAsyncBoundary]="sources()"
    cngxToastOn
    [toastError]="'One or more resources failed to load'"
    #b="cngxAsyncBoundary">

    <cngx-async-container [state]="b.state" ariaLabel="Dashboard resources">
      <ng-template cngxAsyncSkeleton>
        <div class="demo-skeleton-bar" style="height:20px"></div>
      </ng-template>

      <ng-template cngxAsyncContent let-data>
        <ul class="demo-stack" style="list-style:none;padding:0;margin:0;gap:6px">
          <li class="demo-card-tile">User: {{ data[0] }}</li>
          <li class="demo-card-tile">Permissions: {{ data[1] }}</li>
          <li class="demo-card-tile">Feature flags: {{ data[2] }}</li>
        </ul>
      </ng-template>
    </cngx-async-container>

    @for (s of sources(); track s.key) {
      <span
        [cngxBannerOn]="s.state"
        [bannerId]="'async-boundary-leaf:' + s.key"
        [bannerError]="(s.label ?? s.key) + ' failed to load'"
        style="display:none"></span>
    }
  </div>`,
  setupChrome: `constructor() {
    this.recoverAll();
  }
  protected failPermissions(): void {
    this.permissions.setError('403 Forbidden');
  }
  protected failFlags(): void {
    this.flags.setError('503 Service Unavailable');
  }
  protected recoverAll(): void {
    this.user.setSuccess('Ada Lovelace');
    this.permissions.setSuccess(['read', 'write', 'deploy']);
    this.flags.setSuccess('beta-dashboard');
  }`,
  templateChromeBefore: `<div class="button-row" style="margin-bottom:16px">
    <button type="button" class="chip" (click)="failPermissions()">Fail Permissions</button>
    <button type="button" class="chip" (click)="failFlags()">Fail Feature flags</button>
    <button type="button" class="chip" (click)="recoverAll()">Recover all</button>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Aggregate status</span>
      <span class="event-value">{{ b.state.status() }}</span>
    </div>
  </div>`,
};
