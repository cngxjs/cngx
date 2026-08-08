import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'cngxMatStepper + router-sync: the active Material step lives in ?step',
  subtitle:
    'Stack <code>cngxStepperRouterSync</code> on the same <code>&lt;mat-stepper cngxMatStepper&gt;</code> and the active step round-trips through <code>?step=&lt;id&gt;</code>. Material steps carry no semantic id of their own, so the demo swaps <code>CNGX_MAT_STEP_HANDLE_FACTORY</code> in <code>viewProviders</code> to key each handle id off the step label - a shipped DI seam, no component fork. Click <em>Security</em> and the URL reads <code>?step=security</code>.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['integration', 'behavior'],
  apiComponents: ['CngxMatStepper', 'CngxStepperRouterSync'],
  moduleImports: [
    "import { CngxStepperRouterSync } from '@cngx/common/stepper';",
    "import { CngxMatStepper, CNGX_MAT_STEP_HANDLE_FACTORY, createMatStepHandle, type CngxMatStepHandleFactory } from '@cngx/ui/mat-stepper';",
    "import { MatStepperModule } from '@angular/material/stepper';",
  ],
  imports: ['MatStepperModule', 'CngxMatStepper', 'CngxStepperRouterSync'],
  viewProviders: [
    "{ provide: CNGX_MAT_STEP_HANDLE_FACTORY, useValue: ((step) => createMatStepHandle(step, () => String(step.label ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))) satisfies CngxMatStepHandleFactory }",
  ],
  setup: `protected readonly active = signal(0);`,
  template: `  <mat-stepper
    cngxMatStepper
    [(activeStepIndex)]="active"
    cngxStepperRouterSync
    [mode]="'queryParam'"
    paramName="step"
    aria-label="Onboarding wizard"
  >
    <mat-step label="Profile">
      <p>Set your display name and avatar.</p>
    </mat-step>
    <mat-step label="Notifications">
      <p>Choose which events should email you.</p>
    </mat-step>
    <mat-step label="Security">
      <p>Enable two-factor authentication.</p>
    </mat-step>
    <mat-step label="Confirm">
      <p>Review your choices and finish.</p>
    </mat-step>
  </mat-stepper>`,
};
