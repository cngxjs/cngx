import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepper: flat density ladder (15 steps)',
  subtitle:
    'A flat 15-step stepper with <code>density: \'auto\'</code> degrades on its own container width - full labels, then ellipsis-truncated, then indicators-only with the active label kept. Drag the frame edge to narrow it: no menu, no chevrons, no horizontal scroll.',
  description:
    'The recurring "too many flat steps" case. <code>density: \'auto\'</code> measures the strip container (not the viewport) via <code>ResizeObserver</code> and crosses two per-step px thresholds. The thresholds here are tuned small (<code>compact 48</code>, <code>minimal 28</code>) so the full -> compact -> minimal ladder is visible in a normal viewport; the library defaults (120 / 64) suit shorter wizards. At the minimal rung the strip flips vertical and every non-active label drops to the screen-reader layer, so the active step stays the on-screen anchor while position and progress survive for assistive tech. Opt in via <code>provideStepperConfigAt(withStepperDensity(\'auto\', { compact: 48, minimal: 28 }))</code>.',
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
    "provideStepperConfigAt(withStepperDensity('auto', { compact: 48, minimal: 28 }))",
  ],
  setup: `protected readonly active = signal(0);
  protected readonly steps = ['Source', 'Install', 'Lint', 'Unit', 'Integration', 'Build', 'Package', 'Sign', 'Scan', 'Stage', 'Smoke', 'Approve', 'Deploy', 'Verify', 'Notify'];`,
  setupChrome: `  protected handleNext(): void {
    this.active.update((i) => Math.min(i + 1, this.steps.length - 1));
  }
  protected handlePrev(): void {
    this.active.update((i) => Math.max(i - 1, 0));
  }`,
  template: `  <div style="resize: horizontal; overflow: hidden; min-width: 260px; max-width: 100%; width: 760px;">
    <cngx-stepper [(activeStepIndex)]="active" aria-label="Deployment pipeline">
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
    <div class="event-row"><span class="event-value">Drag the frame's right edge to narrow it and watch the labels degrade.</span></div>
  </div>`,
};
