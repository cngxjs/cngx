import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepper: focus-driven group collapse',
  subtitle:
    'Only the group holding the active step shows its children; every other <code>cngxStepGroup</code> collapses to its header node with <code>aria-expanded="false"</code>. Opt in via <code>provideStepperConfigAt(withStepperGroupCollapse(\'expand-active\'))</code> in <code>viewProviders</code>; per-instance, no global config.',
  description:
    'A stepper is an ordered sequence, so overflow is never a menu. Under <code>groupCollapse: \'expand-active\'</code> the strip keeps every group header visible (the roadmap stays intact) and folds non-active branches to a single node, reflowing once per group crossing. Step the wizard with Previous / Next: entering the Project group expands it and collapses Account; landing on the trailing Finish step (a root-level step, so no group is active) leaves every group folded. Panels for collapsed steps stay in the DOM behind <code>[hidden]</code>, so no step id is removed.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'behavior'],
  apiComponents: ['CngxStepper', 'CngxStepGroup', 'CngxStep', 'CngxStepContent'],
  moduleImports: [
    "import { CngxStep, CngxStepContent, CngxStepGroup, provideStepperConfigAt, withStepperGroupCollapse } from '@cngx/common/stepper';",
    "import { CngxStepper } from '@cngx/ui/stepper';",
  ],
  imports: ['CngxStepper', 'CngxStep', 'CngxStepContent', 'CngxStepGroup'],
  viewProviders: ["provideStepperConfigAt(withStepperGroupCollapse('expand-active'))"],
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
