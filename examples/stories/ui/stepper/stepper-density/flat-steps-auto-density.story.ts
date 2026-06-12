import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepper: flat density ladder',
  subtitle:
    'A flat stepper with <code>density: \'auto\'</code> degrades on its own container width - full labels, then ellipsis-truncated, then indicators-only with the active label kept. Drag the frame\'s right edge: the strip adapts instead of growing a horizontal scrollbar.',
  description:
    'When a flat strip runs out of room the wrong answer is a horizontal scrollbar. <code>density: \'auto\'</code> measures the strip container (not the viewport) via <code>ResizeObserver</code> and crosses two per-step px thresholds: at or above <code>compact</code> px per step it keeps full labels, above <code>minimal</code> it ellipsis-truncates them, and below that it drops to indicators-only and stacks vertically. The thresholds are sized so the chosen rung always fits, so no rung overflows. At the minimal rung the active step keeps its label as the on-screen anchor while position and progress survive for assistive tech. Tune the thresholds per wizard via <code>withStepperDensity(\'auto\', { compact, minimal })</code>; this 6-step strip shows the whole ladder between roughly 360 and 1000px.',
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
    "provideStepperConfigAt(withStepperDensity('auto', { compact: 165, minimal: 135 }))",
  ],
  setup: `protected readonly active = signal(0);
  protected readonly steps = ['Repository', 'Dependencies', 'Validation', 'Packaging', 'Deployment', 'Monitoring'];`,
  setupChrome: `  protected handleNext(): void {
    this.active.update((i) => Math.min(i + 1, this.steps.length - 1));
  }
  protected handlePrev(): void {
    this.active.update((i) => Math.max(i - 1, 0));
  }`,
  template: `  <div style="resize: horizontal; overflow: hidden; min-width: 360px; max-width: 100%; width: 880px;">
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
