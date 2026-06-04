import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepper: breadcrumb skin',
  subtitle:
    'An inline trail of text items separated by chevrons. Completed items show a green check and stay clickable to navigate back; the active item is emphasised with a soft pill + bold; upcoming items are muted. Horizontal by design. Opt in via <code>[skin]="\'breadcrumb\'"</code> or <code>provideStepperConfig(withStepperSkin(\'breadcrumb\'))</code>.',
  description:
    'The breadcrumb skin is a pure thematic concern: ARIA, keyboard nav, slot directives, and presenter logic stay identical to the classic skin - only the strip CSS changes. Click any completed breadcrumb to jump back. Theme it through <code>--cngx-step-breadcrumb-*</code> custom properties (gap, radius, upcoming / active / completed colour, active pill, check colour, separator glyph); the completed check follows <code>--cngx-color-success</code>.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition', 'behavior'],
  apiComponents: ['CngxStepper', 'CngxStep', 'CngxStepContent'],
  moduleImports: [
    "import { CngxStep, CngxStepContent } from '@cngx/common/stepper';",
    "import { CngxStepper } from '@cngx/ui/stepper';",
  ],
  imports: ['CngxStepper', 'CngxStep', 'CngxStepContent'],
  setup: `protected readonly active = signal(2);`,
  setupChrome: `  protected handleNext(): void {
    this.active.update((i) => Math.min(i + 1, 4));
  }
  protected handlePrev(): void {
    this.active.update((i) => Math.max(i - 1, 0));
  }`,
  template: `  <cngx-stepper [(activeStepIndex)]="active" skin="breadcrumb" aria-label="Workspace configuration">
    <div cngxStep label="Workspace" [completed]="active() > 0">
      <ng-template cngxStepContent>
        <p>Name the workspace and pick a region.</p>
      </ng-template>
    </div>
    <div cngxStep label="Team" [completed]="active() > 1">
      <ng-template cngxStepContent>
        <p>Invite teammates and assign seats.</p>
      </ng-template>
    </div>
    <div cngxStep label="Permissions" [completed]="active() > 2">
      <ng-template cngxStepContent>
        <p>Define the permission policies for each role.</p>
      </ng-template>
    </div>
    <div cngxStep label="Audit log" [completed]="active() > 3">
      <ng-template cngxStepContent>
        <p>Choose how long audit events are retained.</p>
      </ng-template>
    </div>
    <div cngxStep label="Confirm">
      <ng-template cngxStepContent>
        <p>Review the configuration and finish.</p>
      </ng-template>
    </div>
  </cngx-stepper>`,
  templateChrome: `  <div class="event-row" style="margin-top:12px;gap:8px">
    <button type="button" class="chip" (click)="handlePrev()">Previous</button>
    <button type="button" class="chip" (click)="handleNext()">Next</button>
    <span class="event-label">Active</span><span class="event-value">{{ active() }}</span>
  </div>`,
};
