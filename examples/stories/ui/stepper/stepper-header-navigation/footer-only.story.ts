import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepper: footer-only navigation',
  subtitle:
    'Set <code>headerNavigation="none"</code> and the step headers render as inert labels - no buttons, no roving focus, no click. The <code>&lt;cngx-stepper-footer&gt;</code> Back / Continue pair is the only way through, which is the dominant wizard pattern.',
    description:
    'A checkout wizard where the header strip is a read-only progress indicator. Tab order skips the headers and lands on the footer controls; the active step still carries aria-current="step" and the per-step status. The footer Back / Continue pair drives navigation. Compare with the default headerNavigation="visited", where the headers are focusable buttons.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['a11y-pattern', 'behavior', 'composition'],
  apiComponents: ['CngxStepper', 'CngxStep', 'CngxStepperFooter', 'CngxStepperPrevious', 'CngxStepperNext'],
  moduleImports: [
    "import { CngxStep, CngxStepContent, CngxStepperPrevious, CngxStepperNext } from '@cngx/common/stepper';",
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
  ],
  setup: `protected readonly active = signal(0);`,
  template: `  <cngx-stepper
    [(activeStepIndex)]="active"
    headerNavigation="none"
    aria-label="Checkout"
  >
    <div cngxStep label="Cart" [completed]="active() > 0">
      <ng-template cngxStepContent><p>Review the items in your cart.</p></ng-template>
    </div>
    <div cngxStep label="Address" [completed]="active() > 1">
      <ng-template cngxStepContent><p>Enter the shipping address.</p></ng-template>
    </div>
    <div cngxStep label="Payment">
      <ng-template cngxStepContent><p>Choose a payment method and confirm.</p></ng-template>
    </div>

    <cngx-stepper-footer>
      <button type="button" class="chip" cngxStepperFooterStart cngxStepperPrevious>Back</button>
      <button type="button" class="chip" cngxStepperFooterEnd cngxStepperNext>Continue</button>
    </cngx-stepper-footer>
  </cngx-stepper>`,
};
