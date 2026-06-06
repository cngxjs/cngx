import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'cngxMatStepper: a cngx footer driving a Material stepper',
  subtitle:
    'Attach <code>cngxMatStepper</code> to a vanilla <code>&lt;mat-stepper&gt;</code> and the shared <code>CNGX_STEPPER_HOST</code> contract lets a <code>&lt;cngx-stepper-footer&gt;</code> drive Back / Continue - no <code>matStepperPrevious</code> / <code>matStepperNext</code> buttons. The footer sits outside the stepper and binds <code>[host]="s.presenter"</code> via the directive ref.',
  level: 'molecule',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['composition', 'integration'],
  apiComponents: ['CngxMatStepper', 'CngxStepperFooter'],
  moduleImports: [
    "import { MatStepperModule } from '@angular/material/stepper';",
    "import { CngxStepperPrevious, CngxStepperNext } from '@cngx/common/stepper';",
    "import { CngxMatStepper } from '@cngx/ui/mat-stepper';",
    "import { CngxStepperFooter, CngxStepperFooterStart, CngxStepperFooterEnd } from '@cngx/ui/stepper';",
  ],
  imports: [
    'MatStepperModule',
    'CngxMatStepper',
    'CngxStepperFooter',
    'CngxStepperFooterStart',
    'CngxStepperFooterEnd',
    'CngxStepperPrevious',
    'CngxStepperNext',
  ],
  setup: `protected readonly active = signal(0);`,
  template: `  <mat-stepper
    cngxMatStepper
    #s="cngxMatStepper"
    [(activeStepIndex)]="active"
    aria-label="Account setup"
  >
    <mat-step label="Method">
      <p>Choose how to sign in.</p>
    </mat-step>
    <mat-step label="Details">
      <p>Provide the basics.</p>
    </mat-step>
    <mat-step label="Verify">
      <p>Confirm your email.</p>
    </mat-step>
  </mat-stepper>

  <!-- The footer lives outside the stepper and is handed the host
       explicitly; its Back / Continue atoms drive Material through the
       shared CNGX_STEPPER_HOST contract. -->
  <cngx-stepper-footer [host]="s.presenter">
    <button type="button" class="chip" cngxStepperFooterStart cngxStepperPrevious>Back</button>
    <button type="button" class="chip" cngxStepperFooterEnd cngxStepperNext>Continue</button>
  </cngx-stepper-footer>`,
};
