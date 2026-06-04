import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepper: chips skin',
  subtitle:
    'Each step is a standalone label chip. The current step is the filled accent chip; completed steps lift to a green label with a leading check on a soft green tint; upcoming steps read as neutral chips. Opt in via <code>[skin]="\'chips\'"</code> or <code>provideStepperConfig(withStepperSkin(\'chips\'))</code>.',
  description:
    'The chips skin is a pure thematic concern: ARIA, keyboard nav, slot directives, and presenter logic stay identical to the classic skin - only the strip CSS changes. Theme it through <code>--cngx-step-chips-*</code> custom properties (gap, radius, padding, inactive / completed surface + text, active text); the active fill follows <code>--cngx-color-primary</code> and the completed tint / check follow <code>--cngx-color-success</code>.',
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
  setup: `protected readonly active = signal(2);`,
  setupChrome: `  protected handleNext(): void {
    this.active.update((i) => Math.min(i + 1, 4));
  }
  protected handlePrev(): void {
    this.active.update((i) => Math.max(i - 1, 0));
  }`,
  template: `  <cngx-stepper
    [(activeStepIndex)]="active"
    skin="chips"
    aria-label="Data pipeline"
    class="demo-stepper-chips-accent"
  >
    <div cngxStep label="Source" [completed]="active() > 0">
      <ng-template cngxStepContent>
        <p>Connect the source system and map the incoming records.</p>
      </ng-template>
    </div>
    <div cngxStep label="Transform" [completed]="active() > 1">
      <ng-template cngxStepContent>
        <p>Apply the transformation rules and reshape the payload.</p>
      </ng-template>
    </div>
    <div cngxStep label="Validate" [completed]="active() > 2">
      <ng-template cngxStepContent>
        <p>Run validation rules against your transformed data. Check for required fields and uniqueness.</p>
      </ng-template>
    </div>
    <div cngxStep label="Load" [completed]="active() > 3">
      <ng-template cngxStepContent>
        <p>Load the validated records into the destination store.</p>
      </ng-template>
    </div>
    <div cngxStep label="Verify">
      <ng-template cngxStepContent>
        <p>Verify row counts and checksums against the source.</p>
      </ng-template>
    </div>
  </cngx-stepper>`,
  templateChrome: `  <div class="event-row" style="margin-top:12px;gap:8px">
    <button type="button" class="chip" (click)="handlePrev()">Previous</button>
    <button type="button" class="chip" (click)="handleNext()">Next</button>
    <span class="event-label">Active</span><span class="event-value">{{ active() }}</span>
  </div>`,
};
