import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Mat-tabs — instrumentation directive',
  navLabel: 'Instrumentation',
  navCategory: 'mat-tabs',
  description:
    'Add <code>cngxMatTabs</code> to an existing <code>&lt;mat-tab-group&gt;</code> and the cngx commit-action lifecycle, the <code>CNGX_STATEFUL</code> producer, and the bridge directive composition (<code>&lt;cngx-toast-on /&gt;</code>, <code>&lt;cngx-banner-on /&gt;</code>) light up — without rewriting your template. One attribute upgrade. Identical commit semantics to <code>&lt;cngx-tab-group&gt;</code>: <code>[commitMode]="optimistic"</code> (default) advances Material immediately and rolls back on rejection; <code>[commitMode]="pessimistic"</code> keeps Material on the origin until the action resolves. Rapid consecutive picks supersede any in-flight commit.',
  apiComponents: ['CngxMatTabs', 'CngxToastOn', 'CngxBannerOn'],
  moduleImports: [
    "import { Observable } from 'rxjs';",
    "import { MatTabsModule } from '@angular/material/tabs';",
    "import { type CngxTabsCommitAction } from '@cngx/common/tabs';",
    "import { CngxMatTabs } from '@cngx/ui/mat-tabs';",
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
      title: 'Vanilla <mat-tab-group> upgraded by adding cngxMatTabs',
      subtitle:
        'The <code>&lt;mat-tab-group&gt;</code> stays unchanged — <code>cngxMatTabs</code> is the only addition. The commit lifecycle, the <code>CNGX_STATEFUL</code> producer, and the toast + banner bridges work identically to <code>&lt;cngx-tab-group&gt;</code>. Toggle the mode and "simulate error" to exercise the four quadrants.',
      imports: ['MatTabsModule', 'CngxMatTabs', 'CngxToastOn', 'CngxBannerOn'],
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
  <mat-tab-group
    cngxMatTabs
    [(activeIndex)]="active"
    [commitAction]="commitAction"
    [commitMode]="mode()"
    cngxToastOn
    [toastError]="'Tab transition failed'"
    cngxBannerOn
    bannerId="mat-tabs:commit-error"
    [bannerError]="'Tab transition refused by the server.'"
    aria-label="Async tab navigation"
  >
    <mat-tab label="Profile">
      <p>Profile content.</p>
    </mat-tab>
    <mat-tab label="Account">
      <p>Account content.</p>
    </mat-tab>
    <mat-tab label="Notifications">
      <p>Notification preferences.</p>
    </mat-tab>
  </mat-tab-group>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Active tab</span><span class="event-value">{{ active() }}</span></div>
  </div>`,
    },
  ],
};
