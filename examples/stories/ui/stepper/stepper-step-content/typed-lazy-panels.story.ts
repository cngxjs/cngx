import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStep + CngxStepContent: typed lazy panels',
  subtitle: 'Each <code>*cngxStepContent</code> is a real <code>ng-template</code> with a typed context - bind <code>let-index</code> (1-based step number), <code>let-active</code>, <code>let-busy</code>, <code>let-disabled</code>. Only the active step\'s panel is instantiated; the others never enter the DOM.',
  description: 'Foregrounds the step/content pair rather than the organism: CngxStep carries the label, CngxStepContent projects a lazily rendered panel whose typed context exposes live step state. The panel reads its own index and active flag straight from the context, no parent wiring.',
  level: 'molecule',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['composition', 'behavior'],
  apiComponents: [
    'CngxStep',
    'CngxStepContent',
    'CngxStepper',
  ],
  moduleImports: [
    'import { CngxStep, CngxStepContent } from \'@cngx/common/stepper\';',
    'import { CngxStepper } from \'@cngx/ui/stepper\';',
  ],
  imports: ['CngxStepper', 'CngxStep', 'CngxStepContent'],
  setup: `protected readonly active = signal(0);`,
  setupChrome: `  protected handleNext(): void {
    this.active.update(i => Math.min(i + 1, 2));
  }
  protected handlePrev(): void {
    this.active.update(i => Math.max(i - 1, 0));
  }`,
  template: `  <cngx-stepper [(activeStepIndex)]="active" aria-label="Account setup">
    <div cngxStep label="Profile">
      <ng-template cngxStepContent let-index="index" let-active="active">
        <p>Step {{ index }} of 3 - profile basics. Rendered active: {{ active }}.</p>
      </ng-template>
    </div>
    <div cngxStep label="Security">
      <ng-template cngxStepContent let-index="index" let-active="active">
        <p>Step {{ index }} of 3 - password and two-factor. Rendered active: {{ active }}.</p>
      </ng-template>
    </div>
    <div cngxStep label="Confirm">
      <ng-template cngxStepContent let-index="index" let-active="active">
        <p>Step {{ index }} of 3 - review and confirm. Rendered active: {{ active }}.</p>
      </ng-template>
    </div>
  </cngx-stepper>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px;gap:8px">
    <div class="event-row">
      <button type="button" class="chip" (click)="handlePrev()">Previous</button>
      <button type="button" class="chip" (click)="handleNext()">Next</button>
    </div>
    <div class="event-row"><span class="event-label">Active panel index</span><span class="event-value">{{ active() }}</span></div>
  </div>`,
};
