import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Mat-Stepper — router sync',
  navLabel: 'Router sync',
  navCategory: 'mat-stepper',
  description:
    'Cross-cutting compose: <code>&lt;cngx-mat-stepper&gt;</code> + <code>cngxStepperRouterSync</code>. Clicking a Material step updates the URL fragment; reloading lands on that step. Same brain, Material skin — proves the layer split.',
  apiComponents: ['CngxMatStepper'],
  moduleImports: [
    "import { CngxStep, CngxStepContent, CngxStepperRouterSync } from '@cngx/common/stepper';",
    "import { CngxMatStepper } from '@cngx/ui/mat-stepper';",
  ],
  setup: `
  protected readonly active = signal(0);
  `,
  sections: [
    {
      title: 'Deep-linking against Material',
      subtitle:
        'The router-sync directive composes against the shared presenter, so Material consumers get URL deep-linking with zero extra wiring.',
      imports: ['CngxMatStepper', 'CngxStep', 'CngxStepContent', 'CngxStepperRouterSync'],
      template: `
  <cngx-mat-stepper
    [(activeStepIndex)]="active"
    cngxStepperRouterSync
    paramName="step"
    aria-label="Material onboarding"
  >
    <div cngxStep id="profile" label="Profile">
      <ng-template cngxStepContent><p>Set your display name and avatar.</p></ng-template>
    </div>
    <div cngxStep id="notifications" label="Notifications">
      <ng-template cngxStepContent><p>Choose which events should email you.</p></ng-template>
    </div>
    <div cngxStep id="security" label="Security">
      <ng-template cngxStepContent><p>Enable two-factor authentication.</p></ng-template>
    </div>
    <div cngxStep id="confirm" label="Confirm">
      <ng-template cngxStepContent><p>Review your choices and finish.</p></ng-template>
    </div>
  </cngx-mat-stepper>
  <div class="event-grid" style="margin-top:var(--demo-grid-gap, 12px)">
    <div class="event-row"><span class="event-label">Active step</span><span class="event-value">{{ active() }}</span></div>
  </div>`,
    },
  ],
};
