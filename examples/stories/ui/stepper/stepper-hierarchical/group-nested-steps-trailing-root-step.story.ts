import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepper: group nested steps trailing root step',
  subtitle: 'The strip walks the tree depth-first. Panels render only for terminal steps; group headers occupy slots in the strip but do not host a panel.',
  description: 'Tree composition: two <code>cngxStepGroup</code> branches (Account, Project) and a trailing flat <code>cngxStep</code> (Finish). Group headers expose <code>role="group" aria-roledescription="step group"</code> so AT can navigate the hierarchy.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition'],
  apiComponents: [
    'CngxStepper',
    'CngxStepGroup',
    'CngxStep',
    'CngxStepContent',
  ],
  moduleImports: [
    'import { CngxStep, CngxStepContent, CngxStepGroup } from \'@cngx/common/stepper\';',
    'import { CngxStepper } from \'@cngx/ui/stepper\';',
  ],
  imports: ['CngxStepper', 'CngxStep', 'CngxStepContent', 'CngxStepGroup'],
  setup: `protected readonly active = signal(0);`,
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
  templateChrome: `<div class="event-grid" style="margin-top:12px"><div class="event-row"><span class="event-label">Active step</span><span class="event-value">{{ active() }}</span></div></div>`,
};
