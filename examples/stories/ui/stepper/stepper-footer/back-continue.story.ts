import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepperFooter: Back / Continue action bar',
  subtitle:
    'Drop a <code>&lt;cngx-stepper-footer&gt;</code> inside the stepper and mark a Back and a Continue button with <code>cngxStepperPrevious</code> / <code>cngxStepperNext</code>. The footer re-provides the host, so the buttons gate themselves - Back disables on the first step, Continue on the last - with no consumer wiring.',
  level: 'molecule',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern'],
  apiComponents: ['CngxStepperFooter', 'CngxStepperPrevious', 'CngxStepperNext'],
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
  template: `  <cngx-stepper [(activeStepIndex)]="active" aria-label="Account setup">
    <div cngxStep label="Method">
      <ng-template cngxStepContent><p>Choose how to sign in - email, SSO, or magic link.</p></ng-template>
    </div>
    <div cngxStep label="Details">
      <ng-template cngxStepContent><p>Provide the basics: display name, locale, avatar.</p></ng-template>
    </div>
    <div cngxStep label="Verify">
      <ng-template cngxStepContent><p>Confirm the email address with the code we sent.</p></ng-template>
    </div>

    <cngx-stepper-footer>
      <button type="button" class="chip" cngxStepperFooterStart cngxStepperPrevious>Back</button>
      <button type="button" class="chip" cngxStepperFooterEnd cngxStepperNext>Continue</button>
    </cngx-stepper-footer>
  </cngx-stepper>`,
};
