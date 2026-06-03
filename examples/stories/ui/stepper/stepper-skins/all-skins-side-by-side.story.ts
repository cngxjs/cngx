import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepper: all 5 skins side-by-side',
  subtitle:
    'Every skin (classic + 4 new) shares one <code>active</code> index so the same step state renders across all five at once. Use Prev/Next or click a header - every row moves together, completed/active/upcoming stay in sync.',
  description:
    'Canonical reference for design review. Each row uses identical structure (3 steps, same labels) and only the <code>skin</code> input differs, so reviewers can spot layout shifts, alignment drift, or contrast regressions across skins by eye. The shared index keeps every skin on the same step, and <code>[completed]</code> is derived from <code>active</code> so the state is honest as you navigate.',
  level: 'organism',
  audience: ['design', 'a11y', 'dev'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  apiComponents: ['CngxStepper', 'CngxStep'],
  moduleImports: [
    "import { CngxStep } from '@cngx/common/stepper';",
    "import { CngxStepper } from '@cngx/ui/stepper';",
  ],
  imports: ['CngxStepper', 'CngxStep'],
  setup: `protected readonly active = signal(1);`,
  setupChrome: `  protected handleNext(): void {
    this.active.update(i => Math.min(i + 1, 2));
  }
  protected handlePrev(): void {
    this.active.update(i => Math.max(i - 1, 0));
  }`,
  template: `  <div class="cngx-stepper-side-by-side">
    <section>
      <h3>classic</h3>
      <cngx-stepper [(activeStepIndex)]="active" aria-label="Classic skin">
        <div cngxStep label="Step 1" [completed]="active() > 0"></div>
        <div cngxStep label="Step 2" [completed]="active() > 1"></div>
        <div cngxStep label="Step 3"></div>
      </cngx-stepper>
    </section>
    <section>
      <h3>linear-minimal</h3>
      <cngx-stepper [(activeStepIndex)]="active" skin="linear-minimal" aria-label="Linear minimal">
        <div cngxStep label="Step 1" [completed]="active() > 0"></div>
        <div cngxStep label="Step 2" [completed]="active() > 1"></div>
        <div cngxStep label="Step 3"></div>
      </cngx-stepper>
    </section>
    <section>
      <h3>stripe-status-rich</h3>
      <cngx-stepper [(activeStepIndex)]="active" skin="stripe-status-rich" aria-label="Stripe status rich">
        <div cngxStep label="Step 1" [completed]="active() > 0"></div>
        <div cngxStep label="Step 2" [completed]="active() > 1"></div>
        <div cngxStep label="Step 3"></div>
      </cngx-stepper>
    </section>
    <section>
      <h3>path-chevron</h3>
      <cngx-stepper [(activeStepIndex)]="active" skin="path-chevron" aria-label="Path chevron">
        <div cngxStep label="Step 1" [completed]="active() > 0"></div>
        <div cngxStep label="Step 2" [completed]="active() > 1"></div>
        <div cngxStep label="Step 3"></div>
      </cngx-stepper>
    </section>
    <section>
      <h3>pill-segment</h3>
      <cngx-stepper [(activeStepIndex)]="active" skin="pill-segment" aria-label="Pill segment">
        <div cngxStep label="Step 1" [completed]="active() > 0"></div>
        <div cngxStep label="Step 2" [completed]="active() > 1"></div>
        <div cngxStep label="Step 3"></div>
      </cngx-stepper>
    </section>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px;gap:8px">
    <div class="event-row">
      <button type="button" class="chip" (click)="handlePrev()">Previous</button>
      <button type="button" class="chip" (click)="handleNext()">Next</button>
    </div>
    <div class="event-row"><span class="event-label">Active step</span><span class="event-value">{{ active() }}</span></div>
  </div>`,
};
