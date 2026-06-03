import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepperFooter: async commit status on Continue',
  subtitle:
    'When the stepper carries a <code>[commitAction]</code>, advancing opens a commit window. The Continue button composes two atoms: <code>cngxStepperNext</code> gates and advances, while <code>[cngxAsyncStatus]</code> reflects the same <code>commitState</code> through the async state machine - <code>aria-busy</code> plus a pending / success / error label. Next never writes <code>aria-busy</code> itself; the reflector owns that.',
  description:
    'Toggle <strong>fail next commit</strong>, then press Continue. The action runs for ~900&nbsp;ms (button busy-disabled, "Saving..."); on success the stepper advances, on failure it stays put and the button shows "Retry".',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['async-state', 'a11y-pattern'],
  apiComponents: ['CngxStepperNext', 'CngxAsyncStatus'],
  moduleImports: [
    "import { CngxStep, CngxStepContent, CngxStepperPrevious, CngxStepperNext } from '@cngx/common/stepper';",
    "import { CngxAsyncStatus } from '@cngx/common/interactive';",
    "import { CngxStepper, CngxStepperFooter, CngxStepperFooterStart, CngxStepperFooterEnd } from '@cngx/ui/stepper';",
  ],
  imports: [
    'CngxStepper',
    'CngxStep',
    'CngxStepContent',
    'CngxAsyncStatus',
    'CngxStepperFooter',
    'CngxStepperFooterStart',
    'CngxStepperFooterEnd',
    'CngxStepperPrevious',
    'CngxStepperNext',
  ],
  setup: `protected readonly active = signal(0);
  protected readonly commitAction = (): Promise<boolean> =>
    new Promise((resolve, reject) =>
      setTimeout(() => (this.failNext() ? reject(new Error('Commit failed')) : resolve(true)), 900),
    );`,
  setupChrome: `  protected readonly failNext = signal(false);`,
  template: `  <cngx-stepper
    #s="cngxStepper"
    [(activeStepIndex)]="active"
    [commitAction]="commitAction"
    commitMode="pessimistic"
    aria-label="Checkout"
  >
    <div cngxStep label="Cart">
      <ng-template cngxStepContent><p>Review your cart.</p></ng-template>
    </div>
    <div cngxStep label="Shipping">
      <ng-template cngxStepContent><p>Enter the delivery address.</p></ng-template>
    </div>
    <div cngxStep label="Payment">
      <ng-template cngxStepContent><p>Provide payment details.</p></ng-template>
    </div>

    <cngx-stepper-footer>
      <button type="button" class="chip" cngxStepperFooterStart cngxStepperPrevious>Back</button>
      <button
        type="button"
        class="chip"
        cngxStepperFooterEnd
        cngxStepperNext
        [cngxAsyncStatus]="s.presenter.commitState"
        #status="cngxAsyncStatus"
      >
        @switch (status.status()) {
          @case ('pending') { Saving... }
          @case ('error') { Retry }
          @default { Continue }
        }
      </button>
    </cngx-stepper-footer>
  </cngx-stepper>`,
  templateChrome: `  <label class="event-row" style="margin-top:12px;gap:6px;align-items:center">
    <input type="checkbox" [checked]="failNext()" (change)="failNext.set($any($event.target).checked)" />
    <span>Fail next commit</span>
  </label>`,
};
