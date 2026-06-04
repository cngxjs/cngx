import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepper: Material theme coverage across all skins',
  subtitle:
    'Each of the 7 skins rendered against a Material 3 palette. The Material color mixin (<code>@cngx/themes/material/stepper-theme</code>) maps every skin-specific custom property to its semantic <code>--mat-sys-*</code> token, so consumers opting into Material see palette-aware steppers regardless of which skin they pick.',
  description:
    'Demonstrates that the six variant skins (linear-minimal, stripe-status-rich, path-chevron, pill-segment, chips, breadcrumb) flow through the Material bridge mixin without any consumer-side workarounds. Each stepper sits inside the same Material themed wrapper and inherits primary / error / surface / tertiary palette tokens via the cngx custom-property cascade. The classic skin remains the reference point.',
  level: 'organism',
  audience: ['design', 'dev'],
  artifact: 'standalone',
  focus: ['visual-variants', 'integration'],
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
  template: `  <div class="cngx-stepper-mat-theme-coverage">
    <section>
      <h3>classic</h3>
      <cngx-stepper [(activeStepIndex)]="active" aria-label="Classic skin">
        <div cngxStep label="Customer" [completed]="active() > 0"></div>
        <div cngxStep label="Payment" [completed]="active() > 1"></div>
        <div cngxStep label="Review"></div>
      </cngx-stepper>
    </section>
    <section>
      <h3>linear-minimal</h3>
      <cngx-stepper [(activeStepIndex)]="active" skin="linear-minimal" aria-label="Linear minimal">
        <div cngxStep label="Customer" [completed]="active() > 0"></div>
        <div cngxStep label="Payment" [completed]="active() > 1"></div>
        <div cngxStep label="Review"></div>
      </cngx-stepper>
    </section>
    <section>
      <h3>stripe-status-rich</h3>
      <cngx-stepper [(activeStepIndex)]="active" skin="stripe-status-rich" aria-label="Stripe status rich">
        <div cngxStep label="Customer" [completed]="active() > 0"></div>
        <div cngxStep label="Payment" [completed]="active() > 1"></div>
        <div cngxStep label="Review"></div>
      </cngx-stepper>
    </section>
    <section>
      <h3>path-chevron</h3>
      <cngx-stepper [(activeStepIndex)]="active" skin="path-chevron" aria-label="Path chevron">
        <div cngxStep label="Customer" [completed]="active() > 0"></div>
        <div cngxStep label="Payment" [completed]="active() > 1"></div>
        <div cngxStep label="Review"></div>
      </cngx-stepper>
    </section>
    <section>
      <h3>pill-segment</h3>
      <cngx-stepper [(activeStepIndex)]="active" skin="pill-segment" aria-label="Pill segment">
        <div cngxStep label="Customer" [completed]="active() > 0"></div>
        <div cngxStep label="Payment" [completed]="active() > 1"></div>
        <div cngxStep label="Review"></div>
      </cngx-stepper>
    </section>
    <section>
      <h3>chips</h3>
      <cngx-stepper [(activeStepIndex)]="active" skin="chips" aria-label="Chips">
        <div cngxStep label="Customer" [completed]="active() > 0"></div>
        <div cngxStep label="Payment" [completed]="active() > 1"></div>
        <div cngxStep label="Review"></div>
      </cngx-stepper>
    </section>
    <section>
      <h3>breadcrumb</h3>
      <cngx-stepper [(activeStepIndex)]="active" skin="breadcrumb" aria-label="Breadcrumb">
        <div cngxStep label="Customer" [completed]="active() > 0"></div>
        <div cngxStep label="Payment" [completed]="active() > 1"></div>
        <div cngxStep label="Review"></div>
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
