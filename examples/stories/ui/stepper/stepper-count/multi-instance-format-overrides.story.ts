import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepperCount: per-instance format + chip composition',
  subtitle:
    'Two <code>&lt;cngx-stepper-count&gt;</code> atoms inside the same stepper - one inline caption under the heading, one chip badge on the right. The chip styling comes from composing <code>&lt;cngx-chip&gt;</code> around the atom, not from a stepper-side variant input.',
  description:
    'The same data (active step / total steps) routes through two siblings with different format closures. The inline atom uses the default <code>i18n.textStepperFormat</code> ("Step 1 of 4"). The chip atom passes a per-instance <code>[format]</code> closure that renders "N/M complete" and opts out of <code>aria-live</code> via <code>[live]="false"</code> so screen readers do not double-announce the same step transition. Library stays composition-first: no <code>[variant]</code> input on the count atom, no chip-style baked into the stepper.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  apiComponents: ['CngxStepper', 'CngxStep', 'CngxStepContent', 'CngxStepperCount', 'CngxChip'],
  moduleImports: [
    "import { CngxStep, CngxStepContent, CngxStepperCount } from '@cngx/common/stepper';",
    "import { CngxChip } from '@cngx/common/display';",
    "import { CngxStepper } from '@cngx/ui/stepper';",
  ],
  imports: ['CngxStepper', 'CngxStep', 'CngxStepContent', 'CngxStepperCount', 'CngxChip'],
  setup: `protected readonly active = signal(0);
  protected readonly completeFormat = (current: number, total: number) =>
    \`\${current - 1}/\${total} complete\`;`,
  setupChrome: `  protected handleNext(): void {
    this.active.update(i => Math.min(i + 1, 3));
  }
  protected handlePrev(): void {
    this.active.update(i => Math.max(i - 1, 0));
  }`,
  template: `  <header style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:16px">
    <div style="display:grid;gap:2px">
      <h3 style="margin:0;font-size:1rem">Pipeline configuration</h3>
      <cngx-stepper-count [host]="s.presenter" style="font-size:0.8125rem;opacity:0.7" />
    </div>
    <cngx-chip>
      <cngx-stepper-count [host]="s.presenter" [live]="false" [format]="completeFormat" />
    </cngx-chip>
  </header>
  <cngx-stepper #s="cngxStepper" [(activeStepIndex)]="active" aria-label="Pipeline configuration">
    <div cngxStep label="Source">
      <ng-template cngxStepContent><p>Pick a data source.</p></ng-template>
    </div>
    <div cngxStep label="Transform">
      <ng-template cngxStepContent><p>Map fields and clean rows.</p></ng-template>
    </div>
    <div cngxStep label="Schedule">
      <ng-template cngxStepContent><p>Set a cron and timezone.</p></ng-template>
    </div>
    <div cngxStep label="Review">
      <ng-template cngxStepContent><p>Confirm and deploy.</p></ng-template>
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
