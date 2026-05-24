import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepper: empty state slot',
  subtitle: 'When the registered step list is empty (e.g. async-loaded wizard with no data yet), the slot renders in place of the strip + panels. No context - render static markup or read injected services directly. Toggle the button below to register / unregister all steps and watch the slot swap in.',
  description: 'Slot focus: <code>*cngxStepperEmpty</code>. Toggling the registered step list to zero swaps the entire strip+panel surface for the slot, demonstrating that the slot is the empty-state replacement, not an overlay.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  apiComponents: [
    'CngxStepper',
    'CngxStep',
    'CngxStepContent',
    'CngxStepperEmpty',
  ],
  moduleImports: [
    'import { CngxStep, CngxStepContent, CngxStepperEmpty } from \'@cngx/common/stepper\';',
    'import { CngxStepper } from \'@cngx/ui/stepper\';',
  ],
  imports: ['CngxStepper', 'CngxStep', 'CngxStepperEmpty', 'CngxStepContent'],
  setup: `protected readonly active = signal(0);
  protected readonly hasSteps = signal(true);`,
  template: `
  <button
    type="button"
    class="chip"
    style="margin-bottom:var(--demo-grid-gap, 12px)"
    (click)="hasSteps.update((v) => !v)"
  >
    {{ hasSteps() ? 'Unregister all steps' : 'Register steps' }}
  </button>
  <cngx-stepper [(activeStepIndex)]="active" aria-label="Slot-overrides - empty state">
    <ng-template cngxStepperEmpty>
      <div class="demo-stepper-empty">
        <strong>No steps configured yet</strong>
        <p>Steps will appear here once the wizard config loads.</p>
      </div>
    </ng-template>
    @if (hasSteps()) {
      <div cngxStep label="One">
        <ng-template cngxStepContent>
          <p>Step 1.</p>
        </ng-template>
      </div>
      <div cngxStep label="Two">
        <ng-template cngxStepContent>
          <p>Step 2.</p>
        </ng-template>
      </div>
    }
  </cngx-stepper>`,
};
