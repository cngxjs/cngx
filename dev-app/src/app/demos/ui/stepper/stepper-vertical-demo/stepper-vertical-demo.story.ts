import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Stepper — vertical',
  navLabel: 'Vertical',
  navCategory: 'stepper',
  description:
    '<code>[orientation]="\'vertical\'"</code> swaps the layout to a 2-column grid: strip in the sidebar, panels on the right. ArrowUp/ArrowDown for keyboard nav.',
  apiComponents: ['CngxStepper', 'CngxStep', 'CngxStepContent'],
  moduleImports: [
    "import { CngxStep, CngxStepContent } from '@cngx/common/stepper';",
    "import { CngxStepper } from '@cngx/ui/stepper';",
  ],
  setup: `
  protected readonly active = signal(0);
  `,
  sections: [
    {
      title: 'Vertical sidebar layout',
      subtitle:
        'Same component, only <code>[orientation]</code> changes. The presenter forwards the value to <code>CngxRovingTabindex</code> so the keyboard semantics swap with the layout.',
      imports: ['CngxStepper', 'CngxStep', 'CngxStepContent'],
      template: `
  <cngx-stepper [(activeStepIndex)]="active" [orientation]="'vertical'" aria-label="Account setup">
    <div cngxStep label="Profile">
      <ng-template cngxStepContent>
        <p>Set your display name and avatar.</p>
      </ng-template>
    </div>
    <div cngxStep label="Notifications">
      <ng-template cngxStepContent>
        <p>Choose which events should email you.</p>
      </ng-template>
    </div>
    <div cngxStep label="Security">
      <ng-template cngxStepContent>
        <p>Enable two-factor authentication.</p>
      </ng-template>
    </div>
    <div cngxStep label="Done">
      <ng-template cngxStepContent>
        <p>You are ready to go.</p>
      </ng-template>
    </div>
  </cngx-stepper>
  <div class="event-grid" style="margin-top:12px"><div class="event-row"><span class="event-label">Active step</span><span class="event-value">{{ active() }}</span></div></div>`,
    },
  ],
};
