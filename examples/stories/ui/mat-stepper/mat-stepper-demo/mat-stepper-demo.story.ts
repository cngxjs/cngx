import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Mat-Stepper — async commitAction',
  navLabel: 'Async commit',
  navCategory: 'mat-stepper',
  description:
    '<code>&lt;cngx-mat-stepper&gt;</code> wraps Material\'s <code>&lt;mat-stepper&gt;</code> while sharing the same <code>CngxStepperPresenter</code> brain as <code>&lt;cngx-stepper&gt;</code>. Material consumers gain commit-action lifecycle, router sync, and error aggregation for free. Toggle <code>[commitMode]</code> + <code>simulate error</code> to exercise the four quadrants — the gate works identically against Material\'s own state machine.',
  apiComponents: ['CngxMatStepper', 'CngxStepperPresenter', 'CngxStep', 'CngxStepContent'],
  moduleImports: [
    "import { Observable } from 'rxjs';",
    "import { CngxStep, CngxStepContent, type CngxStepperCommitAction } from '@cngx/common/stepper';",
    "import { CngxMatStepper } from '@cngx/ui/mat-stepper';",
    "import { MatStepperModule } from '@angular/material/stepper';",
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
      title: 'Material wizard with the cngx commit lifecycle',
      subtitle:
        'Same brain, Material skin. Pessimistic mode keeps Material on the origin step until the action resolves; optimistic advances immediately and rolls back on rejection.',
      imports: ['CngxMatStepper', 'CngxStep', 'CngxStepContent'],
      template: `
  <div role="group" aria-label="Commit mode" class="event-row" style="gap:8px;align-items:center;margin-bottom:8px;flex-wrap:wrap">
    <button type="button" class="chip"
            [class.chip--active]="mode() === 'optimistic'"
            [attr.aria-pressed]="mode() === 'optimistic'"
            (click)="mode.set('optimistic')">optimistic</button>
    <button type="button" class="chip"
            [class.chip--active]="mode() === 'pessimistic'"
            [attr.aria-pressed]="mode() === 'pessimistic'"
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
  <cngx-mat-stepper
    [(activeStepIndex)]="active"
    [commitAction]="commitAction"
    [commitMode]="mode()"
    aria-label="Material async wizard"
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
  </cngx-mat-stepper>
  <div class="event-grid" style="margin-top:var(--demo-grid-gap, 12px)">
    <div class="event-row"><span class="event-label">Active step</span><span class="event-value">{{ active() }}</span></div>
  </div>`,
    },
    {
      title: 'Material indicator override via <ng-template matStepperIcon>',
      subtitle:
        'Project Material\'s native <code>&lt;ng-template matStepperIcon="<state>"&gt;</code> directly inside <code>&lt;cngx-mat-stepper&gt;</code> — the wrapper forwards the templates into <code>MatStepper._iconOverrides</code> so consumers reach the indicator chrome through Material\'s own customisation API. The cngx Phase-3 <code>*cngxStepIndicator</code> slot is intentionally CNGX-skin-only; on the Material variant Material owns the indicator template, and the matStepperIcon path is the proper override surface (closes <code>stepper-accepted-debt §4</code>). Toggle "advance" to walk through "number" → "edit" → "done" states and see the override fire on each.',
      imports: [
        'CngxMatStepper',
        'CngxStep',
        'CngxStepContent',
        'MatStepperModule',
      ],
      template: `
  <div role="group" aria-label="Override controls" class="event-row" style="gap:8px;align-items:center;margin-bottom:8px;flex-wrap:wrap">
    <button type="button" class="chip" (click)="active.set(((active() + 1) % 3))">advance</button>
  </div>
  <cngx-mat-stepper [(activeStepIndex)]="active" aria-label="Material wizard with custom icons">
    <ng-template matStepperIcon="number" let-index="index">
      <span aria-hidden="true" style="font-weight:600">★{{ index + 1 }}</span>
    </ng-template>
    <ng-template matStepperIcon="edit">
      <span aria-hidden="true">✎</span>
    </ng-template>
    <ng-template matStepperIcon="done">
      <span aria-hidden="true">✔</span>
    </ng-template>
    <div cngxStep label="One">
      <ng-template cngxStepContent><p>Step one body.</p></ng-template>
    </div>
    <div cngxStep label="Two">
      <ng-template cngxStepContent><p>Step two body.</p></ng-template>
    </div>
    <div cngxStep label="Three">
      <ng-template cngxStepContent><p>Step three body.</p></ng-template>
    </div>
  </cngx-mat-stepper>`,
    },
  ],
};
