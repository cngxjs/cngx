import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxDotStepper: custom dot body via <code>*cngxDotStepperDot</code>',
  subtitle:
    'Override each dot body with an inline SVG keyed on <code>active</code> / <code>completed</code>. The span shell stays library-owned (<code>role="presentation"</code>, <code>aria-current</code>, class modifiers); only the inner body content swaps.',
  description:
    'The Phase D <code>CngxDotStepperDot</code> slot directive replaces the empty default body with consumer markup. Active dot fills with a diamond glyph, completed dots carry a check, upcoming dots stay empty. Slot context: <code>{ index, node, active, completed }</code> - the dot stepper does not surface step error/busy state so the context strips to four fields.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  apiComponents: ['CngxDotStepper', 'CngxStep', 'CngxDotStepperDot'],
  moduleImports: [
    "import { CngxStep, CngxDotStepperDot } from '@cngx/common/stepper';",
    "import { CngxDotStepper } from '@cngx/ui/stepper';",
  ],
  imports: ['CngxDotStepper', 'CngxStep', 'CngxDotStepperDot'],
  setup: `protected readonly active = signal(1);`,
  setupChrome: `  protected handleNext(): void {
    this.active.update(i => Math.min(i + 1, 3));
  }
  protected handlePrev(): void {
    this.active.update(i => Math.max(i - 1, 0));
  }`,
  template: `  <cngx-dot-stepper
    [(activeStepIndex)]="active"
    aria-label="Icon dots"
  >
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
    <div cngxStep label="Step 1"></div>
    <div cngxStep label="Step 2"></div>
    <div cngxStep label="Step 3"></div>
    <div cngxStep label="Step 4"></div>
  </cngx-dot-stepper>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px;gap:8px">
    <div class="event-row">
      <button type="button" class="chip" (click)="handlePrev()">Previous</button>
      <button type="button" class="chip" (click)="handleNext()">Next</button>
    </div>
    <div class="event-row"><span class="event-label">Active step</span><span class="event-value">{{ active() }}</span></div>
  </div>`,
};
