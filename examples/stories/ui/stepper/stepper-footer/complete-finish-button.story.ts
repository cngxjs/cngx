import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepperFooter: Complete finish button',
  subtitle:
    'On the last step the footer swaps Continue for a <code>[cngxStepperComplete]</code> button. Unlike Next (which reflects and advances), Complete <em>runs</em> an async finish action - it composes <code>CngxAsyncClick</code>, busy-disables while in flight, and emits <code>(completed)</code> after success.',
  level: 'molecule',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['composition', 'async-state'],
  apiComponents: ['CngxStepperComplete', 'CngxStepperFooter'],
  moduleImports: [
    "import { CngxStep, CngxStepContent, CngxStepperPrevious, CngxStepperNext, CngxStepperComplete } from '@cngx/common/stepper';",
    "import { CngxStepper, CngxStepperFooter, CngxStepperFooterStart, CngxStepperFooterEnd } from '@cngx/ui/stepper';",
  ],
  imports: [
    'CngxStepper',
    'CngxStep',
    'CngxStepContent',
    'CngxStepperFooter',
    'CngxStepperFooterStart',
    'CngxStepperFooterEnd',
    'CngxStepperPrevious',
    'CngxStepperNext',
    'CngxStepperComplete',
  ],
  setup: `protected readonly active = signal(0);
  protected readonly lastIndex = 2;
  protected readonly finishAction = (): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, 800));`,
  setupChrome: `  protected readonly submitted = signal(false);
  protected onCompleted(): void {
    this.submitted.set(true);
  }`,
  template: `  <cngx-stepper [(activeStepIndex)]="active" aria-label="Sign up">
    <div cngxStep label="Account">
      <ng-template cngxStepContent><p>Create your account.</p></ng-template>
    </div>
    <div cngxStep label="Profile">
      <ng-template cngxStepContent><p>Fill in your profile.</p></ng-template>
    </div>
    <div cngxStep label="Confirm">
      <ng-template cngxStepContent><p>Confirm and submit.</p></ng-template>
    </div>

    <cngx-stepper-footer>
      <button type="button" class="chip" cngxStepperFooterStart cngxStepperPrevious>Back</button>
      @if (active() < lastIndex) {
        <button type="button" class="chip" cngxStepperFooterEnd cngxStepperNext>Continue</button>
      } @else {
        <button
          type="button"
          class="chip"
          cngxStepperFooterEnd
          [cngxStepperComplete]="finishAction"
          (completed)="onCompleted()"
        >
          Finish
        </button>
      }
    </cngx-stepper-footer>
  </cngx-stepper>`,
  templateChrome: `  @if (submitted()) {
    <div class="event-row" style="margin-top:12px">
      <span class="event-label">Status</span><span class="event-value">Submitted - (completed) fired</span>
    </div>
  }`,
};
