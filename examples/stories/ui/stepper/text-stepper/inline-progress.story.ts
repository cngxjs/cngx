import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTextStepper: inline progress',
  subtitle: 'Smallest possible stepper. One <code>&lt;span aria-live="polite"&gt;</code> reads "Step N of M". The same <code>cngxSwipe</code> composition as the dot carousel drives it - swipe is indicator-agnostic, the text variant reflects the index just the same.',
  description: 'Three-step flow with the text stepper inline beside a heading. Swipe the panel left/right (CngxSwipe on the content, axis-pinned) or use the buttons. Toggle [showCurrentLabel] to append the active step label after the count. Toggle "simulate error" to flag the Payment step - the indicator surfaces the error on its own line beneath the count, even while a different step is active.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern', 'behavior', 'error-handling'],
  apiComponents: ['CngxTextStepper', 'CngxStep', 'CngxSwipe'],
  moduleImports: [
    'import { CngxStep } from \'@cngx/common/stepper\';',
    'import { CngxSwipe, type SwipeDirection } from \'@cngx/common/interactive\';',
    'import { CngxTextStepper } from \'@cngx/ui/stepper\';',
  ],
  imports: ['CngxTextStepper', 'CngxStep', 'CngxSwipe'],
  setup: `protected readonly active = signal(0);
  protected readonly showLabel = signal(false);
  protected readonly paymentInvalid = signal(false);
  protected readonly panels = [
    { heading: 'Customer', body: 'Enter the shipping name, address, and contact email.' },
    { heading: 'Payment', body: 'Choose card, bank, or invoice; confirm the billing address.' },
    { heading: 'Review', body: 'Confirm the cart and submit the order.' },
  ];

  protected onSwipe(direction: SwipeDirection): void {
    if (direction === 'left') {
      this.handleNext();
    } else if (direction === 'right') {
      this.handlePrev();
    }
  }
  protected handleNext(): void {
    this.active.update(i => Math.min(i + 1, 2));
  }
  protected handlePrev(): void {
    this.active.update(i => Math.max(i - 1, 0));
  }`,
  setupChrome: `  protected toggleLabel(): void {
    this.showLabel.update(v => !v);
  }`,
  template: `  <article style="display:grid;gap:12px">
    <header style="display:flex;align-items:baseline;gap:12px">
      <h3 style="margin:0">Checkout</h3>
      <cngx-text-stepper
        [(activeStepIndex)]="active"
        [showCurrentLabel]="showLabel()"
      >
        <div cngxStep label="Customer"></div>
        <div cngxStep label="Payment" [error]="paymentInvalid()"></div>
        <div cngxStep label="Review"></div>
      </cngx-text-stepper>
    </header>
    @let panel = panels[active()];
    <!-- Same swipe composition as the dot carousel: CngxSwipe on the
         content, the text indicator just reflects activeStepIndex. -->
    <section
      cngxSwipe
      axis="x"
      (swiped)="onSwipe($event)"
      aria-live="polite"
      style="display:grid;gap:4px;min-height:64px;touch-action:pan-y"
    >
      <h4 style="margin:0">{{ panel.heading }}</h4>
      <p style="margin:0">{{ panel.body }}</p>
    </section>
  </article>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px;gap:8px">
    <div class="event-row">
      <button type="button" class="chip" (click)="handlePrev()">Previous</button>
      <button type="button" class="chip" (click)="handleNext()">Next</button>
      <button type="button" class="chip" (click)="toggleLabel()">Toggle label</button>
      <label style="margin-inline-start:12px"><input type="checkbox" [checked]="paymentInvalid()" (change)="paymentInvalid.set($any($event.target).checked)" /> simulate error</label>
    </div>
    <div class="event-row"><span class="event-label">Active step</span><span class="event-value">{{ active() }}</span></div>
    <div class="event-row"><span class="event-label">Show label</span><span class="event-value">{{ showLabel() }}</span></div>
  </div>`,
};
