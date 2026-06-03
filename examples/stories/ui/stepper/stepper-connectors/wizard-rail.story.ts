import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepper: classic + [connectors] wizard rail',
  subtitle:
    'Opt the classic skin into the canonical wizard look via <code>[connectors]="true"</code>: disc on top, label stacked below, full-width rail between adjacent disc centers. Per-segment color cascades from the preceding step\'s <code>[data-state]</code> - 100% CSS, no derivation.',
  description:
    'The connector flag pivots the classic strip from inline (label beside disc) to the stacked wizard layout (label below disc) with equal-flex slots and a rail connecting disc centers. The rule is double-scoped on <code>[data-skin=\'classic\']</code> so non-classic skins each keep their own decoration. App-wide default available via <code>provideStepperConfig(withStepperConnectors(true))</code>.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  apiComponents: ['CngxStepper', 'CngxStep', 'CngxStepContent'],
  moduleImports: [
    "import { CngxStep, CngxStepContent } from '@cngx/common/stepper';",
    "import { CngxStepper } from '@cngx/ui/stepper';",
  ],
  imports: ['CngxStepper', 'CngxStep', 'CngxStepContent'],
  setup: `protected readonly active = signal(0);`,
  setupChrome: `  protected handleNext(): void {
    this.active.update(i => Math.min(i + 1, 3));
  }
  protected handlePrev(): void {
    this.active.update(i => Math.max(i - 1, 0));
  }`,
  template: `  <cngx-stepper [(activeStepIndex)]="active" [connectors]="true" aria-label="Account setup">
    <div cngxStep label="Method" [completed]="active() > 0">
      <ng-template cngxStepContent>
        <p>Choose how to sign in - email, SSO, or magic link.</p>
      </ng-template>
    </div>
    <div cngxStep label="Details" [completed]="active() > 1">
      <ng-template cngxStepContent>
        <p>Provide the basics: display name, locale, avatar.</p>
      </ng-template>
    </div>
    <div cngxStep label="Verify" [completed]="active() > 2">
      <ng-template cngxStepContent>
        <p>Confirm the email address with the code we sent.</p>
      </ng-template>
    </div>
    <div cngxStep label="Complete">
      <ng-template cngxStepContent>
        <p>Setup complete - jump into the dashboard.</p>
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
