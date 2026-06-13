import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepper: focus-driven group collapse',
  subtitle:
    'Only the group holding the active step shows its children; every other <code>cngxStepGroup</code> folds to its header node. The fold is a density cue, not a disclosure widget. Opt in via <code>provideStepperConfigAt(withStepperGroupCollapse(\'expand-active\'))</code> in <code>viewProviders</code>; per-instance, no global config.',
  description:
    'A stepper is an ordered sequence, so overflow is never a menu. Under <code>groupCollapse: \'expand-active\'</code> the strip keeps every group header visible (the roadmap stays intact) and folds non-active branches to a single node, reflowing once per group crossing. A collapsed group header carries a summary badge - <code>completed/total</code> by default, configurable to a step count, a status dot, or off via <code>withStepperGroupCollapseSummary(\'progress\' | \'count\' | \'status\' | \'off\')</code> - so a folded branch still reveals its progress. Each step binds <code>[completed]</code> once you advance past it, so a folded group\'s <code>completed/total</code> badge climbs from <code>0/2</code> as you go. Step the wizard with Previous / Next: entering the Project group expands it and collapses Account; landing on the trailing Finish step (a root-level step, so no group is active) leaves every group folded. Panels for collapsed steps stay in the DOM behind <code>[hidden]</code>, so no step id is removed, and every step stays reachable in sequence. The readout reads each group\'s reactive <code>isCollapsed()</code> signal off its <code>#group="cngxStepGroup"</code> reference.',
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
    <div cngxStepGroup label="Account" #accountGroup="cngxStepGroup">
      <div cngxStep label="Profile" [completed]="active() > 0">
        <ng-template cngxStepContent><p>Display name + avatar.</p></ng-template>
      </div>
      <div cngxStep label="Preferences" [completed]="active() > 1">
        <ng-template cngxStepContent><p>Notification preferences.</p></ng-template>
      </div>
    </div>
    <div cngxStepGroup label="Project" #projectGroup="cngxStepGroup">
      <div cngxStep label="Repository" [completed]="active() > 2">
        <ng-template cngxStepContent><p>Connect a Git repository.</p></ng-template>
      </div>
      <div cngxStep label="Pipeline" [completed]="active() > 3">
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
    <div class="event-row"><span class="event-label">Account collapsed</span><span class="event-value">{{ accountGroup.isCollapsed() }}</span></div>
    <div class="event-row"><span class="event-label">Project collapsed</span><span class="event-value">{{ projectGroup.isCollapsed() }}</span></div>
  </div>`,
};
