import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAsyncBoundary: per-source error attribution',
  subtitle:
    'The keyed <code>failures()</code> list carries each error with its label, so the error slot can attribute failures across more than one feedback component - a <code>cngx-alert</code> per source plus a global banner via <code>cngx-banner-trigger</code>.',
  description:
    "The aggregate's own <code>error</code> stays the first error for the single-error toast/bridge path; <code>failures()</code> is the persistent per-source breakdown. Fail either source to see both surfaces label the failure from <code>f.label</code>.",
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['async-state', 'error-handling', 'composition'],
  references: [
    { label: 'WAI-ARIA APG - Alert', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/alert/' },
  ],
  apiComponents: ['CngxAsyncBoundary', 'CngxAsyncContainer', 'CngxAlert', 'CngxBannerTrigger'],
  moduleImports: [
    "import { createManualState, CngxAsyncBoundary, type AggregateSource } from '@cngx/common/data';",
    "import { CngxAsyncContainer, CngxAsyncSkeletonTpl, CngxAsyncContentTpl, CngxAsyncErrorTpl, CngxAlert, CngxBannerTrigger } from '@cngx/ui/feedback';",
  ],
  imports: [
    'CngxAsyncBoundary',
    'CngxAsyncContainer',
    'CngxAsyncSkeletonTpl',
    'CngxAsyncContentTpl',
    'CngxAsyncErrorTpl',
    'CngxAlert',
    'CngxBannerTrigger',
  ],
  setup: `protected readonly user = createManualState<string>();
  protected readonly permissions = createManualState<string[]>();
  protected readonly flags = createManualState<string>();

  protected readonly sources = signal<readonly AggregateSource[]>([
    { key: 'user', label: 'User', state: this.user },
    { key: 'permissions', label: 'Permissions', state: this.permissions },
    { key: 'flags', label: 'Feature flags', state: this.flags },
  ]);`,
  template: `  <div [cngxAsyncBoundary]="sources()" #b="cngxAsyncBoundary">
    <cngx-async-container [state]="b.state" ariaLabel="Account bootstrap">
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

      <ng-template cngxAsyncError>
        <div class="demo-stack" style="display:flex;flex-direction:column;gap:8px">
          @for (f of b.failures(); track f.key) {
            <cngx-alert severity="error" [title]="f.label ?? f.key">{{ f.error }}</cngx-alert>
            <cngx-banner-trigger
              [when]="true"
              [message]="(f.label ?? f.key) + ' failed to load'"
              [id]="'async-boundary:' + f.key"
              severity="error" />
          }
        </div>
      </ng-template>
    </cngx-async-container>
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
    <div class="event-row">
      <span class="event-label">failures()</span>
      <span class="event-value">{{ b.failures().length }}</span>
    </div>
  </div>`,
};
