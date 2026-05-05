import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Stepper — linear mode',
  navLabel: 'Linear',
  navCategory: 'stepper',
  description:
    'Bind <code>[linear]="true"</code> to enforce sequential progression: the user must complete each step in order before advancing. Steps are toggled <code>completed</code> via the per-step <code>state</code> aggregator (here exposed via per-step checkboxes for the demo). The strip\'s <code>aria-disabled</code> + <code>aria-current</code> reflect the editability rule reactively — non-completed forward steps reject clicks, but past completed steps remain navigable.',
  apiComponents: ['CngxStepper'],
  moduleImports: [
    "import { CngxStep, CngxStepContent } from '@cngx/common/stepper';",
    "import { CngxStepper } from '@cngx/ui/stepper';",
  ],
  setup: `
  protected readonly active = signal(0);
  protected readonly completed = signal<readonly boolean[]>([false, false, false]);

  protected toggleCompleted(index: number, value: boolean): void {
    this.completed.update((prev) => prev.map((v, i) => (i === index ? value : v)));
  }
  `,
  sections: [
    {
      title: 'Linear gating with completion checkboxes',
      subtitle:
        'Tick the per-step "complete" checkbox to unlock the next step. Linear mode enforces ordering — clicks on non-completed forward steps are rejected by the presenter; past completed steps remain editable.',
      imports: ['CngxStepper', 'CngxStep', 'CngxStepContent'],
      template: `
  <cngx-stepper [(activeStepIndex)]="active" [linear]="true" aria-label="Linear wizard">
    <div cngxStep label="Profile" [completed]="completed()[0]">
      <ng-template cngxStepContent>
        <p>Set your display name and avatar.</p>
        <label>
          <input type="checkbox"
                 [checked]="completed()[0]"
                 (change)="toggleCompleted(0, $any($event.target).checked)" />
          Profile complete
        </label>
      </ng-template>
    </div>
    <div cngxStep label="Notifications" [completed]="completed()[1]">
      <ng-template cngxStepContent>
        <p>Choose which events should email you.</p>
        <label>
          <input type="checkbox"
                 [checked]="completed()[1]"
                 (change)="toggleCompleted(1, $any($event.target).checked)" />
          Notifications complete
        </label>
      </ng-template>
    </div>
    <div cngxStep label="Done" [completed]="completed()[2]">
      <ng-template cngxStepContent>
        <p>Wizard finished — uncheck a previous step to revisit.</p>
        <label>
          <input type="checkbox"
                 [checked]="completed()[2]"
                 (change)="toggleCompleted(2, $any($event.target).checked)" />
          Done
        </label>
      </ng-template>
    </div>
  </cngx-stepper>
  <div class="event-grid" style="margin-top:var(--demo-grid-gap, 12px)">
    <div class="event-row"><span class="event-label">Active step</span><span class="event-value">{{ active() }}</span></div>
    <div class="event-row"><span class="event-label">Completed</span><span class="event-value">{{ completed().join(', ') }}</span></div>
  </div>`,
    },
  ],
};
