import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepper: vertical sidebar layout',
  subtitle: 'Same component, only <code>[orientation]</code> changes. The presenter forwards the value to <code>CngxRovingTabindex</code> so the keyboard semantics swap with the layout.',
  description: 'Layout variant: <code>[orientation]="vertical"</code> switches the strip into a left rail and uses ArrowUp/ArrowDown for keyboard navigation. Same step structure as the horizontal demo so the variant difference is the only variable.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern', 'visual-variants'],
  references: [
    { label: 'WAI-ARIA APG - Roving tabindex', href: 'https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#kbd_roving_tabindex' },
  ],
  apiComponents: [
    'CngxStepper',
    'CngxStep',
    'CngxStepContent',
  ],
  moduleImports: [
    'import { CngxStep, CngxStepContent } from \'@cngx/common/stepper\';',
    'import { CngxStepper } from \'@cngx/ui/stepper\';',
  ],
  imports: ['CngxStepper', 'CngxStep', 'CngxStepContent'],
  setup: `protected readonly active = signal(0);`,
  template: `  <cngx-stepper [(activeStepIndex)]="active" [orientation]="'vertical'" aria-label="Account setup">
    <div cngxStep label="Profile" [completed]="active() > 0">
      <ng-template cngxStepContent>
        <p>Set your display name and avatar.</p>
      </ng-template>
    </div>
    <div cngxStep label="Notifications" [completed]="active() > 1">
      <ng-template cngxStepContent>
        <p>Choose which events should email you.</p>
      </ng-template>
    </div>
    <div cngxStep label="Security" [completed]="active() > 2">
      <ng-template cngxStepContent>
        <p>Enable two-factor authentication.</p>
      </ng-template>
    </div>
    <div cngxStep label="Done">
      <ng-template cngxStepContent>
        <p>You are ready to go.</p>
      </ng-template>
    </div>
  </cngx-stepper>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px"><div class="event-row"><span class="event-label">Active step</span><span class="event-value">{{ active() }}</span></div></div>`,
};
