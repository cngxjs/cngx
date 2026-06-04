import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepperFooter: "% complete" center',
  subtitle:
    'No new API for a percent readout - <code>&lt;cngx-stepper-count&gt;</code> already takes a <code>[format]</code> closure. Pass <code>(c, t) =&gt; Math.round(c / t * 100) + "% complete"</code> and the center region renders the percentage live.',
  description:
    'The format closure receives the 1-based current position and the total step count. Any string shape is supported - this one returns a rounded percentage.',
  level: 'molecule',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['composition'],
  apiComponents: ['CngxStepperFooter', 'CngxStepperCount'],
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
  setup: `protected readonly active = signal(0);
  // current is 1-based; map step 1 -> 0% and the final step -> 100%.
  protected readonly percentFmt = (current: number, total: number): string =>
    Math.round(total <= 1 ? 0 : ((current - 1) / (total - 1)) * 100) + '% complete';`,
  template: `  <cngx-stepper [(activeStepIndex)]="active" aria-label="Onboarding">
    <div cngxStep label="Welcome">
      <ng-template cngxStepContent><p>Welcome aboard - let us set things up.</p></ng-template>
    </div>
    <div cngxStep label="Profile">
      <ng-template cngxStepContent><p>Tell us a little about yourself.</p></ng-template>
    </div>
    <div cngxStep label="Preferences">
      <ng-template cngxStepContent><p>Pick your notification preferences.</p></ng-template>
    </div>
    <div cngxStep label="Done">
      <ng-template cngxStepContent><p>All set.</p></ng-template>
    </div>

    <cngx-stepper-footer>
      <button type="button" class="chip" cngxStepperFooterStart cngxStepperPrevious>Back</button>
      <cngx-stepper-count cngxStepperFooterCenter [format]="percentFmt" />
      <button type="button" class="chip" cngxStepperFooterEnd cngxStepperNext>Continue</button>
    </cngx-stepper-footer>
  </cngx-stepper>`,
};
