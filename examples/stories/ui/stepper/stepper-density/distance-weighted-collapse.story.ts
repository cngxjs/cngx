import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepper: distance-weighted collapse',
  subtitle:
    'With <code>density: \'auto\'</code> each step\'s shrink priority grows with its distance from the active one. Move the active step and narrow the frame: the labels furthest from it give way first while the active one and its neighbours stay readable.',
  description:
    'Shrink priority scales with each step\'s distance from the active one, so collapse fans out from the active step rather than running left to right. With the active step in the middle of a long wizard, the first and last labels give way first as the frame narrows, the immediate neighbours hold on longer, and the active label is always kept. Step with Previous / Next and the priorities re-centre on the new active step - the nearest labels grow back as the furthest give way. Labels stay full while the strip has room, so freed space is reused rather than left empty. Collapsed labels stay in the accessibility tree (clipped, never removed), so every step button keeps its accessible name, and the strip clips in flow instead of growing a horizontal scrollbar. Tune the falloff with <code>--cngx-step-shrink-weight</code>.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['behavior'],
  apiComponents: ['CngxStepper', 'CngxStep', 'CngxStepContent'],
  moduleImports: [
    "import { CngxStep, CngxStepContent, provideStepperConfigAt, withStepperDensity } from '@cngx/common/stepper';",
    "import { CngxStepper } from '@cngx/ui/stepper';",
  ],
  imports: ['CngxStepper', 'CngxStep', 'CngxStepContent'],
  viewProviders: ["provideStepperConfigAt(withStepperDensity('auto'))"],
  setup: `protected readonly active = signal(2);
  protected readonly steps = ['Account details', 'Billing address', 'Payment method', 'Review order', 'Confirmation'];`,
  setupChrome: `  protected handleNext(): void {
    this.active.update((i) => Math.min(i + 1, this.steps.length - 1));
  }
  protected handlePrev(): void {
    this.active.update((i) => Math.max(i - 1, 0));
  }`,
  template: `  <div style="resize: horizontal; overflow: hidden; min-width: 320px; max-width: 100%; width: 560px;">
    <cngx-stepper [(activeStepIndex)]="active" aria-label="Checkout wizard">
      @for (label of steps; track label) {
        <div cngxStep [label]="label">
          <ng-template cngxStepContent><p>{{ label }} step.</p></ng-template>
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
    <div class="event-row"><span class="event-value">Narrow the frame: the labels furthest from the active step collapse first, no scrollbar appears.</span></div>
  </div>`,
};
