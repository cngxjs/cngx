import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Stepper — async commitAction',
  navLabel: 'Commit action',
  navCategory: 'stepper',
  description:
    'Bind <code>[commitAction]</code> to gate every step transition through an async write. <code>[commitMode]="pessimistic"</code> (default) keeps the user on the origin step until the action resolves and renders <code>aria-busy="true"</code> + a spinner on the target step row. <code>[commitMode]="optimistic"</code> advances immediately and rolls back on rejection. Rapid consecutive picks supersede any in-flight commit. <code>&lt;cngx-toast-on /&gt;</code> + <code>&lt;cngx-banner-on /&gt;</code> compose against the presenter\'s <code>CNGX_STATEFUL</code> producer with zero <code>[state]</code> wiring — proving the bridge fallback contract.',
  apiComponents: ['CngxStepper'],
  moduleImports: [
    "import { Observable } from 'rxjs';",
    "import { CngxStep, CngxStepContent, type CngxStepperCommitAction } from '@cngx/common/stepper';",
    "import { CngxStepper } from '@cngx/ui/stepper';",
    "import { CngxToastOn, CngxBannerOn } from '@cngx/ui/feedback';",
  ],
  setup: `
  protected readonly active = signal(0);
  protected readonly mode = signal<'optimistic' | 'pessimistic'>('pessimistic');
  protected readonly shouldFail = signal(false);
  protected readonly latencyMs = signal(800);

  protected readonly commitAction: CngxStepperCommitAction = (from, to) => {
    const ms = this.latencyMs();
    const fail = this.shouldFail();
    return new Observable<boolean>((sub) => {
      const handle = setTimeout(() => {
        if (fail) {
          sub.error(new Error('Server refused step ' + from + ' → ' + to));
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
      title: 'Pessimistic + optimistic commits with bridge directives',
      subtitle:
        'Toggle the mode and "simulate error" to exercise the four quadrants. The toast + banner bridges fire on commit failure without any explicit <code>[state]</code> binding — they read <code>CNGX_STATEFUL</code> from the presenter via <code>{ host: true }</code>.',
      imports: [
        'CngxStepper',
        'CngxStep',
        'CngxStepContent',
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
  <cngx-stepper
    [(activeStepIndex)]="active"
    [commitAction]="commitAction"
    [commitMode]="mode()"
    cngxToastOn
    [toastError]="'Step transition failed'"
    cngxBannerOn
    bannerId="stepper:commit-error"
    [bannerError]="'Step transition refused by the server.'"
    aria-label="Async wizard"
  >
    <div cngxStep label="Customer">
      <ng-template cngxStepContent><p>Customer details.</p></ng-template>
    </div>
    <div cngxStep label="Payment">
      <ng-template cngxStepContent><p>Payment method.</p></ng-template>
    </div>
    <div cngxStep label="Confirm">
      <ng-template cngxStepContent><p>Review the order.</p></ng-template>
    </div>
  </cngx-stepper>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Active step</span><span class="event-value">{{ active() }}</span></div>
  </div>`,
    },
  ],
};
