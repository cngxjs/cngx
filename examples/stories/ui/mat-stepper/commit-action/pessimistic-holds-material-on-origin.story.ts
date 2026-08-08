import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'cngxMatStepper: a pessimistic commit holds Material on the origin step',
  subtitle:
    'Attach <code>cngxMatStepper</code> to a vanilla <code>&lt;mat-stepper&gt;</code> and bind <code>[commitAction]</code>. In <code>pessimistic</code> mode Material does not advance when a header is clicked - the presenter runs the async action first (~800ms here) and only lets Material move once it resolves. The commit lifecycle is the same brain <code>&lt;cngx-stepper&gt;</code> uses; Material owns the rendering.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['async-state', 'integration', 'composition'],
  apiComponents: ['CngxMatStepper', 'CngxStepperPresenter'],
  moduleImports: [
    "import { Observable } from 'rxjs';",
    "import { type CngxStepperCommitAction } from '@cngx/common/stepper';",
    "import { CngxMatStepper } from '@cngx/ui/mat-stepper';",
    "import { MatStepperModule } from '@angular/material/stepper';",
  ],
  imports: ['MatStepperModule', 'CngxMatStepper'],
  setup: `protected readonly active = signal(0);
  protected readonly commitAction: CngxStepperCommitAction = () =>
    new Observable<boolean>((sub) => {
      const handle = setTimeout(() => {
        sub.next(true);
        sub.complete();
      }, 800);
      return () => clearTimeout(handle);
    });`,
  template: `  <mat-stepper
    cngxMatStepper
    [(activeStepIndex)]="active"
    [commitAction]="commitAction"
    [commitMode]="'pessimistic'"
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
  </mat-stepper>`,
};
