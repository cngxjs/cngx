import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepper: stripe-status-rich skin',
  subtitle:
    'Numbered disc + status pill under each step. Pill text flows from <code>CngxStepperI18n.statusLabels</code>; this demo overrides the four pill labels to German via <code>provideStepperI18n(withStepperI18nLabels(...))</code> in <code>viewProviders</code>.',
  description:
    'The stripe-status-rich skin paints each step with its label, the classic numbered indicator, and a decorative status pill keyed to the step state (upcoming / in progress / done / errored). The pill text is purely decorative - the actual status surfaces to assistive tech through <code>aria-current="step"</code> and <code>data-state</code> on the indicator, both unchanged from the classic skin. Consumers override pill labels per locale via <code>withStepperI18nLabels({ statusLabels: { done: "Erledigt", ... } })</code>; partial overrides keep un-overridden labels in English.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'a11y-pattern', 'composition'],
  references: [
    { label: 'WAI-ARIA 1.2 - aria-current', href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-current' },
  ],
  apiComponents: ['CngxStepper', 'CngxStep', 'CngxStepContent'],
  moduleImports: [
    "import { CngxStep, CngxStepContent, provideStepperI18n, withStepperI18nLabels } from '@cngx/common/stepper';",
    "import { CngxStepper } from '@cngx/ui/stepper';",
  ],
  imports: ['CngxStepper', 'CngxStep', 'CngxStepContent'],
  viewProviders: [
    `provideStepperI18n(
      withStepperI18nLabels({
        statusLabels: {
          done: 'Erledigt',
          inProgress: 'Aktiv',
          upNext: 'Folgt',
          errored: 'Fehler',
        },
      }),
    )`,
  ],
  setup: `protected readonly active = signal(1);`,
  setupChrome: `  protected handleNext(): void {
    this.active.update(i => Math.min(i + 1, 3));
  }
  protected handlePrev(): void {
    this.active.update(i => Math.max(i - 1, 0));
  }`,
  template: `  <cngx-stepper [(activeStepIndex)]="active" skin="stripe-status-rich" aria-label="Order">
    <div cngxStep label="Customer" [completed]="active() > 0">
      <ng-template cngxStepContent>
        <p>Enter customer details - name, email, shipping address.</p>
      </ng-template>
    </div>
    <div cngxStep label="Payment" [completed]="active() > 1">
      <ng-template cngxStepContent>
        <p>Choose a payment method and confirm the billing address.</p>
      </ng-template>
    </div>
    <div cngxStep label="Shipping" [completed]="active() > 2">
      <ng-template cngxStepContent>
        <p>Pick a shipping option.</p>
      </ng-template>
    </div>
    <div cngxStep label="Confirm">
      <ng-template cngxStepContent>
        <p>Review the order before placing it.</p>
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
