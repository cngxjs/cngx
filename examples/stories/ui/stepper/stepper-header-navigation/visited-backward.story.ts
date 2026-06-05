import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepper: visited-only header navigation',
  subtitle:
    'The default <code>headerNavigation="visited"</code> with <code>[linear]="true"</code>: headers stay focusable buttons, but only already-visited steps are reachable. Forward-incomplete headers carry <code>aria-disabled="true"</code> and remain focusable, so the gate is announced rather than a silent no-op.',
  description:
    'A linear wizard where you can click back to any completed step but cannot jump ahead over an incomplete one. Advance with Continue (the footer), then click an earlier header to return. The forward headers stay in the tab order with aria-disabled set, matching the ARIA composite-widget disabled-focusable rule. Set [linear]="false" for free click-through - that combination is what other libraries call "free" navigation.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['a11y-pattern', 'behavior'],
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
    headerNavigation="visited"
    [linear]="true"
    aria-label="Profile setup"
  >
    <div cngxStep label="Account" [completed]="active() > 0">
      <ng-template cngxStepContent><p>Create your account credentials.</p></ng-template>
    </div>
    <div cngxStep label="Profile" [completed]="active() > 1">
      <ng-template cngxStepContent><p>Add a display name and avatar.</p></ng-template>
    </div>
    <div cngxStep label="Review">
      <ng-template cngxStepContent><p>Confirm the details and finish.</p></ng-template>
    </div>

    <cngx-stepper-footer>
      <button type="button" class="chip" cngxStepperFooterStart cngxStepperPrevious>Back</button>
      <button type="button" class="chip" cngxStepperFooterEnd cngxStepperNext>Continue</button>
    </cngx-stepper-footer>
  </cngx-stepper>`,
};
