import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Tabs — async commitAction',
  navLabel: 'Commit action',
  navCategory: 'tabs',
  description:
    'Bind <code>[commitAction]</code> to gate every tab transition through an async write. <code>[commitMode]="optimistic"</code> (default — tab change is a navigation, not a save) advances immediately and rolls back on rejection. <code>[commitMode]="pessimistic"</code> keeps the user on the origin tab until the action resolves and renders <code>aria-busy="true"</code> + a spinner on the target tab. Rapid consecutive picks supersede any in-flight commit. <code>&lt;cngx-toast-on /&gt;</code> + <code>&lt;cngx-banner-on /&gt;</code> compose against the presenter\'s <code>CNGX_STATEFUL</code> producer with zero <code>[state]</code> wiring — proving the bridge fallback contract.',
  apiComponents: [
    'CngxTabGroup',
    'CngxTabGroupPresenter',
    'CngxTab',
    'CngxTabContent',
  ],
  moduleImports: [
    "import { Observable } from 'rxjs';",
    "import { CngxTab, CngxTabContent, type CngxTabsCommitAction } from '@cngx/common/tabs';",
    "import { CngxTabGroup } from '@cngx/ui/tabs';",
    "import { CngxToastOn, CngxBannerOn } from '@cngx/ui/feedback';",
  ],
  setup: `
  protected readonly active = signal(0);
  protected readonly mode = signal<'optimistic' | 'pessimistic'>('optimistic');
  protected readonly shouldFail = signal(false);
  protected readonly latencyMs = signal(600);

  protected readonly commitAction: CngxTabsCommitAction = (from, to) => {
    const ms = this.latencyMs();
    const fail = this.shouldFail();
    return new Observable<boolean>((sub) => {
      const handle = setTimeout(() => {
        if (fail) {
          sub.error(new Error('Server refused tab ' + from + ' → ' + to));
        } else {
          sub.next(true);
          sub.complete();
        }
      }, ms);
      return () => clearTimeout(handle);
    });
  };
  `,
  sections: [
    {
      title: 'Optimistic + pessimistic commits with bridge directives',
      subtitle:
        'Toggle the mode and "simulate error" to exercise the four quadrants. The toast + banner bridges fire on commit failure without any explicit <code>[state]</code> binding — they read <code>CNGX_STATEFUL</code> from the presenter via <code>{ host: true }</code>. Rapid consecutive clicks supersede in-flight commits — the second click cancels the first.',
      imports: [
        'CngxTabGroup',
        'CngxTab',
        'CngxTabContent',
        'CngxToastOn',
        'CngxBannerOn',
      ],
      template: `
  <div class="event-row" style="gap:8px;align-items:center;margin-bottom:8px;flex-wrap:wrap">
    <button type="button" class="chip"
            [style.background]="mode() === 'optimistic' ? '#c8e6c9' : ''"
            (click)="mode.set('optimistic')">optimistic</button>
    <button type="button" class="chip"
            [style.background]="mode() === 'pessimistic' ? '#c8e6c9' : ''"
            (click)="mode.set('pessimistic')">pessimistic</button>
    <label style="margin-inline-start:12px">
      <input type="checkbox"
             [checked]="shouldFail()"
             (change)="shouldFail.set($any($event.target).checked)" />
      simulate error
    </label>
    <label style="margin-inline-start:12px">
      latency
      <input type="range" min="100" max="2000" step="100"
             [value]="latencyMs()"
             (input)="latencyMs.set(+$any($event.target).value)" />
      {{ latencyMs() }}ms
    </label>
  </div>
  <cngx-tab-group
    [(activeIndex)]="active"
    [commitAction]="commitAction"
    [commitMode]="mode()"
    cngxToastOn
    [toastError]="'Tab transition failed'"
    cngxBannerOn
    bannerId="tabs:commit-error"
    [bannerError]="'Tab transition refused by the server.'"
    aria-label="Async tab navigation"
  >
    <div cngxTab [label]="'Profile'">
      <ng-template cngxTabContent><p>Profile content.</p></ng-template>
    </div>
    <div cngxTab [label]="'Account'">
      <ng-template cngxTabContent><p>Account content.</p></ng-template>
    </div>
    <div cngxTab [label]="'Notifications'">
      <ng-template cngxTabContent><p>Notification preferences.</p></ng-template>
    </div>
  </cngx-tab-group>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Active tab</span><span class="event-value">{{ active() }}</span></div>
  </div>`,
    },
  ],
};
