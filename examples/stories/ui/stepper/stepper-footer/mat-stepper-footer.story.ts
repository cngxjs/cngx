import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxMatStepper: footer via the shared CNGX_STEPPER_HOST contract',
  subtitle:
    'The footer is wired through <code>CNGX_STEPPER_HOST</code>, the same contract both steppers share - so the identical <code>&lt;cngx-stepper-footer&gt;</code> markup instruments <code>&lt;cngx-mat-stepper&gt;</code> with no Material-specific code.',
  level: 'molecule',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['composition', 'integration'],
  apiComponents: ['CngxMatStepper', 'CngxStepperFooter'],
  moduleImports: [
    "import { CngxStep, CngxStepContent, CngxStepperPrevious, CngxStepperNext } from '@cngx/common/stepper';",
    "import { CngxMatStepper } from '@cngx/ui/mat-stepper';",
    "import { CngxStepperFooter, CngxStepperFooterStart, CngxStepperFooterEnd } from '@cngx/ui/stepper';",
  ],
  imports: [
    'CngxMatStepper',
    'CngxStep',
    'CngxStepContent',
    'CngxStepperFooter',
    'CngxStepperFooterStart',
    'CngxStepperFooterEnd',
    'CngxStepperPrevious',
    'CngxStepperNext',
  ],
  setup: `protected readonly active = signal(0);`,
  template: `  <cngx-mat-stepper [(activeStepIndex)]="active" aria-label="Account setup">
    <div cngxStep label="Method">
      <ng-template cngxStepContent><p>Choose how to sign in.</p></ng-template>
    </div>
    <div cngxStep label="Details">
      <ng-template cngxStepContent><p>Provide the basics.</p></ng-template>
    </div>
    <div cngxStep label="Verify">
      <ng-template cngxStepContent><p>Confirm your email.</p></ng-template>
    </div>

    <cngx-stepper-footer>
      <button type="button" class="chip" cngxStepperFooterStart cngxStepperPrevious>Back</button>
      <button type="button" class="chip" cngxStepperFooterEnd cngxStepperNext>Continue</button>
    </cngx-stepper-footer>
  </cngx-mat-stepper>`,
};
