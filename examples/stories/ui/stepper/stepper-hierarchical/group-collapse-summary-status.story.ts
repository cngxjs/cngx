import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepper: collapsed-group summary (status mode)',
  subtitle:
    'With <code>withStepperGroupCollapseSummary(\'status\')</code> a folded group shows a dot coloured by its rolled-up state instead of a text badge.',
  description:
    'Each collapsed <code>cngxStepGroup</code> header carries a dot in the colour of the group\'s aggregated state: success once every child step is completed, error as soon as one child step reports an error, neutral otherwise. The dot is decorative; the group\'s status phrase is announced to assistive tech separately. The demo starts on the trailing root step so every group is folded. Step back with Previous to unfold a group: its dot goes away while it is open.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  apiComponents: ['CngxStepper', 'CngxStepGroup', 'CngxStep', 'CngxStepContent'],
  moduleImports: [
    "import { CngxStep, CngxStepContent, CngxStepGroup, provideStepperConfigAt, withStepperGroupCollapse, withStepperGroupCollapseSummary } from '@cngx/common/stepper';",
    "import { CngxStepper } from '@cngx/ui/stepper';",
  ],
  imports: ['CngxStepper', 'CngxStep', 'CngxStepContent', 'CngxStepGroup'],
  viewProviders: [
    "provideStepperConfigAt(withStepperGroupCollapse('expand-active'), withStepperGroupCollapseSummary('status'))",
  ],
  setup: `protected readonly active = signal(6);`,
  setupChrome: `  protected handleNext(): void {
    this.active.update(i => Math.min(i + 1, 6));
  }
  protected handlePrev(): void {
    this.active.update(i => Math.max(i - 1, 0));
  }`,
  template: `  <cngx-stepper [(activeStepIndex)]="active" aria-label="Project setup">
    <div cngxStepGroup label="Account">
      <div cngxStep label="Profile" [completed]="true">
        <ng-template cngxStepContent><p>Display name + avatar.</p></ng-template>
      </div>
      <div cngxStep label="Preferences" [completed]="true">
        <ng-template cngxStepContent><p>Notification preferences.</p></ng-template>
      </div>
    </div>
    <div cngxStepGroup label="Billing">
      <div cngxStep label="Plan" [completed]="true">
        <ng-template cngxStepContent><p>Pick a plan.</p></ng-template>
      </div>
      <div cngxStep label="Payment" error="Card declined">
        <ng-template cngxStepContent><p>Card details.</p></ng-template>
      </div>
    </div>
    <div cngxStepGroup label="Project">
      <div cngxStep label="Repository">
        <ng-template cngxStepContent><p>Connect a Git repository.</p></ng-template>
      </div>
      <div cngxStep label="Pipeline">
        <ng-template cngxStepContent><p>Pick a CI provider.</p></ng-template>
      </div>
    </div>
    <div cngxStep label="Finish">
      <ng-template cngxStepContent><p>Review and submit.</p></ng-template>
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
