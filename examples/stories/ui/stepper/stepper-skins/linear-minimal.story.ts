import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepper: linear-minimal skin',
  subtitle:
    'Label-only horizontal layout with a 6px dot indicator and a dashed connector. Opt in via <code>[skin]="\'linear-minimal\'"</code> on the host or <code>provideStepperConfig(withStepperSkin(\'linear-minimal\'))</code> at root.',
  description:
    'The linear-minimal skin trades the numbered disc for a 6px dot - active fills with the primary tone, completed shrinks to a small check, upcoming reads as a hollow ring, and adjacent steps are linked by a 1px dashed connector. The skin is a thematic concern only: ARIA, keyboard behaviour, slot directives, and presenter logic stay identical to the classic skin.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  apiComponents: ['CngxStepper', 'CngxStep', 'CngxStepContent'],
  moduleImports: [
    "import { CngxStep, CngxStepContent } from '@cngx/common/stepper';",
    "import { CngxStepper } from '@cngx/ui/stepper';",
  ],
  imports: ['CngxStepper', 'CngxStep', 'CngxStepContent'],
  setup: `protected readonly active = signal(1);`,
  setupChrome: `  protected handleNext(): void {
    this.active.update(i => Math.min(i + 1, 3));
  }
  protected handlePrev(): void {
    this.active.update(i => Math.max(i - 1, 0));
  }`,
  template: `  <cngx-stepper [(activeStepIndex)]="active" skin="linear-minimal" aria-label="Onboarding">
    <div cngxStep label="Account" [completed]="true">
      <ng-template cngxStepContent>
        <p>Create the account and verify the email address.</p>
      </ng-template>
    </div>
    <div cngxStep label="Profile">
      <ng-template cngxStepContent>
        <p>Add display name, avatar, and locale preferences.</p>
      </ng-template>
    </div>
    <div cngxStep label="Workspace">
      <ng-template cngxStepContent>
        <p>Pick a workspace template and invite teammates.</p>
      </ng-template>
    </div>
    <div cngxStep label="Done">
      <ng-template cngxStepContent>
        <p>Setup complete - jump into the dashboard.</p>
      </ng-template>
    </div>
  </cngx-stepper>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px;gap:8px">
    <div class="event-row">
      <button type="button" class="chip" (click)="handlePrev()">Previous</button>
      <button type="button" class="chip" (click)="handleNext()">Next</button>
    </div>
    <div class="event-row"><span class="event-label">Active step</span><span class="event-value">{{ active() }}</span></div>
  </div>`,
};
