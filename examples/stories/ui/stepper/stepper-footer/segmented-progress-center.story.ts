import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepperFooter: segmented progress center',
  subtitle:
    'Compose the generic <code>&lt;cngx-segmented-progress&gt;</code> atom into the footer center. It is not stepper-bound - bind <code>[value]</code> from the active index and <code>[total]</code> from the step count, and the segments track the wizard position between Back and Continue.',
  level: 'molecule',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition'],
  apiComponents: ['CngxStepperFooter', 'CngxSegmentedProgress'],
  moduleImports: [
    "import { CngxStep, CngxStepContent, CngxStepperPrevious, CngxStepperNext } from '@cngx/common/stepper';",
    "import { CngxSegmentedProgress } from '@cngx/common/display';",
    "import { CngxStepper, CngxStepperFooter, CngxStepperFooterStart, CngxStepperFooterCenter, CngxStepperFooterEnd } from '@cngx/ui/stepper';",
  ],
  imports: [
    'CngxStepper',
    'CngxStep',
    'CngxStepContent',
    'CngxSegmentedProgress',
    'CngxStepperFooter',
    'CngxStepperFooterStart',
    'CngxStepperFooterCenter',
    'CngxStepperFooterEnd',
    'CngxStepperPrevious',
    'CngxStepperNext',
  ],
  setup: `protected readonly active = signal(0);
  protected readonly stepCount = 4;`,
  template: `  <cngx-stepper [(activeStepIndex)]="active" aria-label="Setup wizard">
    <div cngxStep label="Plan">
      <ng-template cngxStepContent><p>Pick a subscription plan.</p></ng-template>
    </div>
    <div cngxStep label="Billing">
      <ng-template cngxStepContent><p>Enter billing details.</p></ng-template>
    </div>
    <div cngxStep label="Team">
      <ng-template cngxStepContent><p>Invite your teammates.</p></ng-template>
    </div>
    <div cngxStep label="Review">
      <ng-template cngxStepContent><p>Review and confirm.</p></ng-template>
    </div>

    <cngx-stepper-footer>
      <button type="button" class="chip" cngxStepperFooterStart cngxStepperPrevious>Back</button>
      <cngx-segmented-progress
        cngxStepperFooterCenter
        [value]="active()"
        [total]="stepCount"
        [attr.aria-label]="'Step ' + (active() + 1) + ' of ' + stepCount"
        style="min-inline-size:8rem"
      />
      <button type="button" class="chip" cngxStepperFooterEnd cngxStepperNext>Continue</button>
    </cngx-stepper-footer>
  </cngx-stepper>`,
};
