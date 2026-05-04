import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Stepper — horizontal',
  navLabel: 'Horizontal',
  navCategory: 'stepper',
  description:
    '<code>&lt;cngx-stepper&gt;</code> in horizontal orientation (default). Strip + panels stacked. Reactive ARIA + roving tabindex via composed host-directives.',
  apiComponents: ['CngxStepper'],
  moduleImports: [
    "import { CngxStep, CngxStepContent } from '@cngx/common/stepper';",
    "import { CngxStepper } from '@cngx/ui/stepper';",
  ],
  setup: `
  protected readonly active = signal(0);

  protected handleNext(): void {
    this.active.update(i => Math.min(i + 1, 2));
  }
  protected handlePrev(): void {
    this.active.update(i => Math.max(i - 1, 0));
  }
  `,
  sections: [
    {
      title: 'Three-step wizard',
      subtitle:
        'Bind <code>[(activeStepIndex)]</code> for two-way control. Click any step header or use ArrowLeft/ArrowRight to navigate. Tab leaves the strip.',
      imports: ['CngxStepper', 'CngxStep', 'CngxStepContent'],
      template: `
  <cngx-stepper [(activeStepIndex)]="active" aria-label="Order wizard">
    <div cngxStep label="Customer">
      <ng-template cngxStepContent>
        <p>Enter customer details — name, email, shipping address.</p>
      </ng-template>
    </div>
    <div cngxStep label="Payment">
      <ng-template cngxStepContent>
        <p>Choose a payment method and confirm billing address.</p>
      </ng-template>
    </div>
    <div cngxStep label="Review">
      <ng-template cngxStepContent>
        <p>Review the order before placing it.</p>
      </ng-template>
    </div>
  </cngx-stepper>
  <div class="event-grid" style="margin-top:12px;gap:8px">
    <div class="event-row">
      <button type="button" class="chip" (click)="handlePrev()">Previous</button>
      <button type="button" class="chip" (click)="handleNext()">Next</button>
    </div>
    <div class="event-row"><span class="event-label">Active step</span><span class="event-value">{{ active() }}</span></div>
  </div>`,
    },
  ],
};
