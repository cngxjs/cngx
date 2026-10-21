import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepper: custom dot body in the dots collapse',
  subtitle:
    "A <code>*cngxDotStepperDot</code> template projected into <code>&lt;cngx-stepper&gt;</code> replaces the body of each dot once the strip collapses to dots. The frame is narrower than 30rem, so the dot row is on screen from the start.",
  description:
    "The dot slot resolves the same cascade on both dot hosts: a projected <code>*cngxDotStepperDot</code> wins over <code>withDotStepperDotTemplate(...)</code>, and without either the dot keeps its empty body. The context carries <code>index</code>, <code>active</code>, <code>completed</code> and the step <code>node</code>. The dot button stays library-owned - its <code>aria-label</code>, <code>aria-current</code> and roving tabindex do not change - so the template is decoration: the stepper renders it inside an <code>aria-hidden</code> wrapper.",
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  apiComponents: ['CngxStepper', 'CngxStep', 'CngxStepContent', 'CngxDotStepperDot'],
  moduleImports: [
    "import { CngxDotStepperDot, CngxStep, CngxStepContent, provideStepperConfigAt, withStepperMobileCollapse } from '@cngx/common/stepper';",
    "import { CngxStepper } from '@cngx/ui/stepper';",
  ],
  imports: ['CngxStepper', 'CngxStep', 'CngxStepContent', 'CngxDotStepperDot'],
  viewProviders: ["provideStepperConfigAt(withStepperMobileCollapse('dots'))"],
  setup: `protected readonly active = signal(0);`,
  setupChrome: `  protected handleNext(): void {
    this.active.update(i => Math.min(i + 1, 2));
  }
  protected handlePrev(): void {
    this.active.update(i => Math.max(i - 1, 0));
  }`,
  template: `  <div style="width: 20rem; max-width: 100%;">
    <cngx-stepper [(activeStepIndex)]="active" aria-label="Checkout">
      <ng-template cngxDotStepperDot let-active="active" let-completed="completed">
        @if (active) {
          <svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true">
            <path d="M5 0l3 5-3 5-3-5z" fill="currentColor"/>
          </svg>
        } @else if (completed) {
          <svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true">
            <path d="M2 5l2 2 4-4" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
          </svg>
        }
      </ng-template>
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
