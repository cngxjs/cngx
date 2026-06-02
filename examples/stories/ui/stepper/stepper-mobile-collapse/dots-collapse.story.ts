import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepper: mobile auto-collapse (dots mode)',
  subtitle:
    'Resize below 480px - the classic strip collapses to an inline row of dot buttons instead of the default text. Opt in via <code>provideStepperConfigAt(withStepperMobileCollapse(\'dots\'))</code> in <code>viewProviders</code>; per-instance, no global config required.',
  description:
    'The mobile auto-collapse policy ships three modes: <code>\'text\'</code> (default, renders the count inline), <code>\'dots\'</code> (renders a clickable dot row), and <code>\'off\'</code> (keeps the classic strip on every viewport). This demo scopes the dots mode to the demo via <code>provideStepperConfigAt</code> so the choice is local; same component, same step atoms, same ARIA contract.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'behavior'],
  apiComponents: ['CngxStepper', 'CngxStep', 'CngxStepContent'],
  moduleImports: [
    "import { CngxStep, CngxStepContent, provideStepperConfigAt, withStepperMobileCollapse } from '@cngx/common/stepper';",
    "import { CngxStepper } from '@cngx/ui/stepper';",
  ],
  imports: ['CngxStepper', 'CngxStep', 'CngxStepContent'],
  viewProviders: ['provideStepperConfigAt(withStepperMobileCollapse(\'dots\'))'],
  setup: `protected readonly active = signal(0);`,
  setupChrome: `  protected handleNext(): void {
    this.active.update(i => Math.min(i + 1, 2));
  }
  protected handlePrev(): void {
    this.active.update(i => Math.max(i - 1, 0));
  }`,
  template: `  <cngx-stepper [(activeStepIndex)]="active" aria-label="Checkout">
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
  </cngx-stepper>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px;gap:8px">
    <div class="event-row">
      <button type="button" class="chip" (click)="handlePrev()">Previous</button>
      <button type="button" class="chip" (click)="handleNext()">Next</button>
    </div>
    <div class="event-row"><span class="event-label">Active step</span><span class="event-value">{{ active() }}</span></div>
  </div>`,
};
