import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepper: mobile auto-collapse',
  subtitle:
    "Drag the dashed frame's corner below 30rem - the stepper reads its own container, not the window, so it collapses in a sidebar or dialog at any window size. The classic strip collapses to <code>&lt;cngx-text-stepper&gt;</code> - the default mobile policy, so this demo wires nothing. Override app-wide with <code>withStepperMobileCollapse('dots')</code> or <code>'off'</code>.",
  description:
    'Default mobile-collapse policy ships as "text". Toggle the viewport width to see the strip swap. Panels stay visible across both modes.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'behavior'],
  apiComponents: ['CngxStepper', 'CngxStep', 'CngxStepContent'],
  moduleImports: [
    "import { CngxStep, CngxStepContent } from '@cngx/common/stepper';",
    "import { CngxStepper } from '@cngx/ui/stepper';",
  ],
  imports: ['CngxStepper', 'CngxStep', 'CngxStepContent'],
  setup: `protected readonly active = signal(0);`,
  setupChrome: `  protected handleNext(): void {
    this.active.update(i => Math.min(i + 1, 2));
  }
  protected handlePrev(): void {
    this.active.update(i => Math.max(i - 1, 0));
  }`,
  template: `  <div style="resize: horizontal; overflow: hidden; min-width: 16rem; max-width: 100%; width: 40rem; padding: 8px; border: 1px dashed var(--cngx-color-border, #d1d5db);">
    <cngx-stepper [(activeStepIndex)]="active" aria-label="Checkout">
      <div cngxStep label="Customer">
        <ng-template cngxStepContent>
          <p>Customer details panel.</p>
        </ng-template>
      </div>
      <div cngxStep label="Payment">
        <ng-template cngxStepContent>
          <p>Payment method panel.</p>
        </ng-template>
      </div>
      <div cngxStep label="Review">
        <ng-template cngxStepContent>
          <p>Final review panel.</p>
        </ng-template>
      </div>
    </cngx-stepper>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px;gap:8px">
    <div class="event-row">
      <button type="button" class="chip" (click)="handlePrev()">Previous</button>
      <button type="button" class="chip" (click)="handleNext()">Next</button>
    </div>
    <div class="event-row"><span class="event-label">Active step</span><span class="event-value">{{ active() }}</span></div>
  </div>`,
};
