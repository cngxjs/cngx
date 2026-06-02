import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepper: pill-segment skin (vertical)',
  subtitle:
    'Column-stacked card list - the iOS-segmented control rebases to a stacked card stack for vertical layouts. Active card raises with its own shadow; completed cards stay flat with a green check disc. Border radius softens (16px rail, 12px card) so the stack reads as a list, not a single pill.',
  description:
    'Vertical companion to the horizontal pill-segment demo. Each step renders as a stacked card with start-aligned labels; the rail rounds to 16px and each card to 12px so the visual reads as a card list rather than a horizontal pill. State cues (active / completed / errored) come through the indicator disc and the raised active card; ARIA semantics stay identical to the horizontal skin.',
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
  template: `  <cngx-stepper [(activeStepIndex)]="active" skin="pill-segment" [orientation]="'vertical'" aria-label="Survey">
    <div cngxStep label="Intro" [completed]="true">
      <ng-template cngxStepContent>
        <p>Welcome screen.</p>
      </ng-template>
    </div>
    <div cngxStep label="Questions">
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
