import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepper: pessimistic and optimistic commits with bridge directives',
  subtitle: 'Toggle the mode and pick "accept", "simulate error" or "simulate refusal" to compare a failed and a refused step change. The toast and banner bridges fire on a failure without any explicit <code>[state]</code> binding - they read <code>CNGX_STATEFUL</code> from the presenter via <code>{ host: true }</code>. A refusal stays out of the bridges.',
  description: 'Async commit gating across both modes. Pessimistic keeps the user on the origin step until <code>[commitAction]</code> resolves; optimistic advances eagerly and rolls back when the commit does not land. A throw or an erroring observable is a failure: the commit state goes to <code>error</code> and the bridges report it. Answering <code>false</code> is a refusal: the step rolls back, the stepper announces it, <code>lastOutcome()</code> reads <code>refused</code> and the commit state goes back to <code>idle</code> with its data, so no bridge fires. To toast a refusal, the action shows its own warning toast before it answers <code>false</code>; the visible reason below the stepper is driven by <code>lastOutcome()</code>.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['async-state', 'composition', 'error-handling'],
  apiComponents: [
    'CngxStepper',
    'CngxStepperPresenter',
    'CngxStep',
    'CngxStepContent',
  ],
  moduleImports: [
    'import { Observable } from \'rxjs\';',
    'import { CngxStep, CngxStepContent, type CngxStepperCommitAction } from \'@cngx/common/stepper\';',
    'import { CngxStepper } from \'@cngx/ui/stepper\';',
    'import { CngxToaster, CngxToastOn, CngxBannerOn } from \'@cngx/ui/feedback\';',
  ],
  imports: ['CngxStepper', 'CngxStep', 'CngxStepContent', 'CngxToastOn', 'CngxBannerOn'],
  setup: `private readonly toaster = inject(CngxToaster);
  protected readonly active = signal(0);
  protected readonly mode = signal<'optimistic' | 'pessimistic'>('pessimistic');
  protected readonly outcome = signal<'accept' | 'error' | 'refusal'>('accept');
  protected readonly latencyMs = signal(800);
  protected readonly commitAction: CngxStepperCommitAction = (from, to) => {
    const ms = this.latencyMs();
    const outcome = this.outcome();
    return new Observable<boolean>((sub) => {
      const handle = setTimeout(() => {
        if (outcome === 'error') {
          sub.error(new Error('Could not save step ' + from + ' -> ' + to));
          return;
        }
        if (outcome === 'refusal') {
          // A refusal is the action's own decision: it toasts its reason
          // itself, then answers false. The bridges stay silent.
          this.toaster.show({ message: 'Save the profile first.', severity: 'warning' });
          sub.next(false);
          sub.complete();
          return;
        }
        sub.next(true);
        sub.complete();
      }, ms);
      return () => clearTimeout(handle);
    });
  };`,
  template: `  <cngx-stepper
    #wizard="cngxStepper"
    [(activeStepIndex)]="active"
    [commitAction]="commitAction"
    [commitMode]="mode()"
    cngxToastOn
    [toastSuccess]="'Step saved'"
    [toastError]="'Step transition failed'"
    cngxBannerOn
    bannerId="stepper:commit-error"
    [bannerError]="'The server could not save the step.'"
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
  @if (wizard.presenter.lastFailedIndex() !== undefined && wizard.presenter.lastOutcome()?.kind === 'refused') {
    <p>Not allowed yet: save the profile first.</p>
  }`,
  templateChrome: `<div class="event-row" style="gap:8px;align-items:center;margin-bottom:8px;flex-wrap:wrap">
    <button type="button" class="chip"
            [class.demo-chip-toggle--active]="mode() === 'optimistic'"
            (click)="mode.set('optimistic')">optimistic</button>
    <button type="button" class="chip"
            [class.demo-chip-toggle--active]="mode() === 'pessimistic'"
            (click)="mode.set('pessimistic')">pessimistic</button>
    <div role="radiogroup" aria-label="Commit outcome" style="display:inline-flex;gap:12px;margin-inline-start:12px">
      <label style="display:inline-flex;gap:4px;align-items:center">
        <input type="radio" name="cngx-stepper-commit-outcome"
               [checked]="outcome() === 'accept'"
               (change)="outcome.set('accept')" />
        accept
      </label>
      <label style="display:inline-flex;gap:4px;align-items:center">
        <input type="radio" name="cngx-stepper-commit-outcome"
               [checked]="outcome() === 'error'"
               (change)="outcome.set('error')" />
        simulate error
      </label>
      <label style="display:inline-flex;gap:4px;align-items:center">
        <input type="radio" name="cngx-stepper-commit-outcome"
               [checked]="outcome() === 'refusal'"
               (change)="outcome.set('refusal')" />
        simulate refusal
      </label>
    </div>
    <label style="margin-inline-start:12px">
      latency
      <input type="range" min="100" max="2000" step="100"
             [value]="latencyMs()"
             (input)="latencyMs.set(+$any($event.target).value)" />
      {{ latencyMs() }}ms
    </label>
  </div>
<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Active step</span><span class="event-value">{{ active() }}</span></div>
  </div>`,
};
