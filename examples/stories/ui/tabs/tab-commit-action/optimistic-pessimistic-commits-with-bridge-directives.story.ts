import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTabGroup: optimistic and pessimistic commits with bridge directives',
  subtitle: 'Toggle the mode and "simulate error" to exercise the four quadrants. The toast and banner bridges fire on commit failure without any explicit <code>[state]</code> binding - they read <code>CNGX_STATEFUL</code> from the presenter via <code>{ host: true }</code>. Rapid consecutive clicks supersede in-flight commits.',
  description: 'Tabs treat <code>[commitAction]</code> as a navigation guard. Optimistic flips the panel immediately and rolls back on rejection; pessimistic blocks until the action resolves. Toast and banner bridges compose by DI; <code>presenter.clearLastFailed()</code> wipes the persistent rejection icon programmatically.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['async-state', 'composition', 'error-handling'],
  apiComponents: [
    'CngxTabGroup',
    'CngxTabGroupPresenter',
    'CngxTab',
    'CngxTabContent',
    'CngxToastOn',
    'CngxBannerOn',
  ],
  moduleImports: [
    'import { Observable } from \'rxjs\';',
    'import { CngxTab, CngxTabContent, type CngxTabsCommitAction } from \'@cngx/common/tabs\';',
    'import { CngxTabGroup } from \'@cngx/ui/tabs\';',
    'import { CngxToastOn, CngxBannerOn } from \'@cngx/ui/feedback\';',
  ],
  imports: ['CngxTabGroup', 'CngxTab', 'CngxTabContent', 'CngxToastOn', 'CngxBannerOn'],
  setup: `protected readonly active = signal(0);
  protected readonly mode = signal<'optimistic' | 'pessimistic'>('optimistic');
  protected readonly shouldFail = signal(false);
  protected readonly latencyMs = signal(600);
  protected readonly commitAction: CngxTabsCommitAction = (from, to) => {
    const ms = this.latencyMs();
    const fail = this.shouldFail();
    return new Observable<boolean>((sub) => {
      const handle = setTimeout(() => {
        if (fail) {
          sub.error(new Error('Server refused tab ' + from + ' -> ' + to));
        } else {
          sub.next(true);
          sub.complete();
        }
      }, ms);
      return () => clearTimeout(handle);
    });
  };`,
  template: `  <cngx-tab-group
    #tg="cngxTabGroup"
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
  </cngx-tab-group>`,
  templateChrome: `<div class="event-row" style="gap:8px;align-items:center;margin-bottom:8px;flex-wrap:wrap">
    <button type="button" class="chip"
            [class.demo-chip-toggle--active]="mode() === 'optimistic'"
            (click)="mode.set('optimistic')">optimistic</button>
    <button type="button" class="chip"
            [class.demo-chip-toggle--active]="mode() === 'pessimistic'"
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
<div class="event-row" style="gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap">
    <button type="button" class="chip" (click)="tg.clearLastFailed()">
      Clear last failed
    </button>
    <span style="opacity:0.7;font-size:12px">
      programmatic dismissal - calls <code>presenter.clearLastFailed()</code>
    </span>
  </div>
<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Active tab</span><span class="event-value">{{ active() }}</span></div>
  </div>`,
};
