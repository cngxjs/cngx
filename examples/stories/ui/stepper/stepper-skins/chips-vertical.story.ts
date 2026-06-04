import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepper: chips skin (vertical)',
  subtitle:
    'The same chips skin with <code>orientation="vertical"</code>: the chips stack into a left-aligned column. Completed steps keep the green label + check, the current step stays the filled accent chip - identical theming, only the strip flows top-to-bottom.',
  description:
    'Vertical is a structural toggle on the same skin (<code>[skin]="\'chips\'"</code> + <code>orientation="vertical"</code>); ARIA, keyboard nav, and the <code>--cngx-step-chips-*</code> theming surface are unchanged.',
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
    orientation="vertical"
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
        <p>Run validation rules against your transformed data.</p>
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
