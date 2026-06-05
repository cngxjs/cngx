import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepper: all 7 skins side-by-side',
  subtitle:
    'Every skin (classic + 6 variants) shares one <code>active</code> index so the same step state renders across all seven at once. Use Prev/Next or click a header - every row moves together, completed/active/upcoming stay in sync.',
  description:
    'Canonical reference for design review. Each row uses identical structure (3 steps, same labels) and only the <code>skin</code> input differs, so reviewers can spot layout shifts, alignment drift, or contrast regressions across skins by eye. The shared index keeps every skin on the same step, and <code>[completed]</code> is derived from <code>active</code> so the state is honest as you navigate. Toggle "simulate error" to flag Step 2 in every skin at once - the error cue rides each skin\'s own treatment (disc, tile, pill, or text).',
  level: 'organism',
  audience: ['design', 'a11y', 'dev'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition', 'error-handling'],
  apiComponents: ['CngxStepper', 'CngxStep'],
  moduleImports: [
    "import { CngxStep } from '@cngx/common/stepper';",
    "import { CngxStepper } from '@cngx/ui/stepper';",
  ],
  imports: ['CngxStepper', 'CngxStep'],
  setup: `protected readonly active = signal(1);
  protected readonly step2Invalid = signal(true);`,
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
        <div cngxStep label="Step 2" [completed]="active() > 1" [error]="step2Invalid()"></div>
        <div cngxStep label="Step 3"></div>
      </cngx-stepper>
    </section>
    <section>
      <h3>linear-minimal</h3>
      <cngx-stepper [(activeStepIndex)]="active" skin="linear-minimal" aria-label="Linear minimal">
        <div cngxStep label="Step 1" [completed]="active() > 0"></div>
        <div cngxStep label="Step 2" [completed]="active() > 1" [error]="step2Invalid()"></div>
        <div cngxStep label="Step 3"></div>
      </cngx-stepper>
    </section>
    <section>
      <h3>stripe-status-rich</h3>
      <cngx-stepper [(activeStepIndex)]="active" skin="stripe-status-rich" aria-label="Stripe status rich">
        <div cngxStep label="Step 1" [completed]="active() > 0"></div>
        <div cngxStep label="Step 2" [completed]="active() > 1" [error]="step2Invalid()"></div>
        <div cngxStep label="Step 3"></div>
      </cngx-stepper>
    </section>
    <section>
      <h3>path-chevron</h3>
      <cngx-stepper [(activeStepIndex)]="active" skin="path-chevron" aria-label="Path chevron">
        <div cngxStep label="Step 1" [completed]="active() > 0"></div>
        <div cngxStep label="Step 2" [completed]="active() > 1" [error]="step2Invalid()"></div>
        <div cngxStep label="Step 3"></div>
      </cngx-stepper>
    </section>
    <section>
      <h3>pill-segment</h3>
      <cngx-stepper [(activeStepIndex)]="active" skin="pill-segment" aria-label="Pill segment">
        <div cngxStep label="Step 1" [completed]="active() > 0"></div>
        <div cngxStep label="Step 2" [completed]="active() > 1" [error]="step2Invalid()"></div>
        <div cngxStep label="Step 3"></div>
      </cngx-stepper>
    </section>
    <section>
      <h3>chips</h3>
      <cngx-stepper [(activeStepIndex)]="active" skin="chips" aria-label="Chips">
        <div cngxStep label="Step 1" [completed]="active() > 0"></div>
        <div cngxStep label="Step 2" [completed]="active() > 1" [error]="step2Invalid()"></div>
        <div cngxStep label="Step 3"></div>
      </cngx-stepper>
    </section>
    <section>
      <h3>breadcrumb</h3>
      <cngx-stepper [(activeStepIndex)]="active" skin="breadcrumb" aria-label="Breadcrumb">
        <div cngxStep label="Step 1" [completed]="active() > 0"></div>
        <div cngxStep label="Step 2" [completed]="active() > 1" [error]="step2Invalid()"></div>
        <div cngxStep label="Step 3"></div>
      </cngx-stepper>
    </section>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px;gap:8px">
    <div class="event-row">
      <button type="button" class="chip" (click)="handlePrev()">Previous</button>
      <button type="button" class="chip" (click)="handleNext()">Next</button>
      <label style="margin-inline-start:12px"><input type="checkbox" [checked]="step2Invalid()" (change)="step2Invalid.set($any($event.target).checked)" /> simulate error</label>
    </div>
    <div class="event-row"><span class="event-label">Active step</span><span class="event-value">{{ active() }}</span></div>
  </div>`,
};
