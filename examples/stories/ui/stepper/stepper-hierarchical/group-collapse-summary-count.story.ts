import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepper: collapsed-group summary (count mode)',
  subtitle:
    'The collapsed-group summary badge is configurable. Here <code>withStepperGroupCollapseSummary(\'count\')</code> shows each folded group\'s step count instead of the default <code>completed/total</code> progress.',
  description:
    'A collapsed <code>cngxStepGroup</code> header carries a summary badge so a folded branch still tells you something. The mode is a per-instance config axis: <code>\'progress\'</code> (default, completed/total), <code>\'count\'</code> (this demo, the step count), <code>\'status\'</code> (a dot coloured by the group\'s rolled-up state), or <code>\'off\'</code> (bare label). The badge is decorative; the group\'s status phrase is announced to assistive tech separately. Step with Previous / Next: the count rides whichever group is folded.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'behavior'],
  apiComponents: ['CngxStepper', 'CngxStepGroup', 'CngxStep', 'CngxStepContent'],
  moduleImports: [
    "import { CngxStep, CngxStepContent, CngxStepGroup, provideStepperConfigAt, withStepperGroupCollapse, withStepperGroupCollapseSummary } from '@cngx/common/stepper';",
    "import { CngxStepper } from '@cngx/ui/stepper';",
  ],
  imports: ['CngxStepper', 'CngxStep', 'CngxStepContent', 'CngxStepGroup'],
  viewProviders: [
    "provideStepperConfigAt(withStepperGroupCollapse('expand-active'), withStepperGroupCollapseSummary('count'))",
  ],
  setup: `protected readonly active = signal(0);`,
  setupChrome: `  protected handleNext(): void {
    this.active.update(i => Math.min(i + 1, 4));
  }
  protected handlePrev(): void {
    this.active.update(i => Math.max(i - 1, 0));
  }`,
  template: `  <cngx-stepper [(activeStepIndex)]="active" aria-label="Project setup">
    <div cngxStepGroup label="Account">
      <div cngxStep label="Profile">
        <ng-template cngxStepContent><p>Display name + avatar.</p></ng-template>
      </div>
      <div cngxStep label="Preferences">
        <ng-template cngxStepContent><p>Notification preferences.</p></ng-template>
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
