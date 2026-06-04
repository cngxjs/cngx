import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepperFooter: progress hint in the center',
  subtitle:
    'The center region takes a <code>&lt;cngx-stepper-count&gt;</code> for a live "Step N of M" hint between Back and Continue. The count reads the same host the nav atoms do - no extra wiring.',
  level: 'molecule',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['composition'],
  apiComponents: ['CngxStepperFooter', 'CngxStepperFooterCenter', 'CngxStepperCount'],
  moduleImports: [
    "import { CngxStep, CngxStepContent, CngxStepperPrevious, CngxStepperNext, CngxStepperCount } from '@cngx/common/stepper';",
    "import { CngxStepper, CngxStepperFooter, CngxStepperFooterStart, CngxStepperFooterCenter, CngxStepperFooterEnd } from '@cngx/ui/stepper';",
  ],
  imports: [
    'CngxStepper',
    'CngxStep',
    'CngxStepContent',
    'CngxStepperCount',
    'CngxStepperFooter',
    'CngxStepperFooterStart',
    'CngxStepperFooterCenter',
    'CngxStepperFooterEnd',
    'CngxStepperPrevious',
    'CngxStepperNext',
  ],
  setup: `protected readonly active = signal(0);`,
  template: `  <cngx-stepper [(activeStepIndex)]="active" aria-label="Checkout">
    <div cngxStep label="Cart">
      <ng-template cngxStepContent><p>Review the items in your cart.</p></ng-template>
    </div>
    <div cngxStep label="Shipping">
      <ng-template cngxStepContent><p>Enter the delivery address.</p></ng-template>
    </div>
    <div cngxStep label="Payment">
      <ng-template cngxStepContent><p>Provide payment details.</p></ng-template>
    </div>

    <cngx-stepper-footer>
      <button type="button" class="chip" cngxStepperFooterStart cngxStepperPrevious>Back</button>
      <cngx-stepper-count cngxStepperFooterCenter />
      <button type="button" class="chip" cngxStepperFooterEnd cngxStepperNext>Continue</button>
    </cngx-stepper-footer>
  </cngx-stepper>`,
};
