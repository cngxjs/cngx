import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepper: continuous flat density',
  subtitle:
    'A flat stepper with <code>density: \'auto\'</code> degrades continuously on its own container width: each label keeps a budget that shrinks with its distance from the active step, so the furthest labels truncate first and the active one stays readable. Drag the frame\'s right edge - the strip adapts instead of growing a horizontal scrollbar.',
  description:
    'When a flat strip runs out of room the wrong answer is a horizontal scrollbar. <code>density: \'auto\'</code> gives every label a continuous budget in container-query units (<code>cqi</code>): its share of the strip (<code>100cqi / step-count</code>) minus a fixed indicator allowance minus a penalty proportional to its distance from the active step. The step furthest from the active one sheds its label first and the nearest stay readable longest; the active step always keeps a readable label as the on-screen anchor. Collapsed labels stay in the accessibility tree (clipped, never removed), so every step button keeps its accessible name, and the orientation never changes. The budget floors at zero, so labels truncate in flow and the strip never overflows. The penalty and allowances are tunable custom properties (<code>--cngx-step-distance-penalty</code>, <code>--cngx-step-indicator-allowance</code>, <code>--cngx-step-active-label-min</code>); <code>withStepperDensity(\'auto\')</code> arms the model.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['behavior', 'composition'],
  apiComponents: ['CngxStepper', 'CngxStep', 'CngxStepContent'],
  moduleImports: [
    "import { CngxStep, CngxStepContent, provideStepperConfigAt, withStepperDensity } from '@cngx/common/stepper';",
    "import { CngxStepper } from '@cngx/ui/stepper';",
  ],
  imports: ['CngxStepper', 'CngxStep', 'CngxStepContent'],
  viewProviders: [
    "provideStepperConfigAt(withStepperDensity('auto', { compact: 145, minimal: 120 }))",
  ],
  setup: `protected readonly active = signal(0);
  protected readonly steps = ['Connect repository', 'Validate manifest', 'Package artifacts', 'Deploy to production'];`,
  setupChrome: `  protected handleNext(): void {
    this.active.update((i) => Math.min(i + 1, this.steps.length - 1));
  }
  protected handlePrev(): void {
    this.active.update((i) => Math.max(i - 1, 0));
  }`,
  template: `  <div style="resize: horizontal; overflow: hidden; min-width: 320px; max-width: 100%; width: 520px;">
    <cngx-stepper [(activeStepIndex)]="active" aria-label="Release pipeline">
      @for (label of steps; track label) {
        <div cngxStep [label]="label">
          <ng-template cngxStepContent><p>{{ label }} stage.</p></ng-template>
        </div>
      }
    </cngx-stepper>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px;gap:8px">
    <div class="event-row">
      <button type="button" class="chip" (click)="handlePrev()">Previous</button>
      <button type="button" class="chip" (click)="handleNext()">Next</button>
    </div>
    <div class="event-row"><span class="event-label">Active step</span><span class="event-value">{{ steps[active()] }}</span></div>
    <div class="event-row"><span class="event-value">Drag the frame's right edge to narrow it and watch the labels degrade - no scrollbar appears.</span></div>
  </div>`,
};
