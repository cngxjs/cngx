import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepper: continuous flat density',
  subtitle:
    'A flat stepper with <code>density: \'auto\'</code> degrades continuously on its own container width: labels stay full while there is room and only give way when the strip would overflow, the furthest from the active step first. Drag the frame\'s right edge - the strip adapts instead of growing a horizontal scrollbar.',
  description:
    'When a flat strip runs out of room the wrong answer is a horizontal scrollbar. <code>density: \'auto\'</code> lets the labels keep their full width as long as the strip has room; they only truncate when it would otherwise overflow, and each step\'s shrink priority grows with its distance from the active one, so the furthest labels give way first and the nearest stay readable longest. The active step shrinks last and keeps a readable label as the on-screen anchor. Space freed by a collapsed label is reused rather than left empty, so you never see a truncated label sitting next to dead space. Collapsed labels stay in the accessibility tree (clipped, never removed), so every step button keeps its accessible name, and the orientation never changes; the strip clips instead of overflowing. The falloff is a tunable custom property (<code>--cngx-step-shrink-weight</code>); <code>withStepperDensity(\'auto\')</code> arms the model.',
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
