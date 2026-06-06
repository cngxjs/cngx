import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStep: direct [error] + *cngxStepError slot',
  subtitle:
    'Flag a step as invalid with a single <code>[error]</code> input - <code>true</code> for state only, or a string that doubles as the inline message. No <code>&lt;fieldset cngxErrorAggregator&gt;</code> / <code>cngxErrorSource</code> scaffolding. The <code>*cngxStepError</code> slot themes the message on the classic and stripe-status-rich skins.',
  description:
    'Toggle "simulate error" to put the Payment step into the error state via [error]="invalid() ? \'Card declined\' : false". The reason renders in the label area through the *cngxStepError slot; remove the slot and the resolved message still shows via the built-in default. This is the path end users should reach for - the errorAggregator stays the power tool for genuine multi-source validation.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['a11y-pattern', 'error-handling'],
  apiComponents: ['CngxStepper', 'CngxStep', 'CngxStepError'],
  moduleImports: [
    "import { CngxStep, CngxStepError } from '@cngx/common/stepper';",
    "import { CngxStepper } from '@cngx/ui/stepper';",
  ],
  imports: ['CngxStepper', 'CngxStep', 'CngxStepError'],
  setup: `protected readonly active = signal(1);
  protected readonly invalid = signal(true);`,
  setupChrome: `  protected handleNext(): void {
    this.active.update(i => Math.min(i + 1, 2));
  }
  protected handlePrev(): void {
    this.active.update(i => Math.max(i - 1, 0));
  }`,
  template: `  <cngx-stepper [(activeStepIndex)]="active" skin="stripe-status-rich" aria-label="Payment">
    <div cngxStep label="Customer" [completed]="active() > 0"></div>
    <div cngxStep label="Payment" [error]="invalid() ? 'Card declined' : false"></div>
    <div cngxStep label="Review"></div>

    <ng-template cngxStepError let-message="message">
      <span style="display:inline-flex;align-items:center;gap:4px">
        <span aria-hidden="true">!</span>{{ message }}
      </span>
    </ng-template>
  </cngx-stepper>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px;gap:8px">
    <div class="event-row">
      <button type="button" class="chip" (click)="handlePrev()">Previous</button>
      <button type="button" class="chip" (click)="handleNext()">Next</button>
      <label style="margin-inline-start:12px"><input type="checkbox" [checked]="invalid()" (change)="invalid.set($any($event.target).checked)" /> simulate error</label>
    </div>
    <div class="event-row"><span class="event-label">Active step</span><span class="event-value">{{ active() }}</span></div>
    <div class="event-row"><span class="event-label">Payment invalid</span><span class="event-value">{{ invalid() }}</span></div>
  </div>`,
};
