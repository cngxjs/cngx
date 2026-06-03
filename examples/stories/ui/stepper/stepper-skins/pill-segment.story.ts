import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepper: pill-segment skin',
  subtitle:
    'A single rounded rail with each step as a flex segment. Active segment fills primary, completed with success-tint. Opt in via <code>skin="pill-segment"</code> or <code>provideStepperConfig(withStepperSkin(\'pill-segment\'))</code> at root.',
  description:
    'The pill-segment skin wraps the entire step strip in a rounded container and renders each step as an equal-width flex segment with a thin divider between them. State cues (active / completed / errored) come through the segment fill rather than the indicator disc, which collapses to its glyph. Best fit: short flows of 3-5 steps where the rail is the dominant visual element (surveys, settings sections, onboarding milestones).',
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
    this.active.update(i => Math.min(i + 1, 2));
  }
  protected handlePrev(): void {
    this.active.update(i => Math.max(i - 1, 0));
  }`,
  template: `  <cngx-stepper [(activeStepIndex)]="active" skin="pill-segment" aria-label="Survey">
    <div cngxStep label="Intro" [completed]="active() > 0">
      <ng-template cngxStepContent>
        <p>Welcome screen.</p>
      </ng-template>
    </div>
    <div cngxStep label="Questions" [completed]="active() > 1">
      <ng-template cngxStepContent>
        <p>Answer the survey questions.</p>
      </ng-template>
    </div>
    <div cngxStep label="Submit">
      <ng-template cngxStepContent>
        <p>Submit the answers.</p>
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
