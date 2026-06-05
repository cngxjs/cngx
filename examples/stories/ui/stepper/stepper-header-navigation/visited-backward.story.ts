import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepper: visited-only header navigation',
  subtitle:
    'The default <code>headerNavigation="visited"</code> with <code>[linear]="true"</code>: headers stay focusable buttons, but only already-visited steps are reachable. Forward-incomplete headers carry <code>aria-disabled="true"</code> and remain focusable, so the gate is announced rather than a silent no-op.',
  description:
    'A linear wizard. "Continue" marks the current step complete, then advances - completion is what unlocks the next step under linear mode (Back is unconditional, so it stays the plain cngxStepperPrevious atom). Once a step is visited you can click its header to return; forward headers stay aria-disabled until you reach them. Set [linear]="false" for free click-through - that combination is what other libraries call "free" navigation.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: ['CngxStepper', 'CngxStep', 'CngxStepContent', 'CngxStepperFooter', 'CngxStepperPrevious'],
  moduleImports: [
    "import { CngxStep, CngxStepContent, CngxStepperPrevious } from '@cngx/common/stepper';",
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
  ],
  setup: `protected readonly active = signal(0);
  protected readonly done = signal<readonly boolean[]>([false, false, false]);

  // Linear mode unlocks the next step only once the current one is
  // complete, so "Continue" marks it done, then advances.
  protected completeAndAdvance(): void {
    const i = this.active();
    this.done.update(prev => prev.map((v, idx) => (idx === i ? true : v)));
    this.active.update(n => Math.min(n + 1, 2));
  }`,
  template: `  <cngx-stepper
    [(activeStepIndex)]="active"
    headerNavigation="visited"
    [linear]="true"
    aria-label="Profile setup"
  >
    <div cngxStep label="Account" [completed]="done()[0]">
      <ng-template cngxStepContent><p>Create your account credentials.</p></ng-template>
    </div>
    <div cngxStep label="Profile" [completed]="done()[1]">
      <ng-template cngxStepContent><p>Add a display name and avatar.</p></ng-template>
    </div>
    <div cngxStep label="Review" [completed]="done()[2]">
      <ng-template cngxStepContent><p>Confirm the details and finish.</p></ng-template>
    </div>

    <cngx-stepper-footer>
      <button type="button" class="chip" cngxStepperFooterStart cngxStepperPrevious>Back</button>
      <button type="button" class="chip" cngxStepperFooterEnd (click)="completeAndAdvance()">Continue</button>
    </cngx-stepper-footer>
  </cngx-stepper>`,
};
